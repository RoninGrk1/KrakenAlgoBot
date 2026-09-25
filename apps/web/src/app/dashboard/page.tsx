"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { pct, usd } from "@/lib/format";
import { shorten } from "@/lib/wallet";
interface Portfolio {
  address: string; totalUsd: number; changePctToday: number;
  positions: { asset: string; usd: number; changePctToday: number }[];
}
export default function Dashboard() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [bot, setBot] = useState<any>(null);
  async function load() {
    const p = await api<Portfolio>("/v1/portfolio");
    setPortfolio(p);
    const bots = await api<{ bots: any[] }>("/v1/bots");
    setBot(bots.bots.at(-1) ?? null);
  }
  useEffect(() => {
    load().catch(() => undefined);
    const t = setInterval(() => load().catch(() => undefined), 15_000);
    return () => clearInterval(t);
  }, []);
  async function toggle() {
    if (!bot) return;
    setBot(await api<any>(`/v1/bots/${bot.id}/pause`, { method: "POST" }));
  }
  const running = bot?.state === "running";
  return (
    <main className="mx-auto min-h-screen max-w-lg px-5 py-6">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <div className="text-sm tracking-[0.16em] text-white/70">KrakenAlgoBot</div>
          <div className="text-[11px] text-white/30">{portfolio ? shorten(portfolio.address) : "—"}</div>
        </div>
        <span className="flex items-center gap-2 rounded-full border border-emerald-400/30 px-3 py-1 text-xs text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> LIVE
        </span>
      </header>
      <section className="mb-6">
        <div className="text-xs uppercase tracking-[0.18em] text-white/35">Portfolio</div>
        <div className="mt-1 text-4xl font-medium">{portfolio ? usd(portfolio.totalUsd) : "—"}</div>
        <div className="mt-1 text-sm text-emerald-300">{portfolio ? pct(portfolio.changePctToday) : ""} <span className="text-white/35">Today</span></div>
      </section>
      <section className="mb-6 space-y-2">
        {portfolio?.positions.map((p) => (
          <div key={p.asset} className="flex items-center justify-between text-sm">
            <span className="w-12 text-white/70">{p.asset}</span>
            <span className="flex-1 text-right">{usd(p.usd)}</span>
            <span className="w-16 text-right text-emerald-300">{pct(p.changePctToday)}</span>
          </div>
        ))}
      </section>
      <section className="mb-8 space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-white/45">Strategy</span><span>{bot ? bot.strategy : "—"}</span></div>
        <div className="flex justify-between"><span className="text-white/45">Risk</span><span>{bot ? `${bot.risk.riskPct.toFixed(1)}%` : "—"}</span></div>
        <div className="flex justify-between"><span className="text-white/45">Status</span><span>{running ? "Running" : bot?.state ?? "Idle"}</span></div>
      </section>
      <button onClick={toggle} disabled={!bot} className="w-full rounded-2xl border border-white/15 py-4 text-sm tracking-[0.14em] disabled:opacity-40">
        {running ? "PAUSE BOT" : "RESUME BOT"}
      </button>
      <nav className="mt-6 flex justify-center gap-6 text-xs text-white/40">
        <Link href="/activity">Activity</Link>
        <Link href="/setup">Reconfigure</Link>
        <button onClick={() => { sessionStorage.clear(); window.location.href = "/"; }}>Disconnect</button>
      </nav>
    </main>
  );
}
