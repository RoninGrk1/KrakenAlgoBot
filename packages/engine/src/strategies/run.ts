import type { Asset, Candle, Signal, StrategyId } from "@kab/shared";
import { dcaSignal } from "./dca.js";
import { momentumSignal } from "./momentum.js";
import { rebalanceSignal } from "./rebalancing.js";
import { trendSignal } from "./trend.js";
export function runStrategy(id: StrategyId, asset: Asset, candles: Candle[], params: Record<string, number>): Signal {
  switch (id) {
    case "trend":
      return trendSignal(asset, candles, { fastEma: params.fastEma ?? 12, slowEma: params.slowEma ?? 26, confirmBars: params.confirmBars ?? 2 });
    case "momentum":
      return momentumSignal(asset, candles, { lookback: params.lookback ?? 14, entryThresholdPct: params.entryThresholdPct ?? 2.5, exitThresholdPct: params.exitThresholdPct ?? 0.4 });
    case "dca":
      return dcaSignal(asset, candles, { intervalHours: params.intervalHours ?? 24, clipUsd: params.clipUsd ?? 50, lastBuyTs: params.lastBuyTs });
    case "rebalancing":
      return rebalanceSignal(asset, candles, { targetWeightPct: params.targetWeightPct ?? 60, bandPct: params.bandPct ?? 5, currentWeightPct: params.currentWeightPct ?? 60 });
    default: {
      const _exhaustive: never = id;
      throw new Error(`unknown strategy ${_exhaustive}`);
    }
  }
}
