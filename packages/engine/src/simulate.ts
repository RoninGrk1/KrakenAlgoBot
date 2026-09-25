import { applySlippage, bps, newId, routesFor, type RiskPolicy, type Signal, type SimulationResult, type TradeIntent, type Venue } from "@kab/shared";
export interface SimulateInput {
  wallet: string; signal: Signal; notionalUsd: number; policy: RiskPolicy; venue: Venue;
  networkFeeUsd: number; venueFeeBps: number; priceImpactBps: number; clientOrderId: string; now?: number;
}
export function simulateTrade(input: SimulateInput): SimulationResult {
  const now = input.now ?? Date.now();
  const warnings: string[] = [];
  const route = routesFor(input.signal.asset)[0];
  if (!route) return dummyFail(input, now, "no execution route for asset");
  if (input.venue === "kraken") warnings.push("Kraken is an optional connector, not a custody layer.");
  const slippage = input.policy.maxSlippageBps;
  const venueFeeUsd = bps(input.notionalUsd, input.venueFeeBps);
  const impactAdj = input.signal.price * (input.priceImpactBps / 10_000) * (input.signal.side === "buy" ? 1 : -1);
  const expectedPrice = input.signal.price + impactAdj;
  const minPrice = input.signal.side === "buy" ? expectedPrice * (1 + slippage / 10_000) : expectedPrice * (1 - slippage / 10_000);
  const qty = input.notionalUsd / expectedPrice;
  const expectedOut = input.signal.side === "buy" ? qty : input.notionalUsd - venueFeeUsd - input.networkFeeUsd;
  const minOut = applySlippage(expectedOut, slippage, input.signal.side === "buy" ? "buy" : "sell");
  if (input.priceImpactBps > slippage) warnings.push("estimated price impact exceeds slippage tolerance");
  if (input.networkFeeUsd > input.notionalUsd * 0.02) warnings.push("network fee is more than 2% of notional");
  const intent: TradeIntent = {
    id: newId("int"), wallet: input.wallet, asset: input.signal.asset, chain: route.chain,
    side: input.signal.side === "flat" ? "buy" : input.signal.side, strategy: input.signal.strategy,
    venue: input.venue, notionalUsd: input.notionalUsd, qty, limitPrice: minPrice, maxSlippageBps: slippage,
    deadlineTs: now + input.policy.deadlineSeconds * 1000, clientOrderId: input.clientOrderId, state: "simulated",
    feeUsdEstimate: venueFeeUsd + input.networkFeeUsd, expectedOut, minOut,
    routeSummary: `${route.venue} ${route.symbol} on ${route.chain}`, createdAt: now
  };
  return { intent, ok: input.priceImpactBps <= slippage, warnings, disclosures: { expectedPrice, minPrice, slippageBps: slippage, networkFeeUsd: input.networkFeeUsd, venueFeeUsd, priceImpactBps: input.priceImpactBps } };
}
function dummyFail(input: SimulateInput, now: number, reason: string): SimulationResult {
  return {
    intent: {
      id: newId("int"), wallet: input.wallet, asset: input.signal.asset, chain: "ethereum", side: "buy",
      strategy: input.signal.strategy, venue: input.venue, notionalUsd: 0, qty: 0, limitPrice: 0,
      maxSlippageBps: input.policy.maxSlippageBps, deadlineTs: now, clientOrderId: input.clientOrderId,
      state: "risk_rejected", feeUsdEstimate: 0, expectedOut: 0, minOut: 0, routeSummary: reason, createdAt: now
    },
    ok: false, warnings: [reason],
    disclosures: { expectedPrice: 0, minPrice: 0, slippageBps: input.policy.maxSlippageBps, networkFeeUsd: 0, venueFeeUsd: 0, priceImpactBps: 0 }
  };
}
