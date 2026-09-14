import { Router } from 'express';
import { db } from '../db/connection';
import { requireAuth } from '../middleware/requireAuth';
import { listHoldings, createHolding, decrementOrDeleteHolding, deleteHolding, getHolding, updateHoldingTradeType, updateHoldingLevels, correctHoldingPurchase, type HoldingRow, type TradeType } from '../db/holdings.repo';
import { listCapitalRecords, adjustCapital, setCapitalAbsolute, type CapitalRecordRow } from '../db/capital.repo';
import { createJournalEntry, serializeJournalEntry } from '../db/journal.repo';
import { getUserById } from '../db/users.repo';

export const portfolioRouter = Router();
portfolioRouter.use(requireAuth);

export function serializeHolding(h: HoldingRow) {
  return {
    id: h.id,
    symbol: h.symbol,
    stockName: h.stock_name,
    purchasePrice: h.purchase_price,
    quantity: h.quantity,
    currency: h.currency,
    sellZone: h.sell_zone,
    stopLoss: h.stop_loss,
    probableTimeWindow: h.probable_time_window,
    targetPriceNum: h.target_price_num,
    stopLossPriceNum: h.stop_loss_price_num,
    tradeType: h.trade_type,
    source: h.source,
    purchasedAt: h.purchased_at
  };
}

const VALID_TRADE_TYPES: TradeType[] = ['INTRADAY', 'DELIVERY'];
const VALID_CURRENCIES = ['INR', 'USD'];

export function serializeCapitalRecord(r: CapitalRecordRow) {
  return {
    id: r.id,
    amount: r.amount,
    type: r.type,
    resultingCapital: r.resulting_capital,
    note: r.note,
    createdAt: r.created_at
  };
}

portfolioRouter.get('/state', (req, res) => {
  const userId = req.user!.id;
  res.json({
    success: true,
    capital: req.user!.capital,
    capitalRecords: listCapitalRecords(userId).map(serializeCapitalRecord),
    holdings: listHoldings(userId).map(serializeHolding)
  });
});

portfolioRouter.post('/capital', (req, res) => {
  const userId = req.user!.id;
  const { amountToAdd, setTo, note } = req.body || {};

  try {
    let nextCapital: number;
    if (typeof setTo === 'number' && Number.isFinite(setTo)) {
      if (setTo < 0) {
        return res.status(400).json({ success: false, error: 'setTo cannot be negative.' });
      }
      nextCapital = setCapitalAbsolute(userId, setTo, note);
    } else if (typeof amountToAdd === 'number' && Number.isFinite(amountToAdd)) {
      if (amountToAdd <= 0) {
        return res.status(400).json({ success: false, error: 'amountToAdd must be positive — this endpoint only records deposits.' });
      }
      nextCapital = adjustCapital(userId, amountToAdd, 'DEPOSIT', note || 'Capital Deposit');
    } else {
      return res.status(400).json({ success: false, error: 'Provide amountToAdd or setTo as a number.' });
    }
    res.json({ success: true, capital: nextCapital });
  } catch (err: any) {
    console.error('Error in /api/portfolio/capital:', err);
    res.status(500).json({ success: false, error: 'Could not update capital.' });
  }
});

