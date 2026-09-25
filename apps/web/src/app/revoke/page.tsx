"use client";
import Link from "next/link";
export default function Revoke() {
  return (
    <main className="mx-auto min-h-screen max-w-lg px-5 py-6">
      <Link href="/dashboard" className="text-sm text-white/50">Dashboard</Link>
      <h1 className="mt-6 text-2xl">Revoke approvals</h1>
      <p className="mt-2 text-sm text-mist">KrakenAlgoBot never holds keys. Revoke token approvals from your wallet if you approved the execution router.</p>
    </main>
  );
}
