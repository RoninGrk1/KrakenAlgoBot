import { reconcile } from "./reconcile.js";
const api = process.env.API_PUBLIC_URL ?? "http://localhost:8080";
async function tick(): Promise<void> {
  const health = await fetch(`${api}/health`).then((r) => r.json()) as { paused?: boolean };
  if (health.paused) return;
}
async function main() {
  console.log("krakenalgobot worker started", { api });
  setInterval(() => { tick().catch((err) => console.error("tick failed", err)); }, 15_000);
  void reconcile;
}
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => { console.error(err); process.exit(1); });
}
