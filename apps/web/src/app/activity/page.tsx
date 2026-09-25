"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
interface Tx { hash: string; state: string; humanSummary: string; confirmations: number; finalized: boolean; submittedAt: number; }
export default function Activity() {
  const [txs, setTxs] = useState<Tx[]>([]);
  const [intents, setIntents] = useState<any[]>([]);
  useEffect(() => {
    api<{ txs: Tx[]; intents: any[] }>("/v1/activity").then((r) => { setTxs(r.txs); setIntents(r.intents); }).catch(() => undefined);
  }, []);
  return (
    <main className="mx-auto min-h-screen max-w-lg px-5 py-6">
      <header className="mb-6 flex items-center justify-between">
        <Link href="/dashboard" className="text-sm text-white/50">Dashboard</Link>
        <span className="text-xs uppercase tracking-[0.2em] text-white/40">Settlement</span>
      </header>
      <p className="mb-4 text-xs text-mist">Pending → Confirmed → Finalized</p>
      <ul className="space-y-3">
        {txs.map((t) => (
          <li key={t.hash} className="rounded-2xl border border-white/10 p-4">
            <div className="mb-1 flex items-center justify-between text-sm"><span>{t.humanSummary}</span><StatePill state={t.state} /></div>
            <div className="break-all text-[11px] text-white/35">{t.hash}</div>
          </li>
        ))}
        {!txs.length && intents.map((i) => (
          <li key={i.id} className="rounded-2xl border border-white/10 p-4 text-sm">
            <div className="flex justify-between"><span>{i.side} {i.asset}</span><StatePill state={i.state} /></div>
            <div className="mt-1 text-[11px] text-white/35">{i.routeSummary}</div>
          </li>
        ))}
        {!txs.length && !intents.length ? <li className="text-sm text-white/40">No on-chain activity yet.</li> : null}
      </ul>
    </main>
  );
}
function StatePill({ state }: { state: string }) {
  const color = state === "finalized" ? "text-emerald-300 border-emerald-400/30" : state === "failed" || state === "expired" ? "text-red-300 border-red-400/30" : "text-amber-300 border-amber-400/30";
  return <span className={`rounded-full border px-2 py-0.5 text-[11px] uppercase ${color}`}>{state}</span>;
}
