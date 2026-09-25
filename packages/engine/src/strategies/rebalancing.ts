import type { Asset, Candle, Signal } from "@kab/shared";
import { last } from "../indicators.js";
export interface RebalanceParams { targetWeightPct: number; bandPct: number; currentWeightPct: number; }
export function rebalanceSignal(asset: Asset, candles: Candle[], params: RebalanceParams): Signal {
  const price = last(candles)?.close ?? 0;
  const ts = last(candles)?.ts ?? Date.now();
  const drift = params.currentWeightPct - params.targetWeightPct;
  if (Math.abs(drift) < params.bandPct) return { strategy: "rebalancing", asset, side: "flat", confidence: 0, reason: `drift ${drift.toFixed(2)}pp inside ±${params.bandPct}pp band`, price, ts };
  return { strategy: "rebalancing", asset, side: drift > 0 ? "sell" : "buy", confidence: Math.min(1, Math.abs(drift) / (params.bandPct * 3)), reason: `weight ${params.currentWeightPct.toFixed(1)}% vs target ${params.targetWeightPct}%`, price, ts };
}
