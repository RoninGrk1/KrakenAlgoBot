/**
 * ABI encoder for the three wallet-signed calls we emit.
 * Prefers @noble/hashes; falls back to the vendored copy.
 */
import { createRequire } from "node:module";

const req = createRequire(import.meta.url);
let keccak_256: (data: Uint8Array) => Uint8Array;
try {
  ({ keccak_256 } = req("@noble/hashes/sha3"));
} catch {
  ({ keccak_256 } = req("../vendor/noble-hashes/sha3.js"));
}

export function keccak256(data: Uint8Array): `0x${string}` {
  return toHex(keccak_256(data));
}

export function utf8(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

export function hexToBytes(hex: string): Uint8Array {
  const h = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (h.length % 2) throw new Error("odd hex");
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = Number.parseInt(h.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export function toHex(bytes: Uint8Array): `0x${string}` {
  return `0x${[...bytes].map((b) => b.toString(16).padStart(2, "0")).join("")}` as `0x${string}`;
}

export function pad32(hexOrAddr: string): string {
  const h = hexOrAddr.startsWith("0x") ? hexOrAddr.slice(2) : hexOrAddr;
  return h.padStart(64, "0").toLowerCase();
}

export function encodeUint(value: bigint): string {
  if (value < 0n) throw new Error("negative");
  return value.toString(16).padStart(64, "0");
}

export function encodeAddress(addr: string): string {
  return pad32(addr);
}

export function selector(signature: string): `0x${string}` {
  return keccak256(utf8(signature)).slice(0, 10) as `0x${string}`;
}

function padRight(hex: string): string {
  const rem = hex.length % 64;
  return rem === 0 ? hex : hex + "0".repeat(64 - rem);
}

export function encodeExecuteCalldata(args: {
  intentId: `0x${string}`;
  wallet: string;
  adapter: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: bigint;
  minAmountOut: bigint;
  slippageBps: number;
  deadline: bigint;
  adapterData: `0x${string}`;
}): `0x${string}` {
  const sel = selector(
    "execute((bytes32,address,address,address,address,uint256,uint256,uint16,uint64,bytes))"
  );
  const dataBytes = hexToBytes(args.adapterData);
  const dataLen = encodeUint(BigInt(dataBytes.length));
  const dataPadded = padRight(toHex(dataBytes).slice(2));
  const heads = [
    pad32(args.intentId),
    encodeAddress(args.wallet),
    encodeAddress(args.adapter),
    encodeAddress(args.tokenIn),
    encodeAddress(args.tokenOut),
    encodeUint(args.amountIn),
    encodeUint(args.minAmountOut),
    encodeUint(BigInt(args.slippageBps)),
    encodeUint(args.deadline),
    encodeUint(320n)
  ].join("");
  const tuple = heads + dataLen + dataPadded;
  return `${sel}${encodeUint(32n)}${tuple}` as `0x${string}`;
}

export function encodeApprove(spender: string, amount: bigint): `0x${string}` {
  return `0x095ea7b3${encodeAddress(spender)}${encodeUint(amount)}`;
}

export function encodeSetPolicy(
  maxSlippageBps: number,
  maxSpendPerTx: bigint,
  maxSpendPerDay: bigint
): `0x${string}` {
  const sel = selector("setPolicy(uint16,uint256,uint256)");
  return `${sel}${encodeUint(BigInt(maxSlippageBps))}${encodeUint(maxSpendPerTx)}${encodeUint(maxSpendPerDay)}` as `0x${string}`;
}

export function keccakUtf8(value: string): `0x${string}` {
  return keccak256(utf8(value));
}
