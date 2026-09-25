import { ASSETS, clamp, type Asset, type RiskDecision, type RiskPolicy, type Signal } from "@kab/shared";
export interface RiskContext {
  policy: RiskPolicy; portfolioUsd: number; spentUsdToday: number; realizedPnlUsdToday: number;
  lastTradeTs: number; paused: boolean; emergencyPaused: boolean; asset: Asset; now?: number;
}
export function evaluateRisk(signal: Signal, ctx: RiskContext): RiskDecision {
  const reasons: string[] = [];
  const now = ctx.now ?? Date.now();
  if (ctx.emergencyPaused) reasons.push("protocol emergency pause is active");
  if (ctx.paused) reasons.push("bot is paused");
  if (!ASSETS.includes(ctx.asset)) reasons.push(`asset ${ctx.asset} is not supported`);
  if (signal.side === "flat") reasons.push("no actionable signal");
  if (signal.price <= 0) reasons.push("invalid mark price");
  if (ctx.portfolioUsd <= 0) reasons.push("portfolio value is zero");
  if (ctx.policy.riskPct <= 0 || ctx.policy.riskPct > 5) reasons.push("riskPct must be between 0 and 5");
  if (ctx.policy.maxSlippageBps <= 0 || ctx.policy.maxSlippageBps > 200) reasons.push("maxSlippageBps must be between 1 and 200");
  if (now - ctx.lastTradeTs < ctx.policy.cooldownSeconds * 1000) reasons.push("cooldown active");
  if (ctx.realizedPnlUsdToday <= -Math.abs(ctx.policy.maxDailyLossUsd)) reasons.push("daily loss limit reached");
  const raw = ctx.portfolioUsd * (ctx.policy.riskPct / 100);
  let notional = Math.min(raw, ctx.policy.maxSpendUsdPerTx);
  const remainingDay = ctx.policy.maxSpendUsdPerDay - ctx.spentUsdToday;
  if (remainingDay <= 0) { reasons.push("daily spend limit reached"); notional = 0; }
  else notional = Math.min(notional, remainingDay);
  notional = clamp(notional, 0, ctx.policy.maxSpendUsdPerTx);
  if (notional < 5) reasons.push("clipped notional below minimum fill size");
  return { allowed: reasons.length === 0, reasons, clippedNotionalUsd: reasons.length === 0 ? notional : 0 };
}
