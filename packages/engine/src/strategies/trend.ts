import type { Asset, Candle, Signal } from "@kab/shared";
import { closes, ema, last } from "../indicators.js";
export interface TrendParams { fastEma: number; slowEma: number; confirmBars: number; }
export function trendSignal(asset: Asset, candles: Candle[], params: TrendParams): Signal {
  const px = closes(candles);
  const price = last(px) ?? 0;
  const ts = last(candles)?.ts ?? Date.now();
  if (px.length < params.slowEma + params.confirmBars) return { strategy: "trend", asset, side: "flat", confidence: 0, reason: "insufficient history", price, ts };
  const fast = ema(px, params.fastEma);
  const slow = ema(px, params.slowEma);
  let bull = 0, bear = 0;
  for (let i = 0; i < params.confirmBars; i++) {
    const idx = fast.length - 1 - i;
    if (fast[idx]! > slow[idx]!) bull += 1;
    if (fast[idx]! < slow[idx]!) bear += 1;
  }
  if (bull === params.confirmBars) return { strategy: "trend", asset, side: "buy", confidence: 0.7, reason: `fast EMA above slow EMA for ${params.confirmBars} bars`, price, ts };
  if (bear === params.confirmBars) return { strategy: "trend", asset, side: "sell", confidence: 0.7, reason: `fast EMA below slow EMA for ${params.confirmBars} bars`, price, ts };
  return { strategy: "trend", asset, side: "flat", confidence: 0, reason: "no confirmed crossover", price, ts };
}
