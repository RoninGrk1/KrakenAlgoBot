import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { consumeNonce, issueNonce, readSession, signSession } from "./auth.js";

describe("auth", () => {
  it("issues and consumes a nonce once", () => {
    const n = issueNonce("0xabc");
    assert.equal(consumeNonce("0xabc", n), true);
    assert.equal(consumeNonce("0xabc", n), false);
  });

  it("round-trips a session token", () => {
    const token = signSession("0xAbCDEF");
    assert.equal(readSession(token), "0xabcdef");
    assert.equal(readSession("tampered." + token), null);
  });
});