portfolioRouter.post('/buy', (req, res) => {
  const userId = req.user!.id;
  const { symbol, stockName, purchasePrice, quantity, signal, tradeType } = req.body || {};

  if (typeof symbol !== 'string' || typeof stockName !== 'string' || !Number.isFinite(purchasePrice) || !Number.isFinite(quantity)) {
    return res.status(400).json({ success: false, error: 'symbol, stockName, purchasePrice and quantity are required.' });
  }
  if (purchasePrice <= 0 || quantity <= 0) {
    return res.status(400).json({ success: false, error: 'purchasePrice and quantity must be positive.' });
  }
  if (!Number.isInteger(quantity)) {
    return res.status(400).json({ success: false, error: 'quantity must be a whole number of shares.' });
  }
  if (tradeType !== undefined && !VALID_TRADE_TYPES.includes(tradeType)) {
    return res.status(400).json({ success: false, error: "tradeType must be 'INTRADAY' or 'DELIVERY' if provided." });
  }
  // signal.currency is client-supplied and was passed straight to
  // createHolding() unchecked, unlike tradeType two lines above — an
  // arbitrary string would persist forever with no way to fix except a
  // direct DB edit, then get echoed back verbatim by every endpoint that
  // serializes this holding.
  if (signal?.currency !== undefined && !VALID_CURRENCIES.includes(signal.currency)) {
    return res.status(400).json({ success: false, error: "signal.currency must be 'INR' or 'USD' if provided." });
  }
  // Same gap as signal.currency above: unlike /holdings/:id/levels (which
  // validates these two exact fields with Number.isFinite(...) && ... > 0
  // before writing), this route passed them straight to createHolding()
  // unchecked. `?? null` does NOT filter out NaN, so a caller could persist
  // a NaN/Infinity/negative target or stop-loss permanently into the
  // holdings row, silently degrading every later comparison against it
  // (including the auto-trading engine's own exit checks on this holding).
  if (signal?.targetPriceNum !== undefined && (!Number.isFinite(signal.targetPriceNum) || signal.targetPriceNum <= 0)) {
    return res.status(400).json({ success: false, error: 'signal.targetPriceNum must be a positive number if provided.' });
  }
  if (signal?.stopLossPriceNum !== undefined && (!Number.isFinite(signal.stopLossPriceNum) || signal.stopLossPriceNum <= 0)) {
    return res.status(400).json({ success: false, error: 'signal.stopLossPriceNum must be a positive number if provided.' });
  }
  for (const field of ['sellZone', 'stopLoss', 'probableTimeWindow'] as const) {
    if (signal?.[field] !== undefined && typeof signal[field] !== 'string') {
      return res.status(400).json({ success: false, error: `signal.${field} must be a string if provided.` });
    }
  }

  // Rounded like every other money figure here (pnl/pnlPercent below) —
  // otherwise float multiplication (e.g. a fractional purchasePrice times
  // quantity) can leave trailing binary-decimal garbage that accumulates in
  // the capital ledger across repeated buy/sell cycles.
  const totalCost = Math.round(purchasePrice * quantity * 100) / 100;
  const user = getUserById(userId)!;
  if (totalCost > user.capital) {
    return res.status(400).json({
      success: false,
      error: `This purchase (${totalCost.toFixed(2)}) exceeds your available capital (${user.capital.toFixed(2)}).`
    });
  }

  try {
    // One transaction: a holding must never be created without its matching
    // capital debit landing too, even if the process dies mid-request.
    const { holding, nextCapital } = db.transaction(() => {
      const h = createHolding(userId, {
        symbol,
        stockName,
        purchasePrice,
        quantity,
        currency: signal?.currency || 'INR',
        sellZone: signal?.sellZone,
        stopLoss: signal?.stopLoss,
        probableTimeWindow: signal?.probableTimeWindow,
        targetPriceNum: signal?.targetPriceNum,
        stopLossPriceNum: signal?.stopLossPriceNum,
        tradeType
      });
      const cap = adjustCapital(userId, -totalCost, 'PURCHASE_DEBIT', `Bought ${quantity} ${symbol}`);
      return { holding: h, nextCapital: cap };
    })();

    res.json({ success: true, holding: serializeHolding(holding), capital: nextCapital });
  } catch (err: any) {
    console.error('Error in /api/portfolio/buy:', err);
    res.status(500).json({ success: false, error: 'Could not record purchase.' });
  }
});

