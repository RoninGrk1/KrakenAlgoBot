export const STRATEGIES = ["trend", "momentum", "dca", "rebalancing"] as const;
export type StrategyId = (typeof STRATEGIES)[number];
export interface StrategyMeta {
  id: StrategyId;
  name: string;
  summary: string;
  defaultParams: Record<string, number>;
}
export const STRATEGY_CATALOG: StrategyMeta[] = [
  { id: "trend", name: "Trend", summary: "Follow the prevailing direction using EMA crossovers.", defaultParams: { fastEma: 12, slowEma: 26, confirmBars: 2 } },
  { id: "momentum", name: "Momentum", summary: "Enter when rate-of-change breaks a configured threshold.", defaultParams: { lookback: 14, entryThresholdPct: 2.5, exitThresholdPct: 0.4 } },
  { id: "dca", name: "DCA", summary: "Buy a fixed notional on a schedule regardless of short-term noise.", defaultParams: { intervalHours: 24, clipUsd: 50 } },
  { id: "rebalancing", name: "Rebalancing", summary: "Restore target weights when drift exceeds the band.", defaultParams: { targetWeightPct: 60, bandPct: 5 } }
];
export function isStrategy(value: string): value is StrategyId {
  return (STRATEGIES as readonly string[]).includes(value);
}
