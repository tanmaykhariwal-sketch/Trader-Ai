import { RiskCalculatorInput, RiskCalculatorResult } from '../types';

/**
 * Single source of truth for position-size / risk-reward math, shared by
 * RiskCalculatorView and PositionCalculatorModal so the two screens can
 * never disagree on the same inputs (they previously used two different
 * formulas that diverged on an inverted stop-loss/target).
 */
export function calculatePositionSize(input: RiskCalculatorInput): RiskCalculatorResult {
  const { capital, riskPercentage, entryPrice, stopLossPrice, targetPrice } = input;

  const maxRiskAmount = capital * (riskPercentage / 100);
  const perShareRisk = Math.abs(entryPrice - stopLossPrice);
  const positionSizeQty = perShareRisk > 0 ? Math.floor(maxRiskAmount / perShareRisk) : 0;
  const totalPositionValue = positionSizeQty * entryPrice;
  const potentialProfitPerShare = Math.abs(targetPrice - entryPrice);
  const potentialProfitAmount = positionSizeQty * potentialProfitPerShare;
  const riskRewardRatio = perShareRisk > 0
    ? Number((potentialProfitPerShare / perShareRisk).toFixed(2))
    : 0;
  const isAcceptableRR = riskRewardRatio >= 2.0;
  // Math.abs above means an inverted setup (e.g. stop loss placed ABOVE
  // entry) still produces a positive-looking risk/reward number instead of
  // surfacing as an error — confirmed live: entry 1300 / stop loss 1350 /
  // target 1250 (a guaranteed-loss long) rendered "Potential Profit +₹…"
  // and "Risk : Reward 1 : 1.00" with no warning. This flag lets the UI
  // show a real validation error instead of a confident wrong answer.
  const isInvertedSetup = !(stopLossPrice < entryPrice && entryPrice < targetPrice);

  return {
    maxRiskAmount,
    perShareRisk,
    positionSizeQty,
    totalPositionValue,
    potentialProfitAmount,
    riskRewardRatio,
    isAcceptableRR,
    isInvertedSetup,
  };
}
