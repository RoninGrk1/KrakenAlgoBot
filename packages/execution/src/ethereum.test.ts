import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { TradeIntent } from "@kab/shared";
import { buildEthRouterTx } from "./ethereum.js";
const intent = { id: "int_1", wallet: "0xabc", asset: "ETH", chain: "ethereum", side: "buy", strategy: "momentum", venue: "onchain-dex", notionalUsd: 100, qty: 0.03, limitPrice: 1, maxSlippageBps: 50, deadlineTs: Date.now() + 10_000, clientOrderId: "abc123", state: "authorized", feeUsdEstimate: 1, expectedOut: 1, minOut: 0.9, routeSummary: "test", createdAt: Date.now() } as TradeIntent;
describe("ethereum router encoding", () => {
  it("refuses when router is not allowlisted", () => {
    assert.throws(() => buildEthRouterTx(intent, { router: "0x1111111111111111111111111111111111111111", adapter: "0x2222222222222222222222222222222222222222", gasLimit: 250000n, valueWei: 0n }));
  });
});
