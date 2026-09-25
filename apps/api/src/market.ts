import type { Asset, Candle } from "@kab/shared";
import { quote } from "./prices.js";
export function syntheticCandles(asset: Asset, n = 80): Candle[] {
  const mark = quote(asset).usd || 100;
  const out: Candle[] = [];
  let px = mark * 0.96;
  const start = Date.now() - n * 3_600_000;
  for (let i = 0; i < n; i++) {
    const drift = (mark - px) * 0.08;
    const noise = Math.sin(i / 3) * mark * 0.004 + (i % 7 === 0 ? mark * 0.01 : 0);
    const close = Math.max(1, px + drift + noise);
    out.push({ ts: start + i * 3_600_000, open: px, high: Math.max(px, close) * 1.004, low: Math.min(px, close) * 0.996, close, volume: 10 + i });
    px = close;
  }
  out[out.length - 1]!.close = mark;
  return out;
}
export function demoPortfolio(address: string) {
  const btc = quote("BTC"); const eth = quote("ETH"); const sol = quote("SOL");
  const positions = [
    { asset: "BTC" as const, qty: 0.194, usd: 0.194 * btc.usd, changePctToday: btc.changePct },
    { asset: "ETH" as const, qty: 2.444, usd: 2.444 * eth.usd, changePctToday: eth.changePct },
    { asset: "SOL" as const, qty: 30.95, usd: 30.95 * sol.usd, changePctToday: sol.changePct }
  ];
  const totalUsd = positions.reduce((s, p) => s + p.usd, 0);
  const changePctToday = positions.reduce((s, p) => s + p.usd * p.changePctToday, 0) / (totalUsd || 1);
  return { address, totalUsd, changePctToday, positions, asOf: Date.now() };
}
