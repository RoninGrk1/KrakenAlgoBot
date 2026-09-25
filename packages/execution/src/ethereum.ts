import { DEFAULT_ALLOWLIST, assertAllowlisted, type TradeIntent } from "@kab/shared";
export interface UnsignedEthTx {
  chain: "ethereum"; to: string; data: string; value: string; gas: string;
  maxFeePerGas?: string; maxPriorityFeePerGas?: string; description: string;
}
export function buildEthRouterTx(intent: TradeIntent, opts: { router: string; adapter: string; gasLimit: bigint; valueWei: bigint }): UnsignedEthTx {
  if (!DEFAULT_ALLOWLIST.ethereum.spenders.length) throw new Error("execution router is not deployed/allowlisted");
  assertAllowlisted("router", opts.router, DEFAULT_ALLOWLIST.ethereum.spenders);
  if (!opts.adapter) throw new Error("adapter is required");
  return {
    chain: "ethereum", to: opts.router, data: encodeStub(intent, opts.adapter),
    value: opts.valueWei.toString(), gas: opts.gasLimit.toString(),
    description: `${intent.side} ${intent.asset} via allowlisted router`
  };
}
export function encodeStub(intent: TradeIntent, adapter: string): string {
  const id = Buffer.from(intent.clientOrderId.padEnd(32, "0")).toString("hex").slice(0, 64);
  const target = adapter.replace(/^0x/, "").padStart(64, "0");
  return `0x${id}${target}`;
}
export function estimateEthGasUsd(gasLimit: bigint, maxFeeWei: bigint, ethUsd: number): number {
  return (Number(gasLimit * maxFeeWei) / 1e18) * ethUsd;
}