portfolioRouter.post('/sell', (req, res) => {
  const userId = req.user!.id;
  const { holdingId, sellPrice, quantitySold } = req.body || {};

  if (typeof holdingId !== 'string' || !Number.isFinite(sellPrice) || !Number.isFinite(quantitySold)) {
    return res.status(400).json({ success: false, error: 'holdingId, sellPrice and quantitySold are required.' });
  }
  if (sellPrice <= 0 || quantitySold <= 0) {
    return res.status(400).json({ success: false, error: 'sellPrice and quantitySold must be positive.' });
  }
  if (!Number.isInteger(quantitySold)) {
    return res.status(400).json({ success: false, error: 'quantitySold must be a whole number of shares.' });
  }

  const holding = getHolding(holdingId, userId);
  if (!holding) {
    return res.status(404).json({ success: false, error: 'Holding not found.' });
  }
  if (quantitySold > holding.quantity) {
    return res.status(400).json({ success: false, error: `You only hold ${holding.quantity} shares of ${holding.symbol}.` });
  }

  try {
    const saleRevenue = Math.round(sellPrice * quantitySold * 100) / 100;
    const pnl = Math.round((sellPrice - holding.purchase_price) * quantitySold * 100) / 100;
    const pnlPercent = holding.purchase_price > 0 ? Math.round(((sellPrice - holding.purchase_price) / holding.purchase_price) * 100 * 100) / 100 : 0;

    // One transaction: decrementing/deleting the holding, crediting capital,
    // and logging the journal entry either all land together or none do.
    const { entry, remainingQuantity, nextCapital } = db.transaction(() => {
      // Partial-sell aware: this only removes the holding once its full
      // quantity has been sold (see decrementOrDeleteHolding).
      const remaining = decrementOrDeleteHolding(holdingId, userId, quantitySold);
      const cap = adjustCapital(userId, saleRevenue, 'SALE_CREDIT', `Sold ${quantitySold} ${holding.symbol}`);
      // `boughtAt` was previously never passed here at all, so every
      // real (non-manual) sale recorded bought_at/bought_date/sold_date as
      // NULL — the frontend's CumulativePnLChart then couldn't parse a real
      // sold date, fell through to a UUID-regex match that essentially
      // never succeeds, and plotted every server-recorded sale as "today"
      // regardless of when it actually happened.
      const j = createJournalEntry(userId, {
        holdingId,
        symbol: holding.symbol,
        stockName: holding.stock_name,
        buyPrice: holding.purchase_price,
        sellPrice,
        quantity: quantitySold,
        pnl,
        pnlPercent,
        boughtAt: holding.purchased_at
      });
      return { entry: j, remainingQuantity: remaining, nextCapital: cap };
    })();

    res.json({ success: true, journalEntry: serializeJournalEntry(entry), remainingQuantity, capital: nextCapital });
  } catch (err: any) {
    console.error('Error in /api/portfolio/sell:', err);
    res.status(500).json({ success: false, error: 'Could not record sale.' });
  }
});

// Trade type is decided at purchase but always changeable afterward — a
// real trader's plan for a position often changes after entry.
portfolioRouter.post('/holdings/:id/trade-type', (req, res) => {
  const userId = req.user!.id;
  const { tradeType } = req.body || {};
  if (!VALID_TRADE_TYPES.includes(tradeType)) {
    return res.status(400).json({ success: false, error: "tradeType must be 'INTRADAY' or 'DELIVERY'." });
  }
  const holding = getHolding(req.params.id, userId);
  if (!holding) {
    return res.status(404).json({ success: false, error: 'Holding not found.' });
  }
  const updated = updateHoldingTradeType(req.params.id, userId, tradeType);
  res.json({ success: true, holding: serializeHolding(updated!) });
});

// Lets the user move their stop-loss/target on an open position after entry
// — real position management, not a rewrite of the trade itself. Purchase
// price/quantity/timestamp are never touched by this route.
portfolioRouter.post('/holdings/:id/levels', (req, res) => {
  const userId = req.user!.id;
  const { stopLossPriceNum, targetPriceNum } = req.body || {};

  if (stopLossPriceNum !== undefined && (!Number.isFinite(stopLossPriceNum) || stopLossPriceNum <= 0)) {
    return res.status(400).json({ success: false, error: 'stopLossPriceNum must be a positive number if provided.' });
  }
  if (targetPriceNum !== undefined && (!Number.isFinite(targetPriceNum) || targetPriceNum <= 0)) {
    return res.status(400).json({ success: false, error: 'targetPriceNum must be a positive number if provided.' });
  }
  if (stopLossPriceNum === undefined && targetPriceNum === undefined) {
    return res.status(400).json({ success: false, error: 'Provide stopLossPriceNum and/or targetPriceNum.' });
  }

  const holding = getHolding(req.params.id, userId);
  if (!holding) {
    return res.status(404).json({ success: false, error: 'Holding not found.' });
  }
  const updated = updateHoldingLevels(req.params.id, userId, { stopLossPriceNum, targetPriceNum, currency: holding.currency });
  res.json({ success: true, holding: serializeHolding(updated!) });
});

