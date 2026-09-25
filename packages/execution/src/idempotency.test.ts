import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { claimIdempotency, resetIdempotency } from "./idempotency.js";
describe("idempotency", () => {
  it("rejects duplicates inside TTL", () => {
    resetIdempotency();
    assert.equal(claimIdempotency("a", 1000, 1), true);
    assert.equal(claimIdempotency("a", 1000, 2), false);
    assert.equal(claimIdempotency("a", 1000, 2000), true);
  });
});
