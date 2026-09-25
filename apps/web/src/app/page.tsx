"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { connectEvm, signEvm } from "@/lib/wallet";
export default function Landing() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function connect() {
    setBusy(true); setError(null);
    try {
      const address = await connectEvm();
      const { nonce, message } = await api<{ nonce: string; message: string }>("/v1/auth/nonce", { method: "POST", body: JSON.stringify({ address }) });
      const signature = await signEvm(address, message);
      const session = await api<{ token: string; address: string }>("/v1/auth/verify", { method: "POST", body: JSON.stringify({ address, nonce, signature, message }) });
      sessionStorage.setItem("kab_session", session.token);
      sessionStorage.setItem("kab_address", session.address);
      router.push("/setup");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wallet connection failed");
    } finally { setBusy(false); }
  }
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-between px-6 py-10">
      <header className="flex items-center justify-between">
        <span className="text-sm tracking-[0.2em] text-white/70">KRAKENALGOBOT</span>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/50">Non-custodial</span>
      </header>
      <section className="space-y-6">
        <p className="text-xs uppercase tracking-[0.25em] text-emerald-400/80">Plug in. Automate. Trade on-chain.</p>
        <h1 className="text-4xl font-medium leading-tight text-white">Automated strategies.<br />Your wallet signs.</h1>
        <p className="max-w-md text-sm leading-6 text-mist">Connect a wallet, pick a strategy, set risk, simulate, then authorise. Keys never leave your wallet.</p>
        <div className="flex gap-2 text-xs text-white/50">
          <span className="rounded-full bg-white/5 px-3 py-1">BTC</span>
          <span className="rounded-full bg-white/5 px-3 py-1">ETH</span>
          <span className="rounded-full bg-white/5 px-3 py-1">SOL</span>
        </div>
        <button onClick={connect} disabled={busy} className="w-full rounded-2xl bg-white py-4 text-sm font-medium text-black transition hover:bg-emerald-300 disabled:opacity-60">
          {busy ? "Waiting for wallet…" : "Connect wallet"}
        </button>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
      </section>
      <footer className="text-xs text-white/30">Non-custodial · Automated · On-chain</footer>
    </main>
  );
}
