import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_RISK, type Candle } from "@kab/shared";
import { evaluatePipeline } from "./pipeline.js";
function candles(n: number, start = 100, step = 1): Candle[] {
  return Array.from({ length: n }, (_, i) => {
    const close = start + i * step;
    return { ts: i * 60_000, open: close, high: close, low: close, close, volume: 1 };
  });
}
describe("pipeline", () => {
  it("simulates a buy on rising momentum", () => {
    const out = evaluatePipeline({
      wallet: "0xabc", asset: "ETH", strategy: "momentum",
      params: { lookback: 5, entryThresholdPct: 2, exitThresholdPct: 0.2 },
      candles: candles(20, 100, 2),
      riskCtx: { policy: DEFAULT_RISK, portfolioUsd: 20_000, spentUsdToday: 0, realizedPnlUsdToday: 0, lastTradeTs: 0, paused: false, emergencyPaused: false },
      policy: DEFAULT_RISK, venue: "onchain-dex", networkFeeUsd: 1.2, venueFeeBps: 5, priceImpactBps: 8, nonce: "1"
    });
    assert.equal(out.signal.side, "buy");
    assert.equal(out.risk.allowed, true);
    assert.ok(out.simulation);
  });
});
