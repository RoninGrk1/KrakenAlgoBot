"use client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { usd } from "@/lib/format";
type Step = "asset" | "strategy" | "risk" | "simulate" | "authorise";
const STRATEGIES = [
  { id: "trend", name: "Trend", blurb: "EMA crossover following the prevailing move." },
  { id: "momentum", name: "Momentum", blurb: "Enter when rate-of-change clears a threshold." },
  { id: "dca", name: "DCA", blurb: "Scheduled clips. Ignores short-term noise." },
  { id: "rebalancing", name: "Rebalancing", blurb: "Restore target weight when drift exceeds the band." }
];
export default function Setup() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("asset");
  const [asset, setAsset] = useState("ETH");
  const [strategy, setStrategy] = useState("momentum");
  const [riskPct, setRiskPct] = useState(1);
  const [slippage, setSlippage] = useState(50);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sim, setSim] = useState<any>(null);
  const [botId, setBotId] = useState<string | null>(null);
  useEffect(() => { if (!sessionStorage.getItem("kab_session")) router.replace("/"); }, [router]);
  const risk = useMemo(() => ({
    riskPct, maxSlippageBps: slippage, maxSpendUsdPerTx: 500, maxSpendUsdPerDay: 2000,
    maxDailyLossUsd: 150, cooldownSeconds: 120, deadlineSeconds: 180
  }), [riskPct, slippage]);
  async function runSim() {
    setBusy(true); setError(null);
    try {
      const out = await api<any>("/v1/simulate", { method: "POST", body: JSON.stringify({ asset, strategy, risk, params: {}, venue: "onchain-dex" }) });
      setSim(out); setStep("simulate");
    } catch (err) { setError(err instanceof Error ? err.message : "Simulation failed"); }
    finally { setBusy(false); }
  }
  async function authorise() {
    if (!sim?.simulation?.intent?.id) return;
    setBusy(true); setError(null);
    try {
      await api(`/v1/intents/${sim.simulation.intent.id}/authorize`, { method: "POST" });
      const bot = await api<any>("/v1/bots", { method: "POST", body: JSON.stringify({ asset, strategy, risk, params: {}, venue: "onchain-dex" }) });
      await api(`/v1/bots/${bot.id}/activate`, { method: "POST" });
      setBotId(bot.id); setStep("authorise");
    } catch (err) { setError(err instanceof Error ? err.message : "Authorisation failed"); }
    finally { setBusy(false); }
  }
  return (
    <main className="mx-auto min-h-screen max-w-lg px-6 py-8">
      <header className="mb-8 flex items-center justify-between">
        <button onClick={() => router.back()} className="text-sm text-white/50">Back</button>
        <span className="text-xs uppercase tracking-[0.2em] text-white/40">{step}</span>
      </header>
      {step === "asset" && (
        <section className="space-y-4">
          <h1 className="text-2xl">Select asset</h1>
          {["BTC", "ETH", "SOL"].map((a) => (
            <button key={a} onClick={() => { setAsset(a); setStep("strategy"); }} className="w-full rounded-2xl border border-white/10 px-5 py-4 text-left">
              <div className="text-lg">{a}</div>
            </button>
          ))}
        </section>
      )}
      {step === "strategy" && (
        <section className="space-y-4">
          <h1 className="text-2xl">Select strategy</h1>
          {STRATEGIES.map((s) => (
            <button key={s.id} onClick={() => { setStrategy(s.id); setStep("risk"); }} className="w-full rounded-2xl border border-white/10 px-5 py-4 text-left">
              <div className="text-lg">{s.name}</div>
              <div className="text-xs text-mist">{s.blurb}</div>
            </button>
          ))}
        </section>
      )}
      {step === "risk" && (
        <section className="space-y-6">
          <h1 className="text-2xl">Set risk</h1>
          <label className="block space-y-2">
            <div className="flex justify-between text-sm"><span>Risk per trade</span><span>{riskPct.toFixed(1)}%</span></div>
            <input type="range" min={0.2} max={2} step={0.1} value={riskPct} onChange={(e) => setRiskPct(Number(e.target.value))} className="w-full" />
          </label>
          <label className="block space-y-2">
            <div className="flex justify-between text-sm"><span>Max slippage</span><span>{(slippage / 100).toFixed(2)}%</span></div>
            <input type="range" min={5} max={100} step={5} value={slippage} onChange={(e) => setSlippage(Number(e.target.value))} className="w-full" />
          </label>
          <button onClick={runSim} disabled={busy} className="w-full rounded-2xl bg-white py-4 text-sm font-medium text-black">{busy ? "Simulating…" : "Simulate"}</button>
        </section>
      )}
      {step === "simulate" && sim && (
        <section className="space-y-5">
          <h1 className="text-2xl">Simulate</h1>
          <div className="rounded-2xl border border-white/10 p-4 text-sm">
            <div className="flex justify-between py-2"><span className="text-white/45">Signal</span><span>{sim.signal.side} · {sim.signal.strategy}</span></div>
            <div className="flex justify-between py-2"><span className="text-white/45">Allowed</span><span>{sim.risk.allowed ? "Yes" : sim.risk.reasons.join(", ")}</span></div>
            {sim.disclosures && <div className="flex justify-between py-2"><span className="text-white/45">Network fee</span><span>{usd(sim.disclosures.networkFeeUsd)}</span></div>}
          </div>
          <button disabled={!sim.risk.allowed || busy} onClick={authorise} className="w-full rounded-2xl bg-white py-4 text-sm font-medium text-black disabled:opacity-40">Authorise</button>
        </section>
      )}
      {step === "authorise" && (
        <section className="space-y-5">
          <h1 className="text-2xl">Automate</h1>
          <p className="text-sm text-mist">Policy stored. Your wallet still signs. Bot {botId}</p>
          <button onClick={() => router.push("/dashboard")} className="w-full rounded-2xl bg-emerald-400 py-4 text-sm font-medium text-black">Open dashboard</button>
        </section>
      )}
      {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
    </main>
  );
}
