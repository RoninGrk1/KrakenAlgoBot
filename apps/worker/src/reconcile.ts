import type { OnChainTx, TxState } from "@kab/shared";
const FINALIZED_CONFIRMS: Record<OnChainTx["chain"], number> = { ethereum: 12, solana: 32 };
export function nextTxState(tx: OnChainTx, confirmations: number): TxState {
  if (tx.state === "failed") return "failed";
  if (confirmations <= 0) return "pending";
  if (confirmations >= FINALIZED_CONFIRMS[tx.chain]) return "finalized";
  return "confirmed";
}
export function reconcile(tx: OnChainTx, confirmations: number, failed = false): OnChainTx {
  if (failed) return { ...tx, state: "failed", confirmations, finalized: false, updatedAt: Date.now() };
  const state = nextTxState({ ...tx, confirmations }, confirmations);
  return { ...tx, confirmations, state, finalized: state === "finalized", updatedAt: Date.now() };
}
