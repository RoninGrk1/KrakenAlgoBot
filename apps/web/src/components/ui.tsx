"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export function Shell({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-black"
      >
        Skip to content
      </a>
      <main id="main" className={`mx-auto min-h-screen px-5 py-6 sm:px-8 ${wide ? "max-w-5xl" : "max-w-lg lg:max-w-5xl"}`}>
        {children}
      </main>
    </div>
  );
}

export function LiveBadge({ live, label }: { live: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${
        live ? "border-emerald-400/30 text-emerald-300" : "border-amber-400/30 text-amber-300"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${live ? "bg-emerald-400" : "bg-amber-400"}`} />
      {label}
    </span>
  );
}

export function StatePill({ state }: { state: string }) {
  const color =
    state === "finalized" || state === "running"
      ? "text-emerald-300 border-emerald-400/30"
      : state === "failed" || state === "expired" || state === "paused"
        ? "text-red-300 border-red-400/30"
        : state === "confirmed" || state === "authorized"
          ? "text-sky-300 border-sky-400/30"
          : "text-amber-300 border-amber-400/30";
  return <span className={`rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-wide ${color}`}>{state}</span>;
}

export function Banner({ tone = "info", children }: { tone?: "info" | "warn" | "error"; children: ReactNode }) {
  const cls =
    tone === "error"
      ? "border-red-400/30 bg-red-400/10 text-red-200"
      : tone === "warn"
        ? "border-amber-400/30 bg-amber-400/10 text-amber-100"
        : "border-white/10 bg-white/5 text-white/70";
  return <div className={`rounded-2xl border px-4 py-3 text-xs leading-5 ${cls}`}>{children}</div>;
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/5 ${className}`} />;
}

export function Nav({ current }: { current?: "dash" | "activity" | "setup" | "revoke" }) {
  const item = (href: string, label: string, key: string) => (
    <Link href={href} className={`text-xs ${current === key ? "text-white" : "text-white/40 hover:text-white/70"}`}>
      {label}
    </Link>
  );
  return (
    <nav className="mt-8 flex flex-wrap justify-center gap-5" aria-label="Primary">
      {item("/dashboard", "Dashboard", "dash")}
      {item("/activity", "Activity", "activity")}
      {item("/setup", "Reconfigure", "setup")}
      {item("/revoke", "Revoke", "revoke")}
    </nav>
  );
}

export function Sparkline({ values }: { values: number[] }) {
  if (!values.length) {
    return <div className="flex h-40 items-center justify-center text-xs text-white/30">No series yet</div>;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const w = 640;
  const h = 160;
  const pts = values
    .map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * w;
      const y = h - ((v - min) / span) * (h - 16) - 8;
      return `${x},${y}`;
    })
    .join(" ");
  const last = values[values.length - 1] ?? 0;
  const first = values[0] ?? last;
  const up = last >= first;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-40 w-full" role="img" aria-label="Portfolio series">
      <polyline fill="none" stroke={up ? "#3ee07a" : "#f87171"} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" points={pts} />
    </svg>
  );
}

export function Stepper({ steps, current }: { steps: string[]; current: string }) {
  return (
    <ol className="mb-8 flex gap-2" aria-label="Setup progress">
      {steps.map((s) => (
        <li
          key={s}
          className={`h-1 flex-1 rounded-full ${s === current || steps.indexOf(s) < steps.indexOf(current) ? "bg-emerald-400" : "bg-white/10"}`}
        />
      ))}
    </ol>
  );
}
