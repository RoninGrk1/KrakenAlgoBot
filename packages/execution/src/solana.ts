import { DEFAULT_ALLOWLIST, type TradeIntent } from "@kab/shared";
export interface UnsignedSolTx { chain: "solana"; serialized: string; programs: string[]; description: string; }
export function assertSolanaPrograms(programs: string[]): void {
  for (const p of programs) {
    if (!DEFAULT_ALLOWLIST.solana.programs.includes(p)) throw new Error(`Solana program not allowlisted: ${p}`);
  }
}
export function wrapSolanaSwap(intent: TradeIntent, serialized: string, programs: string[]): UnsignedSolTx {
  assertSolanaPrograms(programs);
  if (!serialized) throw new Error("empty solana transaction");
  return { chain: "solana", serialized, programs, description: `${intent.side} ${intent.asset} via Jupiter (allowlisted)` };
}
