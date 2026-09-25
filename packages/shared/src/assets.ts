export const ASSETS = ["BTC", "ETH", "SOL"] as const;
export type Asset = (typeof ASSETS)[number];
export const CHAINS = ["ethereum", "solana"] as const;
export type Chain = (typeof CHAINS)[number];
export interface AssetRoute {
  asset: Asset;
  chain: Chain;
  symbol: string;
  decimals: number;
  token: string;
  wrappedOf?: Asset;
  coingeckoId: string;
  venue: "uniswap-v3" | "jupiter" | "native";
}
export const ASSET_ROUTES: AssetRoute[] = [
  { asset: "ETH", chain: "ethereum", symbol: "ETH", decimals: 18, token: "native", coingeckoId: "ethereum", venue: "uniswap-v3" },
  { asset: "BTC", chain: "ethereum", symbol: "WBTC", decimals: 8, token: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", wrappedOf: "BTC", coingeckoId: "bitcoin", venue: "uniswap-v3" },
  { asset: "SOL", chain: "solana", symbol: "SOL", decimals: 9, token: "native", coingeckoId: "solana", venue: "jupiter" }
];
export const STABLE_ROUTES: Record<Chain, AssetRoute> = {
  ethereum: { asset: "ETH", chain: "ethereum", symbol: "USDC", decimals: 6, token: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", coingeckoId: "usd-coin", venue: "uniswap-v3" },
  solana: { asset: "SOL", chain: "solana", symbol: "USDC", decimals: 6, token: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", coingeckoId: "usd-coin", venue: "jupiter" }
};
export function routesFor(asset: Asset): AssetRoute[] {
  return ASSET_ROUTES.filter((r) => r.asset === asset);
}
export function isAsset(value: string): value is Asset {
  return (ASSETS as readonly string[]).includes(value);
}
