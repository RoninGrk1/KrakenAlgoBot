import { DEFAULT_RISK } from "@kab/shared";

function req(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}
function bool(name: string, fallback = false): boolean {
  const v = process.env[name];
  if (v === undefined) return fallback;
  return v === "1" || v.toLowerCase() === "true";
}
export const config = {
  env: req("NODE_ENV", "development"),
  port: Number(req("PORT", "8080")),
  webOrigin: req("WEB_ORIGIN", "http://localhost:3000"),
  databaseUrl: req("DATABASE_URL", ""),
  redisUrl: req("REDIS_URL", ""),
  sessionSecret: req("SESSION_SECRET", "dev-only-change-me-dev-only-change-me-dev-only"),
  siweDomain: req("SIWE_DOMAIN", "localhost:3000"),
  siweUri: req("SIWE_URI", "http://localhost:3000"),
  ethRpc: req("ETH_RPC_URL"),
  solRpc: req("SOLANA_RPC_URL"),
  activeNetwork: req("ACTIVE_NETWORK", "testnet"),
  coingecko: req("COINGECKO_BASE_URL", "https://api.coingecko.com/api/v3"),
  defaultRisk: DEFAULT_RISK,
  maxRiskPct: Number(req("MAX_RISK_PCT", "2")),
  adminWallets: req("ADMIN_WALLETS", "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
  kraken: {
    enabled: bool("KRAKEN_ENABLED"),
    apiKey: req("KRAKEN_API_KEY"),
    apiSecret: req("KRAKEN_API_SECRET"),
    baseUrl: req("KRAKEN_BASE_URL", "https://api.kraken.com")
  },
  alertWebhook: req("ALERT_WEBHOOK_URL")
};
export function isAdmin(address: string): boolean {
  return config.adminWallets.includes(address.toLowerCase());
}
