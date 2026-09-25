import { randomBytes, createHmac, timingSafeEqual } from "node:crypto";
import { memory, upsertWallet } from "./store.js";
import { config } from "./config.js";

export function issueNonce(address: string): string {
  const nonce = randomBytes(16).toString("hex");
  memory.nonces.set(address.toLowerCase(), { nonce, exp: Date.now() + 10 * 60_000 });
  return nonce;
}

export function consumeNonce(address: string, nonce: string): boolean {
  const row = memory.nonces.get(address.toLowerCase());
  if (!row) return false;
  memory.nonces.delete(address.toLowerCase());
  return row.nonce === nonce && row.exp > Date.now();
}

export function signSession(address: string): string {
  const exp = Date.now() + 12 * 60 * 60 * 1000;
  const body = Buffer.from(JSON.stringify({ address: address.toLowerCase(), exp })).toString("base64url");
  const sig = createHmac("sha256", config.sessionSecret).update(body).digest("base64url");
  const token = `${body}.${sig}`;
  memory.sessions.set(token, { address: address.toLowerCase(), exp });
  upsertWallet(address, "ethereum");
  return token;
}

export function readSession(token: string | undefined): string | null {
  if (!token) return null;
  const local = memory.sessions.get(token);
  if (local && local.exp > Date.now()) return local.address;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const body = parts[0]!;
  const sig = parts[1]!;
  const expected = createHmac("sha256", config.sessionSecret).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString()) as { address: string; exp: number };
    if (parsed.exp < Date.now()) return null;
    return parsed.address.toLowerCase();
  } catch {
    return null;
  }
}

export function siweMessage(address: string, nonce: string): string {
  return [
    `${config.siweDomain} wants you to sign in with your Ethereum account:`,
    address,
    "",
    "Sign in to KrakenAlgoBot. This does not move funds.",
    "",
    `URI: ${config.siweUri}`,
    "Version: 1",
    `Chain ID: ${config.ethChainId}`,
    `Nonce: ${nonce}`,
    `Issued At: ${new Date().toISOString()}`
  ].join("\n");
}
