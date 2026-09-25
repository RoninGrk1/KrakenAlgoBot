import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_RISK, type Signal } from "@kab/shared";
import { evaluateRisk, type RiskContext } from "./risk.js";
const signal: Signal = { strategy: "momentum", asset: "ETH", side: "buy", confidence: 0.8, reason: "test", price: 3000, ts: 1 };
function ctx(over: Partial<RiskContext> = {}): RiskContext {
  return { policy: { ...DEFAULT_RISK, riskPct: 1, maxSpendUsdPerTx: 100, maxSpendUsdPerDay: 250 }, portfolioUsd: 10_000, spentUsdToday: 0, realizedPnlUsdToday: 0, lastTradeTs: 0, paused: false, emergencyPaused: false, asset: "ETH", now: 1_000_000, ...over };
}
describe("risk engine", () => {
  it("allows and clips", () => { const d = evaluateRisk(signal, ctx()); assert.equal(d.allowed, true); assert.equal(d.clippedNotionalUsd, 100); });
  it("blocks pause", () => { assert.equal(evaluateRisk(signal, ctx({ emergencyPaused: true })).allowed, false); });
  it("blocks flat", () => { assert.equal(evaluateRisk({ ...signal, side: "flat" }, ctx()).allowed, false); });
});
