export interface Allowlist {
  ethereum: { router: string; adapters: string[]; tokens: string[]; spenders: string[] };
  solana: { programs: string[]; tokens: string[] };
}
export const DEFAULT_ALLOWLIST: Allowlist = {
  ethereum: {
    router: process.env.EXECUTION_ROUTER_ETH ?? "",
    adapters: [process.env.ADAPTER_UNISWAP_V3 ?? ""].filter(Boolean),
    tokens: [
      "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"
    ],
    spenders: [process.env.EXECUTION_ROUTER_ETH ?? ""].filter(Boolean)
  },
  solana: {
    programs: ["JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4", "ComputeBudget111111111111111111111111111111"],
    tokens: ["So11111111111111111111111111111111111111112", "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"]
  }
};
const ZERO = "0x0000000000000000000000000000000000000000";
export function isAllowedAddress(value: string, list: string[]): boolean {
  const v = value.toLowerCase();
  return list.some((item) => item && item.toLowerCase() === v && item !== ZERO);
}
export function assertAllowlisted(kind: string, value: string, list: string[]): void {
  if (!value || !isAllowedAddress(value, list)) {
    throw new Error(`${kind} is not allowlisted: ${value || "(empty)"}`);
  }
}
