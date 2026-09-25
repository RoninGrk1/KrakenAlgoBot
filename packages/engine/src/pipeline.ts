import type { Candle, RiskPolicy, Signal, SimulationResult, StrategyId, Venue } from "@kab/shared";
import { clientOrderId } from "@kab/shared";
import { evaluateRisk, type RiskContext } from "./risk.js";
import { simulateTrade } from "./simulate.js";
import { runStrategy } from "./strategies/run.js";
export function evaluatePipeline(input: {
  wallet: string; asset: RiskContext["asset"]; strategy: StrategyId; params: Record<string, number>;
  candles: Candle[]; riskCtx: Omit<RiskContext, "asset">; policy: RiskPolicy; venue: Venue;
  networkFeeUsd: number; venueFeeBps: number; priceImpactBps: number; nonce: string;
}): { signal: Signal; risk: ReturnType<typeof evaluateRisk>; simulation: SimulationResult | null } {
  const signal = runStrategy(input.strategy, input.asset, input.candles, input.params);
  const risk = evaluateRisk(signal, { ...input.riskCtx, asset: input.asset });
  if (!risk.allowed) return { signal, risk, simulation: null };
  const simulation = simulateTrade({
    wallet: input.wallet, signal, notionalUsd: risk.clippedNotionalUsd, policy: input.policy,
    venue: input.venue, networkFeeUsd: input.networkFeeUsd, venueFeeBps: input.venueFeeBps,
    priceImpactBps: input.priceImpactBps, clientOrderId: clientOrderId(input.wallet, input.nonce)
  });
  return { signal, risk, simulation };
}
