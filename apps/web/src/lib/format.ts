export function usd(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}
export function pct(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}
