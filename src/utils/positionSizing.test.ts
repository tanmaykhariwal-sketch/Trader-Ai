import { describe, expect, it } from 'vitest';
import { calculatePositionSize } from './positionSizing';

describe('calculatePositionSize', () => {
  it('computes shares/risk/reward for a normal long setup', () => {
    const result = calculatePositionSize({
      capital: 100000,
      currency: 'INR',
      riskPercentage: 1,
      entryPrice: 100,
      stopLossPrice: 95,
      targetPrice: 115,
    });

    expect(result.maxRiskAmount).toBe(1000);
    expect(result.perShareRisk).toBe(5);
    expect(result.positionSizeQty).toBe(200);
    expect(result.totalPositionValue).toBe(20000);
    expect(result.potentialProfitAmount).toBe(3000);
    expect(result.riskRewardRatio).toBe(3);
    expect(result.isAcceptableRR).toBe(true);
  });

  it('handles an inverted stop-loss (above entry) the same as a normal one via absolute distance', () => {
    const inverted = calculatePositionSize({
      capital: 100000,
      currency: 'INR',
      riskPercentage: 1,
      entryPrice: 100,
      stopLossPrice: 105, // above entry — previously diverged between the two old calculators
      targetPrice: 115,
    });
    const normal = calculatePositionSize({
      capital: 100000,
      currency: 'INR',
      riskPercentage: 1,
      entryPrice: 100,
      stopLossPrice: 95,
      targetPrice: 115,
    });

    // Same absolute distance (5) in both directions must produce the same risk math.
    expect(inverted.perShareRisk).toBe(normal.perShareRisk);
    expect(inverted.positionSizeQty).toBe(normal.positionSizeQty);
  });

  it('handles an inverted target (below entry) via absolute distance rather than clamping to zero', () => {
    const result = calculatePositionSize({
      capital: 100000,
      currency: 'INR',
      riskPercentage: 1,
      entryPrice: 100,
      stopLossPrice: 95,
      targetPrice: 90, // below entry
    });

    expect(result.potentialProfitAmount).toBeGreaterThan(0);
  });

  it('returns zero position size when entry equals stop-loss (zero risk distance)', () => {
    const result = calculatePositionSize({
      capital: 100000,
      currency: 'INR',
      riskPercentage: 1,
      entryPrice: 100,
      stopLossPrice: 100,
      targetPrice: 115,
    });

    expect(result.perShareRisk).toBe(0);
    expect(result.positionSizeQty).toBe(0);
    expect(result.riskRewardRatio).toBe(0);
  });
});
