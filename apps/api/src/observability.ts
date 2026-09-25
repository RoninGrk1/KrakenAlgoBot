import { config } from "./config.js";

export async function emitAlert(event: string, payload: Record<string, unknown>): Promise<void> {
  if (!config.alertWebhook) return;
  try {
    await fetch(config.alertWebhook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ source: "krakenalgobot", event, ts: Date.now(), ...payload })
    });
  } catch {
    // alerting must never break the request path
  }
}

export function assertProductionSafe(): void {
  if (config.env !== "production") return;
  if (!config.sessionSecret || config.sessionSecret.includes("dev-only") || config.sessionSecret.length < 32) {
    throw new Error("SESSION_SECRET must be a 32+ char secret in production");
  }
  if (!config.workerToken || config.workerToken === "dev-worker-token") {
    throw new Error("WORKER_TOKEN must be rotated away from the development default");
  }
  if (config.activeNetwork === "mainnet" && !config.contracts.router) {
    throw new Error("mainnet requires EXECUTION_ROUTER_ETH");
  }
}
