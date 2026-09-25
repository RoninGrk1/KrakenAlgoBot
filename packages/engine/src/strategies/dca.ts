import type { Asset, Candle, Signal } from "@kab/shared";
import { last } from "../indicators.js";
export interface DcaParams { intervalHours: number; clipUsd: number; lastBuyTs?: number; }
export function dcaSignal(asset: Asset, candles: Candle[], params: DcaParams, now = Date.now()): Signal {
  const price = last(candles)?.close ?? 0;
  const ts = last(candles)?.ts ?? now;
  const due = now - (params.lastBuyTs ?? 0) >= params.intervalHours * 3_600_000;
  if (!due) return { strategy: "dca", asset, side: "flat", confidence: 0, reason: "interval not elapsed", price, ts };
  if (params.clipUsd <= 0) return { strategy: "dca", asset, side: "flat", confidence: 0, reason: "clip size is zero", price, ts };
  return { strategy: "dca", asset, side: "buy", confidence: 1, reason: `scheduled clip of $${params.clipUsd} every ${params.intervalHours}h`, price, ts };
}
