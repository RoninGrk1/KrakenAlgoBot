import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ema, roc } from "./indicators.js";
describe("indicators", () => {
  it("computes EMA toward later values", () => {
    const out = ema([1, 2, 3, 4, 5], 3);
    assert.equal(out.length, 5);
    assert.ok(out[4]! > out[0]!);
  });
  it("rejects invalid EMA period", () => { assert.throws(() => ema([1], 0)); });
  it("computes rate of change", () => { assert.equal(roc([100, 110], 1), 10); });
});
