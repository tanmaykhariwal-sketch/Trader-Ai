import { db } from './connection';
import { randomUUID } from 'crypto';
import { adjustCapital } from './capital.repo';

export type TradeType = 'INTRADAY' | 'DELIVERY';
export type HoldingSource = 'MANUAL' | 'AUTO';

export interface HoldingRow {
  id: string;
  user_id: number;
  symbol: string;
  stock_name: string;
  purchase_price: number;
  quantity: number;
  currency: 'INR' | 'USD';
  sell_zone: string | null;
  stop_loss: string | null;
  probable_time_window: string | null;
  target_price_num: number | null;
  stop_loss_price_num: number | null;
  trade_type: TradeType;
  source: HoldingSource;
  purchased_at: string;
  is_dip_buy_add: number;
}

export function listHoldings(userId: number): HoldingRow[] {
  return db.prepare('SELECT * FROM holdings WHERE user_id = ? ORDER BY purchased_at DESC').all(userId) as HoldingRow[];
}

export function getHolding(id: string, userId: number): HoldingRow | undefined {
  return db.prepare('SELECT * FROM holdings WHERE id = ? AND user_id = ?').get(id, userId) as HoldingRow | undefined;
}

export interface NewHolding {
  symbol: string;
  stockName: string;
  purchasePrice: number;
  quantity: number;
  currency: 'INR' | 'USD';
  sellZone?: string;
  stopLoss?: string;
  probableTimeWindow?: string;
  targetPriceNum?: number;
  stopLossPriceNum?: number;
  tradeType?: TradeType;
  source?: HoldingSource;
  // Marks a lot created by the dip-buy add-on mechanism, not a fresh entry —
  // used to cap dip-buying a given symbol to once per open position (see
  // hasDipBuyAdd below), per explicit user request after seeing the same
  // symbol dip-bought repeatedly across a session.
  isDipBuyAdd?: boolean;
}

