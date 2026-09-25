import type { Asset, Chain } from "./assets.js";
import type { StrategyId } from "./strategies.js";
import type { BotState, IntentState, TxState } from "./status.js";
export type Side = "buy" | "sell";
export type Venue = "onchain-dex" | "kraken";
export interface RiskPolicy {
  riskPct: number;
  maxSlippageBps: number;
  maxSpendUsdPerTx: number;
  maxSpendUsdPerDay: number;
  maxDailyLossUsd: number;
  cooldownSeconds: number;
  deadlineSeconds: number;
}
export const DEFAULT_RISK: RiskPolicy = {
  riskPct: 1,
  maxSlippageBps: 50,
  maxSpendUsdPerTx: 500,
  maxSpendUsdPerDay: 2000,
  maxDailyLossUsd: 150,
  cooldownSeconds: 120,
  deadlineSeconds: 180
};
export interface Candle {
  ts: number; open: number; high: number; low: number; close: number; volume: number;
}
export interface Signal {
  strategy: StrategyId; asset: Asset; side: Side | "flat"; confidence: number; reason: string; price: number; ts: number;
}
export interface PortfolioPosition { asset: Asset; qty: number; usd: number; changePctToday: number; }
export interface PortfolioSnapshot { address: string; totalUsd: number; changePctToday: number; positions: PortfolioPosition[]; asOf: number; }
export interface TradeIntent {
  id: string; wallet: string; asset: Asset; chain: Chain; side: Side; strategy: StrategyId; venue: Venue;
  notionalUsd: number; qty: number; limitPrice: number; maxSlippageBps: number; deadlineTs: number;
  clientOrderId: string; state: IntentState; feeUsdEstimate: number; gasEstimate?: string;
  expectedOut: number; minOut: number; routeSummary: string; createdAt: number;
}
export interface SimulationResult {
  intent: TradeIntent; ok: boolean; warnings: string[];
  disclosures: { expectedPrice: number; minPrice: number; slippageBps: number; networkFeeUsd: number; venueFeeUsd: number; priceImpactBps: number };
}
export interface RiskDecision { allowed: boolean; reasons: string[]; clippedNotionalUsd: number; }
export interface OnChainTx {
  hash: string; chain: Chain; state: TxState; from: string; to: string; intentId: string;
  blockNumber?: number; confirmations: number; finalized: boolean; humanSummary: string; submittedAt: number; updatedAt: number;
}
export interface BotConfig {
  id: string; wallet: string; asset: Asset; strategy: StrategyId; params: Record<string, number>;
  risk: RiskPolicy; venue: Venue; state: BotState; createdAt: number; updatedAt: number;
}
export interface Session { address: string; chain: Chain; issuedAt: number; expiresAt: number; }
