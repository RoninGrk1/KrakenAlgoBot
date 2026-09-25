import type { Asset, Candle } from "@kab/shared";
import { ethGetBalance } from "@kab/execution";
import { config } from "./config.js";
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
    const high = Math.max(px, close) * 1.004;
    const low = Math.min(px, close) * 0.996;
    out.push({ ts: start + i * 3_600_000, open: px, high, low, close, volume: 10 + i });
    px = close;
  }
  out[out.length - 1]!.close = mark;
  return out;
}

export type PositionSource = "onchain" | "demo-mtm";

export interface PortfolioPosition {
  asset: Asset;
  qty: number;
  usd: number;
  changePctToday: number;
  source: PositionSource;
}

export interface PortfolioSnapshot {
  address: string;
  totalUsd: number;
  changePctToday: number;
  positions: PortfolioPosition[];
  asOf: number;
  source: "mixed" | "demo-mtm";
  notice: string;
}

const DEMO_QTY: Record<Asset, number> = {
  BTC: 0.194,
  ETH: 2.444,
  SOL: 30.95
};

export async function loadPortfolio(address: string): Promise<PortfolioSnapshot> {
  const btc = quote("BTC");
  const eth = quote("ETH");
  const sol = quote("SOL");

  let ethQty = DEMO_QTY.ETH;
  let ethSource: PositionSource = "demo-mtm";

  if (config.ethRpc && address.startsWith("0x")) {
    try {
      const wei = await ethGetBalance(config.ethRpc, address);
      ethQty = Number(wei) / 1e18;
      ethSource = "onchain";
    } catch {
      ethSource = "demo-mtm";
      ethQty = DEMO_QTY.ETH;
    }
  }

  const positions: PortfolioPosition[] = [
    { asset: "BTC", qty: DEMO_QTY.BTC, usd: DEMO_QTY.BTC * btc.usd, changePctToday: btc.changePct, source: "demo-mtm" },
    { asset: "ETH", qty: ethQty, usd: ethQty * eth.usd, changePctToday: eth.changePct, source: ethSource },
    { asset: "SOL", qty: DEMO_QTY.SOL, usd: DEMO_QTY.SOL * sol.usd, changePctToday: sol.changePct, source: "demo-mtm" }
  ];

  const totalUsd = positions.reduce((s, p) => s + p.usd, 0);
  const changePctToday = positions.reduce((s, p) => s + p.usd * p.changePctToday, 0) / (totalUsd || 1);
  const mixed = positions.some((p) => p.source === "onchain");

  return {
    address,
    totalUsd,
    changePctToday,
    positions,
    asOf: Date.now(),
    source: mixed ? "mixed" : "demo-mtm",
    notice: mixed
      ? "ETH quantity is the on-chain native balance. BTC and SOL remain demo mark-to-market until the indexer is live."
      : "Demo mark-to-market (fixed qty × live price). Not reconciled wallet balances."
  };
}

/** Backward-compatible sync snapshot used by simulation sizing. */
export function demoPortfolio(address: string): PortfolioSnapshot {
  const btc = quote("BTC");
  const eth = quote("ETH");
  const sol = quote("SOL");
  const positions: PortfolioPosition[] = [
    { asset: "BTC", qty: DEMO_QTY.BTC, usd: DEMO_QTY.BTC * btc.usd, changePctToday: btc.changePct, source: "demo-mtm" },
    { asset: "ETH", qty: DEMO_QTY.ETH, usd: DEMO_QTY.ETH * eth.usd, changePctToday: eth.changePct, source: "demo-mtm" },
    { asset: "SOL", qty: DEMO_QTY.SOL, usd: DEMO_QTY.SOL * sol.usd, changePctToday: sol.changePct, source: "demo-mtm" }
  ];
  const totalUsd = positions.reduce((s, p) => s + p.usd, 0);
  const changePctToday = positions.reduce((s, p) => s + p.usd * p.changePctToday, 0) / (totalUsd || 1);
  return {
    address,
    totalUsd,
    changePctToday,
    positions,
    asOf: Date.now(),
    source: "demo-mtm",
    notice: "Demo mark-to-market used for simulation sizing."
  };
}

export function portfolioHistory(totalUsd: number, changePctToday: number, n = 48): { ts: number; usd: number }[] {
  const out: { ts: number; usd: number }[] = [];
  const start = Date.now() - n * 30 * 60_000;
  const startUsd = totalUsd / (1 + changePctToday / 100);
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const wave = Math.sin(i / 4) * totalUsd * 0.008;
    const usd = startUsd + (totalUsd - startUsd) * t + wave;
    out.push({ ts: start + i * 30 * 60_000, usd });
  }
  out[out.length - 1]!.usd = totalUsd;
  return out;
}
