import {
  DEFAULT_ALLOWLIST,
  assertAllowlisted,
  type Allowlist,
  type TradeIntent
} from "@kab/shared";
import { encodeApprove, encodeExecuteCalldata, encodeSetPolicy, keccakUtf8 } from "./abi-encode.js";
import { isNativeToken, resolveNetwork, tokenForAsset, type NetworkTokens } from "./networks.js";

type Hex = `0x${string}`;

export interface UnsignedEthTx {
  chain: "ethereum";
  chainId: number;
  to: string;
  data: Hex;
  value: string;
  gas: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  description: string;
  kind: "approve" | "setPolicy" | "execute" | "revoke" | "setKeeper";
}

export interface EncodeOpts {
  router: string;
  adapter: string;
  riskModule?: string;
  gasLimit?: bigint;
  valueWei?: bigint;
  allowlist?: Allowlist;
  network?: NetworkTokens;
  poolFee?: number;
}

function asAddress(value: string, label: string): string {
  if (!/^0x[0-9a-fA-F]{40}$/.test(value)) {
    throw new Error(`${label} is not a 20-byte address`);
  }
  return value;
}

export function intentIdBytes32(clientOrderId: string): Hex {
  return keccakUtf8(clientOrderId);
}

export function toBaseUnits(amount: number, decimals: number): bigint {
  if (!Number.isFinite(amount) || amount < 0) throw new Error("invalid amount");
  const raw = amount.toString();
  if (/e/i.test(raw)) {
    const [whole, frac = ""] = amount.toFixed(decimals).split(".");
    return BigInt(whole + frac.padEnd(decimals, "0").slice(0, decimals));
  }
  const [whole, frac = ""] = raw.split(".");
  return BigInt(whole + frac.padEnd(decimals, "0").slice(0, decimals));
}

/**
 * Encodes ExecutionRouter.execute. The backend never signs this.
 * Router and adapter must already be on the allowlist.
 */
export function buildEthRouterTx(intent: TradeIntent, opts: EncodeOpts): UnsignedEthTx {
  const allowlist = opts.allowlist ?? DEFAULT_ALLOWLIST;
  if (!allowlist.ethereum.spenders.length) {
    throw new Error("execution router is not deployed/allowlisted");
  }
  assertAllowlisted("router", opts.router, allowlist.ethereum.spenders);
  if (allowlist.ethereum.adapters.length) {
    assertAllowlisted("adapter", opts.adapter, allowlist.ethereum.adapters);
  }
  if (!opts.adapter) throw new Error("adapter is required");

  const net = opts.network ?? resolveNetwork(process.env.ACTIVE_NETWORK ?? "testnet");
  const { tokenIn, tokenOut, tokenInDecimals, tokenOutDecimals } = tokenForAsset(
    intent.asset,
    intent.side,
    net
  );

  const amountIn =
    intent.side === "buy"
      ? toBaseUnits(intent.notionalUsd, tokenInDecimals)
      : toBaseUnits(intent.qty, tokenInDecimals);
  const minOut = toBaseUnits(intent.minOut, tokenOutDecimals);
  const deadline = BigInt(Math.floor(intent.deadlineTs / 1000));
  const fee = opts.poolFee ?? 3000;
  const packedFee = (`0x${fee.toString(16).padStart(64, "0")}`) as Hex;

  const data = encodeExecuteCalldata({
    intentId: intentIdBytes32(intent.clientOrderId),
    wallet: asAddress(intent.wallet, "wallet"),
    adapter: asAddress(opts.adapter, "adapter"),
    tokenIn: asAddress(tokenIn, "tokenIn"),
    tokenOut: asAddress(tokenOut, "tokenOut"),
    amountIn,
    minAmountOut: minOut,
    slippageBps: intent.maxSlippageBps,
    deadline,
    adapterData: packedFee
  });

  const nativeIn = isNativeToken(tokenIn);
  const valueWei = opts.valueWei ?? (nativeIn ? amountIn : 0n);

  return {
    chain: "ethereum",
    chainId: net.chainId,
    to: opts.router,
    data,
    value: valueWei.toString(),
    gas: (opts.gasLimit ?? 450000n).toString(),
    description: `${intent.side} ${intent.asset} via allowlisted router`,
    kind: "execute"
  };
}

export function buildApproveTx(
  token: string,
  spender: string,
  amount: bigint,
  chainId: number,
  gasLimit = 80000n
): UnsignedEthTx {
  if (isNativeToken(token)) {
    throw new Error("native token does not need approve");
  }
  return {
    chain: "ethereum",
    chainId,
    to: token,
    data: encodeApprove(asAddress(spender, "spender"), amount),
    value: "0",
    gas: gasLimit.toString(),
    description: `approve ${amount.toString()} to router`,
    kind: amount === 0n ? "revoke" : "approve"
  };
}

export function buildSetPolicyTx(
  riskModule: string,
  policy: { maxSlippageBps: number; maxSpendPerTx: bigint; maxSpendPerDay: bigint },
  chainId: number
): UnsignedEthTx {
  return {
    chain: "ethereum",
    chainId,
    to: riskModule,
    data: encodeSetPolicy(policy.maxSlippageBps, policy.maxSpendPerTx, policy.maxSpendPerDay),
    value: "0",
    gas: "120000",
    description: "set on-chain risk policy",
    kind: "setPolicy"
  };
}

export function encodeStub(_intent: TradeIntent, _adapter: string): string {
  throw new Error("encodeStub retired — use buildEthRouterTx");
}

export function estimateEthGasUsd(gasLimit: bigint, maxFeeWei: bigint, ethUsd: number): number {
  const eth = Number(gasLimit * maxFeeWei) / 1e18;
  return eth * ethUsd;
}
