import { createHash, randomBytes } from "node:crypto";
export function newId(prefix: string): string {
  return `${prefix}_${randomBytes(12).toString("hex")}`;
}
export function clientOrderId(wallet: string, nonce: string): string {
  return createHash("sha256").update(`${wallet}:${nonce}`).digest("hex").slice(0, 32);
}
export function idempotencyKey(parts: string[]): string {
  return createHash("sha256").update(parts.join("|")).digest("hex");
}
