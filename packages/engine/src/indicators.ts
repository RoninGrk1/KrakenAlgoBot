import type { Candle } from "@kab/shared";
export function ema(values: number[], period: number): number[] {
  if (period <= 0) throw new Error("EMA period must be > 0");
  if (values.length === 0) return [];
  const k = 2 / (period + 1);
  const out: number[] = [];
  let prev = values[0]!;
  for (let i = 0; i < values.length; i++) {
    const v = values[i]!;
    prev = i === 0 ? v : v * k + prev * (1 - k);
    out.push(prev);
  }
  return out;
}
export function roc(values: number[], lookback: number): number {
  if (lookback <= 0) throw new Error("lookback must be > 0");
  if (values.length <= lookback) return 0;
  const now = values[values.length - 1]!;
  const prev = values[values.length - 1 - lookback]!;
  if (prev === 0) return 0;
  return ((now - prev) / prev) * 100;
}
export function closes(candles: Candle[]): number[] { return candles.map((c) => c.close); }
export function last<T>(arr: T[]): T | undefined { return arr[arr.length - 1]; }