// Corrects a typo in a MANUALLY-logged purchase price/quantity. Refuses
// outright for an AUTO (engine-executed) holding — that trade happened at a
// real observed price, there's no "typo" to fix, and rewriting it would
// fabricate history rather than correct a data-entry mistake. Reconciles
// capital for the cost difference in the same transaction as the update.
portfolioRouter.post('/holdings/:id/correct-purchase', (req, res) => {
  const userId = req.user!.id;
  const { purchasePrice, quantity } = req.body || {};

  if (purchasePrice !== undefined && (!Number.isFinite(purchasePrice) || purchasePrice <= 0)) {
    return res.status(400).json({ success: false, error: 'purchasePrice must be a positive number if provided.' });
  }
  if (quantity !== undefined && (!Number.isInteger(quantity) || quantity <= 0)) {
    return res.status(400).json({ success: false, error: 'quantity must be a positive whole number if provided.' });
  }
  if (purchasePrice === undefined && quantity === undefined) {
    return res.status(400).json({ success: false, error: 'Provide purchasePrice and/or quantity.' });
  }

  const holding = getHolding(req.params.id, userId);
  if (!holding) {
    return res.status(404).json({ success: false, error: 'Holding not found.' });
  }
  if (holding.source !== 'MANUAL') {
    return res.status(403).json({ success: false, error: 'Only manually-logged holdings can be corrected — this one was executed by the auto-trading engine at a real observed price.' });
  }

  // Reject up front if the correction would need more cash than is free,
  // rather than letting adjustCapital silently floor at 0 and leave the
  // holding showing a corrected price the user never actually had capital
  // for — same affordability check /buy already does before its own debit.
  const oldCost = Math.round(holding.purchase_price * holding.quantity * 100) / 100;
  const newPrice = purchasePrice ?? holding.purchase_price;
  const newQty = quantity ?? holding.quantity;
  const newCost = Math.round(newPrice * newQty * 100) / 100;
  const costDelta = Math.round((newCost - oldCost) * 100) / 100;
  const user = getUserById(userId)!;
  if (costDelta > 0 && costDelta > user.capital) {
    return res.status(400).json({
      success: false,
      error: `This correction needs ${costDelta.toFixed(2)} more capital than you have free (${user.capital.toFixed(2)}).`
    });
  }

  try {
    const { holding: updated, capital } = correctHoldingPurchase(req.params.id, userId, { purchasePrice, quantity });
    res.json({ success: true, holding: serializeHolding(updated), capital });
  } catch (err: any) {
    console.error('Error in /api/portfolio/holdings/:id/correct-purchase:', err);
    res.status(400).json({ success: false, error: err?.message || 'Could not correct this holding.' });
  }
});

// Restricted to MANUAL holdings only, same reasoning and same restriction as
// /correct-purchase above. Found as a real, exploitable bug: this route
// previously worked on ANY holding including AUTO (real, engine-executed)
// ones, refunding the full original cost basis with no journal entry and no
// audit trail at all — meaning a real position that had gone underwater
// could simply be "removed" to fully recover the original capital as if the
// trade never happened, permanently erasing it from the real record (and
// from Journal's aggregate P&L). A MANUAL holding never went through the
// (now-retired) autonomous engine, so
// refunding its exact original debit is just reversing a data-entry
// mistake, not rewriting history — the same distinction /correct-purchase
// already draws.
portfolioRouter.delete('/holdings/:id', (req, res) => {
  const userId = req.user!.id;
  const holding = getHolding(req.params.id, userId);
  if (!holding) {
    return res.status(404).json({ success: false, error: 'Holding not found.' });
  }
  if (holding.source !== 'MANUAL') {
    return res.status(403).json({ success: false, error: 'Only manually-logged holdings can be removed this way — this one was executed by the auto-trading engine at a real observed price. Use "Record Sale" to close it, which logs the real result to your journal.' });
  }
  try {
    const refund = Math.round(holding.purchase_price * holding.quantity * 100) / 100;
    const nextCapital = db.transaction(() => {
      deleteHolding(holding.id, userId);
      return adjustCapital(userId, refund, 'REFUND', `Removed holding ${holding.symbol} without logging a sale`);
    })();
    res.json({ success: true, capital: nextCapital });
  } catch (err: any) {
    console.error('Error deleting holding:', err);
    res.status(500).json({ success: false, error: 'Could not remove holding.' });
  }
});