export function createHolding(userId: number, h: NewHolding): HoldingRow {
  const id = randomUUID();
  db.prepare(
    `INSERT INTO holdings
      (id, user_id, symbol, stock_name, purchase_price, quantity, currency, sell_zone, stop_loss, probable_time_window, target_price_num, stop_loss_price_num, trade_type, source, is_dip_buy_add)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    userId,
    h.symbol,
    h.stockName,
    h.purchasePrice,
    h.quantity,
    h.currency,
    h.sellZone ?? null,
    h.stopLoss ?? null,
    h.probableTimeWindow ?? null,
    h.targetPriceNum ?? null,
    h.stopLossPriceNum ?? null,
    h.tradeType ?? 'DELIVERY',
    h.source ?? 'MANUAL',
    h.isDipBuyAdd ? 1 : 0
  );
  return getHolding(id, userId)!;
}

/** True if this symbol already has an open lot that was itself a dip-buy
 * add-on — used to cap dip-buying a position to once, per explicit user
 * request ("doing dip buy once is fine, more than once not allowed"). */
export function hasDipBuyAdd(userId: number, symbol: string): boolean {
  const row = db.prepare(
    'SELECT 1 FROM holdings WHERE user_id = ? AND symbol = ? AND is_dip_buy_add = 1 LIMIT 1'
  ).get(userId, symbol);
  return !!row;
}

/** Trade type is decided at purchase but always changeable afterward. */
export function updateHoldingTradeType(id: string, userId: number, tradeType: TradeType): HoldingRow | undefined {
  db.prepare('UPDATE holdings SET trade_type = ? WHERE id = ? AND user_id = ?').run(tradeType, id, userId);
  return getHolding(id, userId);
}

/**
 * Lets a user adjust the stop-loss / target on an already-bought holding —
 * legitimate position management (they got in, and now want to move where
 * they'll get out). Deliberately does NOT touch purchase_price, quantity, or
 * purchased_at: those describe a trade that already executed at a real price
 * and time, and rewriting them would fabricate history rather than manage an
 * open position. Also updates the display strings (stop_loss/sell_zone) so
 * the numeric and text representations of the same level never disagree —
 * this app was fixed earlier for exactly that kind of divergence.
 */
export function updateHoldingLevels(
  id: string,
  userId: number,
  levels: { stopLossPriceNum?: number; targetPriceNum?: number; currency: 'INR' | 'USD' }
): HoldingRow | undefined {
  const currSym = levels.currency === 'INR' ? '₹' : '$';
  const sets: string[] = [];
  const params: (string | number)[] = [];

  // Explicit locale — Node's default (`.toLocaleString()` with no locale
  // arg) depends on the host OS's configured locale, which formatted
  // thousands with a period on this machine ("1.350" instead of "1,350"),
  // silently corrupting every price display. 'en-IN' matches the comma
  // grouping used everywhere else prices are shown in this BSE-focused app.
  if (levels.stopLossPriceNum !== undefined) {
    sets.push('stop_loss_price_num = ?', 'stop_loss = ?');
    params.push(levels.stopLossPriceNum, `${currSym}${levels.stopLossPriceNum.toLocaleString('en-IN')}`);
  }
  if (levels.targetPriceNum !== undefined) {
    sets.push('target_price_num = ?', 'sell_zone = ?');
    params.push(levels.targetPriceNum, `T1: ${currSym}${levels.targetPriceNum.toLocaleString('en-IN')}`);
  }
  if (sets.length === 0) return getHolding(id, userId);

  params.push(id, userId);
  db.prepare(`UPDATE holdings SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`).run(...params);
  return getHolding(id, userId);
}

/**
 * Corrects the purchase price/quantity of a MANUALLY-bought holding — for
 * fixing a genuine typo made when logging the trade, never for rewriting
 * what actually happened. Callers MUST check `holding.source === 'MANUAL'`
 * before calling this — an AUTO holding was executed by the engine at a
 * real observed price/time, and there is no "typo" to correct there. This
 * function itself also refuses if source isn't MANUAL, as a second gate.
 *
 * Reconciles capital: the difference between the new and old total cost is
 * debited/credited in the same transaction, so the holding and the ledger
 * can never drift apart. Caller is expected to have already validated the
 * user has enough free capital to cover an increased cost (mirroring how
 * /buy validates affordability before calling createHolding).
 */
export const correctHoldingPurchase = db.transaction((
  id: string,
  userId: number,
  correction: { purchasePrice?: number; quantity?: number }
): { holding: HoldingRow; capital: number } => {
  const holding = getHolding(id, userId);
  if (!holding) throw new Error('Holding not found.');
  if (holding.source !== 'MANUAL') {
    throw new Error('Only manually-logged holdings can have their purchase price/quantity corrected.');
  }

  const newPrice = correction.purchasePrice ?? holding.purchase_price;
  const newQty = correction.quantity ?? holding.quantity;
  const oldCost = Math.round(holding.purchase_price * holding.quantity * 100) / 100;
  const newCost = Math.round(newPrice * newQty * 100) / 100;
  const costDelta = Math.round((newCost - oldCost) * 100) / 100;

  db.prepare('UPDATE holdings SET purchase_price = ?, quantity = ? WHERE id = ? AND user_id = ?')
    .run(newPrice, newQty, id, userId);
  // capital.repo.ts's own convention is type-implies-sign (PURCHASE_DEBIT is
  // always a negative amount, REFUND always positive) — a downward
  // correction (costDelta < 0) credits money back, so it's a REFUND, not a
  // PURCHASE_DEBIT with a positive amount, which would break that
  // convention for anything that ever comes to rely on it.
  const capitalRecordType = costDelta >= 0 ? 'PURCHASE_DEBIT' : 'REFUND';
  const capital = adjustCapital(userId, -costDelta, capitalRecordType, `Corrected logged purchase for ${holding.symbol} (was ${holding.quantity} @ ${holding.purchase_price})`);

  return { holding: getHolding(id, userId)!, capital };
});

/** Decrements the holding's quantity, deleting it once it reaches zero. Returns
 * the remaining quantity (0 if the holding was fully sold and removed). */
export function decrementOrDeleteHolding(id: string, userId: number, quantitySold: number): number {
  const holding = getHolding(id, userId);
  if (!holding) throw new Error('Holding not found');
  // The current call site (portfolio.routes.ts's /sell) already pre-validates
  // quantitySold <= holding.quantity, so this hasn't been reachable in
  // practice — but the function itself had no
  // defense of its own: an over-large quantitySold made `remaining` negative
  // and took the SAME branch as an exact full sell (silently deleting the
  // lot) instead of surfacing the mismatch, which would let a future caller
  // that skips the pre-check credit sale revenue for more shares than the
  // lot ever had.
  if (quantitySold > holding.quantity) {
    throw new Error(`Cannot sell ${quantitySold} shares — holding only has ${holding.quantity}.`);
  }
  const remaining = holding.quantity - quantitySold;
  if (remaining > 0) {
    db.prepare('UPDATE holdings SET quantity = ? WHERE id = ? AND user_id = ?').run(remaining, id, userId);
    return remaining;
  }
  db.prepare('DELETE FROM holdings WHERE id = ? AND user_id = ?').run(id, userId);
  return 0;
}

export function deleteHolding(id: string, userId: number): void {
  db.prepare('DELETE FROM holdings WHERE id = ? AND user_id = ?').run(id, userId);
}
