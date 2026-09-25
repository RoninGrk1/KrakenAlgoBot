import type { Asset, Chain } from "@kab/shared";

export interface NetworkTokens {
  chainId: number;
  name: string;
  native: `0x${string}`;
  weth: `0x${string}`;
  usdc: `0x${string}`;
  wbtc: `0x${string}`;
  uniswapSwapRouter02: `0x${string}`;
}

const ZERO = "0x0000000000000000000000000000000000000000" as const;
const NATIVE = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" as const;

/** Official Uniswap v3 SwapRouter02 on Ethereum / Sepolia. */
export const NETWORKS: Record<"ethereum-mainnet" | "ethereum-sepolia", NetworkTokens> = {
  "ethereum-mainnet": {
    chainId: 1,
    name: "Ethereum",
    native: NATIVE,
    weth: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    usdc: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    wbtc: "0x2260FAC5E5542a773aa44fBCfeDf7C193bc2C599",
    uniswapSwapRouter02: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45"
  },
  "ethereum-sepolia": {
    chainId: 11155111,
    name: "Sepolia",
    native: NATIVE,
    weth: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
    usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    wbtc: (process.env.TOKEN_WBTC_TESTNET as `0x${string}`) || ZERO,
    uniswapSwapRouter02: "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E"
  }
};

export function resolveNetwork(activeNetwork: string, chainId?: number): NetworkTokens {
  if (chainId === 1 || activeNetwork === "mainnet") return NETWORKS["ethereum-mainnet"];
  return NETWORKS["ethereum-sepolia"];
}

export function tokenForAsset(
  asset: Asset,
  side: "buy" | "sell",
  net: NetworkTokens
): { tokenIn: `0x${string}`; tokenOut: `0x${string}`; tokenInDecimals: number; tokenOutDecimals: number } {
  if (asset === "ETH") {
    return side === "buy"
      ? { tokenIn: net.usdc, tokenOut: net.weth, tokenInDecimals: 6, tokenOutDecimals: 18 }
      : { tokenIn: ZERO, tokenOut: net.usdc, tokenInDecimals: 18, tokenOutDecimals: 6 };
  }
  if (asset === "BTC") {
    return side === "buy"
      ? { tokenIn: net.usdc, tokenOut: net.wbtc, tokenInDecimals: 6, tokenOutDecimals: 8 }
      : { tokenIn: net.wbtc, tokenOut: net.usdc, tokenInDecimals: 8, tokenOutDecimals: 6 };
  }
  throw new Error(`ethereum encoder does not handle ${asset}`);
}

export function isNativeToken(token: string): boolean {
  return token === ZERO || token.toLowerCase() === NATIVE.toLowerCase();
}

export type { Chain };
