import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { krakenEnabled, krakenPair, refuseUserKrakenKeys } from "./kraken.js";
describe("kraken connector", () => {
  it("is disabled without keys", () => {
    assert.equal(krakenEnabled({ enabled: true, apiKey: "", apiSecret: "", baseUrl: "" }), false);
  });
  it("maps pairs", () => { assert.equal(krakenPair("BTC"), "XBTUSD"); });
  it("refuses user keys", () => { assert.throws(() => refuseUserKrakenKeys()); });
});
