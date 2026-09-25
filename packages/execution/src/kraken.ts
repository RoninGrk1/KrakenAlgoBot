export interface KrakenConfig { enabled: boolean; apiKey: string; apiSecret: string; baseUrl: string; }
export function krakenEnabled(cfg: KrakenConfig): boolean {
  return Boolean(cfg.enabled && cfg.apiKey && cfg.apiSecret);
}
export function krakenPair(asset: "BTC" | "ETH" | "SOL"): string {
  if (asset === "BTC") return "XBTUSD";
  if (asset === "ETH") return "ETHUSD";
  return "SOLUSD";
}
export async function krakenPublicTicker(baseUrl: string, pair: string, fetchImpl: typeof fetch = fetch): Promise<{ bid: number; ask: number }> {
  const url = `${baseUrl.replace(/\/$/, "")}/0/public/Ticker?pair=${pair}`;
  const res = await fetchImpl(url);
  if (!res.ok) throw new Error(`Kraken ticker HTTP ${res.status}`);
  const body = (await res.json()) as { error: string[]; result?: Record<string, { b: string[]; a: string[] }> };
  if (body.error?.length) throw new Error(body.error.join(","));
  const first = Object.values(body.result ?? {})[0];
  if (!first) throw new Error("empty Kraken ticker");
  return { bid: Number(first.b[0]), ask: Number(first.a[0]) };
}
export function refuseUserKrakenKeys(): never {
  throw new Error("User Kraken API keys are not accepted. Use a connected wallet for on-chain execution.");
}
