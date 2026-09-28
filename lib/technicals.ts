// Free-data technical indicators computed client-side from daily OHLC closes
// (no paid indicator API needed — same inputs the Yahoo chart endpoint gives us).

export function sma(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

export function ema(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (values.length < period) return out;
  const k = 2 / (period + 1);
  let seed = 0;
  for (let i = 0; i < period; i++) seed += values[i];
  seed /= period;
  out[period - 1] = seed;
  let prev = seed;
  for (let i = period; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
}

// EMA over a series that may itself contain leading nulls (e.g. MACD's signal
// line, computed from the MACD line which is null until both EMAs warm up).
function emaOverNullable(values: (number | null)[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  const indices: number[] = [];
  const dense: number[] = [];
  values.forEach((v, i) => { if (v != null) { indices.push(i); dense.push(v); } });
  const denseEma = ema(dense, period);
  denseEma.forEach((v, i) => { if (v != null) out[indices[i]] = v; });
  return out;
}

export function rsi(values: number[], period = 14): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (values.length < period + 1) return out;
  let gainSum = 0, lossSum = 0;
  for (let i = 1; i <= period; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gainSum += diff; else lossSum -= diff;
  }
  let avgGain = gainSum / period, avgLoss = lossSum / period;
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  for (let i = period + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return out;
}

export function macd(values: number[], fast = 12, slow = 26, signalPeriod = 9) {
  const emaFast = ema(values, fast);
  const emaSlow = ema(values, slow);
  const line: (number | null)[] = values.map((_, i) =>
    emaFast[i] != null && emaSlow[i] != null ? emaFast[i]! - emaSlow[i]! : null
  );
  const signal = emaOverNullable(line, signalPeriod);
  const histogram: (number | null)[] = values.map((_, i) =>
    line[i] != null && signal[i] != null ? line[i]! - signal[i]! : null
  );
  return { line, signal, histogram };
}

export function bollinger(values: number[], period = 20, mult = 2) {
  const mid = sma(values, period);
  const upper: (number | null)[] = new Array(values.length).fill(null);
  const lower: (number | null)[] = new Array(values.length).fill(null);
  for (let i = period - 1; i < values.length; i++) {
    const window = values.slice(i - period + 1, i + 1);
    const mean = mid[i]!;
    const variance = window.reduce((s, v) => s + (v - mean) ** 2, 0) / period;
    const std = Math.sqrt(variance);
    upper[i] = mean + mult * std;
    lower[i] = mean - mult * std;
  }
  return { upper, mid, lower };
}

export interface Indicators {
  ema8: (number | null)[];
  ema34: (number | null)[];
  ema200: (number | null)[];
  rsi14: (number | null)[];
  macdLine: (number | null)[];
  macdSignal: (number | null)[];
  macdHistogram: (number | null)[];
  bbUpper: (number | null)[];
  bbMid: (number | null)[];
  bbLower: (number | null)[];
}

// Base EMA preset used for the "at purchase" / "current" text snapshot and
// as the chart's default overlay set — 8/34 (Fibonacci-ish short/mid) + 200
// (long-term trend), matching the user's preferred default.
export function computeIndicators(closes: number[]): Indicators {
  const m = macd(closes);
  const bb = bollinger(closes);
  return {
    ema8: ema(closes, 8),
    ema34: ema(closes, 34),
    ema200: ema(closes, 200),
    rsi14: rsi(closes, 14),
    macdLine: m.line,
    macdSignal: m.signal,
    macdHistogram: m.histogram,
    bbUpper: bb.upper,
    bbMid: bb.mid,
    bbLower: bb.lower,
  };
}
