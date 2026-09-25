import { ASSETS, type Asset } from "@kab/shared";
import { config } from "./config.js";
import { memory } from "./store.js";

const IDS: Record<Asset, string> = { BTC: "bitcoin", ETH: "ethereum", SOL: "solana" };

export async function refreshPrices(fetchImpl: typeof fetch = fetch): Promise<void> {
  try {
    const ids = ASSETS.map((a) => IDS[a]).join(",");
    const url = `${config.coingecko}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
    const res = await fetchImpl(url, { headers: { accept: "application/json" } });
    if (!res.ok) return;
    const body = (await res.json()) as Record<string, { usd: number; usd_24h_change: number }>;
    const now = Date.now();
    for (const asset of ASSETS) {
      const row = body[IDS[asset]];
      if (!row) continue;
      memory.prices[asset] = { usd: row.usd, changePct: row.usd_24h_change, ts: now };
    }
  } catch {
    // keep last cached prices
  }
}

export function quote(asset: Asset): { usd: number; changePct: number; ts: number } {
  return memory.prices[asset] ?? { usd: 0, changePct: 0, ts: 0 };
}

export function latestPriceTs(): number {
  return Math.max(0, ...ASSETS.map((a) => memory.prices[a]?.ts ?? 0));
}
