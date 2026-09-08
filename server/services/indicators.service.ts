/** Real technical-indicator math computed from actual historical closes —
 * grounds the AI's analysis/prediction signals in genuine price action,
 * not a client-side mock. */

export function sma(values: number[], period: number): number | null {
  if (values.length < period) return null;
  const window = values.slice(values.length - period);
  return window.reduce((a, b) => a + b, 0) / period;
}

export function ema(values: number[], period: number): number | null {
  if (values.length < period) return null;
  const k = 2 / (period + 1);
  let prev = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
  }
  return prev;
}

/** Wilder's RSI(14) — real average-gain/average-loss smoothing, not a
 * simple-average approximation. */
export function rsi(values: number[], period = 14): number | null {
  if (values.length < period + 1) return null;
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const delta = values[i] - values[i - 1];
    if (delta >= 0) avgGain += delta;
    else avgLoss -= delta;
  }
  avgGain /= period;
  avgLoss /= period;
  for (let i = period + 1; i < values.length; i++) {
    const delta = values[i] - values[i - 1];
    const gain = delta > 0 ? delta : 0;
    const loss = delta < 0 ? -delta : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

/** MACD(12,26,9): macd line = EMA12 - EMA26, signal = EMA9 of the macd
 * series, histogram = macd - signal. Returns null until enough closes
 * exist for a real EMA26 + a 9-bar signal smoothing. */
export function macd(values: number[]): { macd: number; signal: number; histogram: number } | null {
  if (values.length < 26 + 9) return null;
  const macdSeries: number[] = [];
  for (let end = 26; end <= values.length; end++) {
    const slice = values.slice(0, end);
    const e12 = ema(slice, 12);
    const e26 = ema(slice, 26);
    if (e12 === null || e26 === null) continue;
    macdSeries.push(e12 - e26);
  }
  if (macdSeries.length < 9) return null;
  const signalLine = ema(macdSeries, 9);
  if (signalLine === null) return null;
  const macdLine = macdSeries[macdSeries.length - 1];
  return { macd: macdLine, signal: signalLine, histogram: macdLine - signalLine };
}

/** Average True Range(14) — Wilder's smoothed average of the real per-candle
 * trading range (accounting for gaps via the true-range formula, not just
 * high-low), used to size stop-loss/target distance to a stock's actual
 * measured volatility instead of a flat percentage of price. A ₹50 move
 * means something very different for a ₹200 stock than a ₹4,000 one; ATR
 * captures that difference directly in the same currency units as price. */
export function atr(candles: { high: number; low: number; close: number }[], period = 14): number | null {
  if (candles.length < period + 1) return null;
  const trueRanges: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const { high, low } = candles[i];
    const prevClose = candles[i - 1].close;
    trueRanges.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)));
  }
  let avg = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < trueRanges.length; i++) {
    avg = (avg * (period - 1) + trueRanges[i]) / period;
  }
  return avg;
}
