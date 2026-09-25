/**
 * Production allowlists. Empty router addresses mean "not deployed yet" and
 * the execution layer must refuse to encode a live transaction.
 */
export interface Allowlist {
  ethereum: {
    router: string;
    adapters: string[];
    tokens: string[];
    spenders: string[];
  };
  solana: {
    programs: string[];
    tokens: string[];
  };
}

export function loadAllowlist(env: NodeJS.ProcessEnv = process.env): Allowlist {
  const router = env.EXECUTION_ROUTER_ETH ?? "";
  const adapter = env.ADAPTER_UNISWAP_V3 ?? "";
  const extraTokens = (env.ALLOWLIST_TOKENS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    ethereum: {
      router,
      adapters: [adapter].filter(Boolean),
      tokens: [
        "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
        env.TOKEN_USDC || "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        env.TOKEN_WBTC || "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
        env.TOKEN_WETH || "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        ...extraTokens
      ].filter(Boolean),
      spenders: [router].filter(Boolean)
    },
    solana: {
      programs: [
        "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
        "ComputeBudget111111111111111111111111111111"
      ],
      tokens: [
        "So11111111111111111111111111111111111111112",
        "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
      ]
    }
  };
}

/** Snapshot at import time. Restart after changing router env vars. Prefer loadAllowlist() in request paths. */
export const DEFAULT_ALLOWLIST: Allowlist = loadAllowlist();

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
