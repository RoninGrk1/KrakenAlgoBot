export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
export function roundUsd(n: number): number {
  return Math.round(n * 100) / 100;
}
export function bps(n: number, points: number): number {
  return n * (points / 10_000);
}
export function applySlippage(amount: number, slippageBps: number, side: "buy" | "sell"): number {
  if (side === "buy") return amount * (1 - slippageBps / 10_000);
  return amount * (1 + slippageBps / 10_000);
}
export function pctChange(from: number, to: number): number {
  if (from === 0) return 0;
  return ((to - from) / from) * 100;
}
export function formatUsd(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);
}
export function formatPct(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}
