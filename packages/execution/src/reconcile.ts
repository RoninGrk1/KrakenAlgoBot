import type { OnChainTx, TxState } from "@kab/shared";

export const FINALIZED_CONFIRMS: Record<OnChainTx["chain"], number> = {
  ethereum: Number(process.env.FINALITY_CONFIRMATIONS_ETH ?? 2),
  solana: Number(process.env.FINALITY_CONFIRMATIONS_SOL ?? 32)
};

export function nextTxState(tx: OnChainTx, confirmations: number, finalizedAt = FINALIZED_CONFIRMS[tx.chain]): TxState {
  if (tx.state === "failed") return "failed";
  if (confirmations <= 0) return "pending";
  if (confirmations >= finalizedAt) return "finalized";
  return "confirmed";
}

export function reconcile(
  tx: OnChainTx,
  confirmations: number,
  failed = false,
  finalizedAt = FINALIZED_CONFIRMS[tx.chain]
): OnChainTx {
  if (failed) {
    return { ...tx, state: "failed", confirmations, finalized: false, updatedAt: Date.now() };
  }
  const state = nextTxState({ ...tx, confirmations }, confirmations, finalizedAt);
  return {
    ...tx,
    confirmations,
    state,
    finalized: state === "finalized",
    updatedAt: Date.now()
  };
}
