import { MarketSignal, PurchasedHolding } from '../types';

/**
 * Fallback target/stop-loss multipliers used ONLY when a signal/holding's
 * sellZone or stopLoss text can't be parsed (missing, or not in the expected
 * "T1: ₹X" / "₹X" format). App.tsx's price-alert engine, CandlestickChart.tsx,
 * and RiskCalculatorView.tsx each used to hand-roll their own guess at this
 * fallback (1.015/1.05/1.038 for target, 0.98/0.985/0.975 for stop-loss) —
 * harmless while every real signal parses cleanly, but a real divergence
 * that would silently disagree the moment one didn't. One shared constant.
 */
export const FALLBACK_TARGET_MULTIPLIER = 1.015;
export const FALLBACK_STOP_LOSS_MULTIPLIER = 0.98;

export interface HoldingMetrics {
  livePrice: number;
  investedAmount: number;
  currentValue: number;
  pnl: number;
  pnlPct: number;
  target1: number;
  stopLossPrice: number;
  targetProgress: number;
  isTargetHit: boolean;
}

/**
 * Single source of truth for live P&L / target math on a purchased holding,
 * shared by BeginnerSummaryView, PortfolioView, and StockStudioView so the
 * same holding can never show three different numbers (they previously each
 * computed this independently, including a target-1 fallback that diverged
 * between purchasePrice*1.015 and purchasePrice*1.04 depending on the page).
 */
export function computeHoldingMetrics(
  holding: PurchasedHolding,
  matchingSignal?: MarketSignal | null,
  liveTickerPrice?: number
): HoldingMetrics {
  // Precedence: a real AI-generated signal's price (freshest, if one was
  // ever generated for this symbol) > the live ticker feed (kept in sync
  // for every tracked symbol regardless of whether a signal exists) >
  // purchase price as an absolute last resort. Falling straight to
  // purchasePrice whenever no signal existed meant any holding bought
  // without going through the manual "Generate Signal" flow — every
  // position the autonomous trading engine opens, for example — displayed
  // a permanently frozen "live" price and a fake 0.00% P&L forever.
  const livePrice = matchingSignal?.currentPrice ?? liveTickerPrice ?? holding.purchasePrice;
  const investedAmount = holding.purchasePrice * holding.quantity;
  const currentValue = livePrice * holding.quantity;
  const pnl = currentValue - investedAmount;
  const pnlPct = investedAmount > 0 ? (pnl / investedAmount) * 100 : 0;

  // sellZone/stopLoss are typed as strings, but a caller merging this holding
  // into a display object (or a bad/legacy DB row, since both DB columns are
  // nullable) can hand back a number or null at runtime despite the type
  // annotation — a real instance of exactly this crashed the whole app with
  // "holding.stopLoss.replace is not a function" (PortfolioView.tsx used to
  // overwrite the string stopLoss with a numeric display value before passing
  // the same object into the sell flow, which re-enters this function).
  // Coercing to a string here makes this function safe regardless of what a
  // caller passes, on top of fixing the actual corruption at its source.
  const sellZoneText = typeof holding.sellZone === 'string' ? holding.sellZone : '';
  const stopLossText = typeof holding.stopLoss === 'string' ? holding.stopLoss : '';

  // sellZone is formatted "T1: ₹1,320 | T2: ₹1,345" — a bare digit-run match
  // also matches the "1"/"2" inside the "T1"/"T2" labels themselves, which
  // silently parsed every real target as `1` (so isTargetHit was true for
  // virtually any live price). Try the labeled extraction first.
  const labeledT1 = sellZoneText.match(/T1:\s*₹?([\d,]+(\.\d+)?)/);
  const zoneNumbers = sellZoneText.replace(/,/g, '').match(/\d+(\.\d+)?/g);
  const target1 = holding.targetPriceNum
    ?? (labeledT1 ? parseFloat(labeledT1[1].replace(/,/g, ''))
      : zoneNumbers && zoneNumbers.length > 0 ? parseFloat(zoneNumbers[0]) : holding.purchasePrice * FALLBACK_TARGET_MULTIPLIER);

  // `stopLossPriceNum` is essentially never set on a normal (non-imported)
  // purchase — the real stop-loss chosen at signal-generation time only ever
  // reaches the holding as `stopLoss` display text (e.g. "₹1,268"). Falling
  // straight to a generic purchasePrice*0.98 here, without first trying to
  // parse that text, meant the number shown on Portfolio/Market Hub disagreed
  // with the actual stop-loss App.tsx's alert engine fires STOP_LOSS_HIT on.
  const slNumbers = stopLossText.replace(/,/g, '').match(/\d+(\.\d+)?/g);
  const stopLossPrice = holding.stopLossPriceNum
    ?? (slNumbers && slNumbers.length > 0 ? parseFloat(slNumbers[0]) : holding.purchasePrice * FALLBACK_STOP_LOSS_MULTIPLIER);

  const priceDelta = livePrice - holding.purchasePrice;
  const targetDelta = target1 - holding.purchasePrice;
  const targetProgress = targetDelta > 0
    ? Math.min(100, Math.max(0, Math.round((priceDelta / targetDelta) * 100)))
    : 0;

  const isTargetHit = livePrice >= target1;

  return { livePrice, investedAmount, currentValue, pnl, pnlPct, target1, stopLossPrice, targetProgress, isTargetHit };
}
