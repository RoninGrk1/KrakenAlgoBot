import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { OnChainTx } from "@kab/shared";
import { reconcile } from "./reconcile.js";

const base: OnChainTx = {
  hash: "0x1",
  chain: "ethereum",
  state: "pending",
  from: "0xabc",
  to: "0xdef",
  intentId: "int_1",
  confirmations: 0,
  finalized: false,
  humanSummary: "BUY ETH",
  submittedAt: 1,
  updatedAt: 1
};

describe("reconcile", () => {
  it("moves pending → confirmed → finalized", () => {
    assert.equal(reconcile(base, 0, false, 12).state, "pending");
    assert.equal(reconcile(base, 3, false, 12).state, "confirmed");
    assert.equal(reconcile(base, 12, false, 12).state, "finalized");
    assert.equal(reconcile(base, 12, false, 12).finalized, true);
  });

  it("marks failed", () => {
    assert.equal(reconcile(base, 0, true).state, "failed");
  });
});
