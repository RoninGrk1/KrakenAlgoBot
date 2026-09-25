import type { Asset, Candle, Signal } from "@kab/shared";
import { closes, last, roc } from "../indicators.js";
export interface MomentumParams { lookback: number; entryThresholdPct: number; exitThresholdPct: number; }
export function momentumSignal(asset: Asset, candles: Candle[], params: MomentumParams): Signal {
  const px = closes(candles);
  const price = last(px) ?? 0;
  const ts = last(candles)?.ts ?? Date.now();
  const change = roc(px, params.lookback);
  if (change >= params.entryThresholdPct) return { strategy: "momentum", asset, side: "buy", confidence: Math.min(1, change / (params.entryThresholdPct * 2)), reason: `ROC ${change.toFixed(2)}% >= ${params.entryThresholdPct}%`, price, ts };
  if (change <= -params.entryThresholdPct) return { strategy: "momentum", asset, side: "sell", confidence: Math.min(1, Math.abs(change) / (params.entryThresholdPct * 2)), reason: `ROC ${change.toFixed(2)}% <= -${params.entryThresholdPct}%`, price, ts };
  return { strategy: "momentum", asset, side: "flat", confidence: 0, reason: `ROC ${change.toFixed(2)}% inside dead zone`, price, ts };
}
