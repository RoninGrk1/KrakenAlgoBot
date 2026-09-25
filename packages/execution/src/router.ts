import type { TradeIntent, Venue } from "@kab/shared";
import { buildEthRouterTx, type UnsignedEthTx } from "./ethereum.js";
import { claimIdempotency } from "./idempotency.js";
import { refuseUserKrakenKeys } from "./kraken.js";
import { wrapSolanaSwap, type UnsignedSolTx } from "./solana.js";
export type UnsignedTx = UnsignedEthTx | UnsignedSolTx;
export interface RouteInput {
  intent: TradeIntent; venue: Venue;
  eth?: { router: string; adapter: string; gasLimit: bigint; valueWei: bigint };
  sol?: { serialized: string; programs: string[] };
}
export function routeIntent(input: RouteInput): UnsignedTx {
  if (!claimIdempotency(input.intent.clientOrderId)) throw new Error("duplicate clientOrderId");
  if (Date.now() > input.intent.deadlineTs) throw new Error("intent expired");
  if (input.venue === "kraken") refuseUserKrakenKeys();
  if (input.intent.chain === "ethereum") {
    if (!input.eth) throw new Error("missing ethereum route params");
    return buildEthRouterTx(input.intent, input.eth);
  }
  if (!input.sol) throw new Error("missing solana route params");
  return wrapSolanaSwap(input.intent, input.sol.serialized, input.sol.programs);
}
