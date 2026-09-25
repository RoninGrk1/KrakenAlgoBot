export interface TxSimulationRequest { chain: "ethereum" | "solana"; from: string; to?: string; data?: string; value?: string; serialized?: string; }
export interface TxSimulationResult { success: boolean; gasUsed?: string; logs: string[]; error?: string; }
export async function simulateUnsigned(req: TxSimulationRequest): Promise<TxSimulationResult> {
  if (req.chain === "ethereum") {
    if (!req.to || !req.data) return { success: false, logs: [], error: "missing to/data" };
    return { success: true, gasUsed: "250000", logs: ["eth_call stub: payload present"] };
  }
  if (!req.serialized) return { success: false, logs: [], error: "missing serialized tx" };
  return { success: true, logs: ["solana simulate stub: payload present"] };
}
