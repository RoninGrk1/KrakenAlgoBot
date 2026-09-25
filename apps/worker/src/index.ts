import { confirmationsOf, ethBlockNumber, ethGetReceipt, receiptFailed } from "@kab/execution";
import type { OnChainTx } from "@kab/shared";

const api = process.env.API_PUBLIC_URL ?? "http://localhost:8080";
const workerToken = process.env.WORKER_TOKEN ?? "dev-worker-token";
const ethRpc = process.env.ETH_TESTNET_RPC_URL || process.env.ETH_RPC_URL || "";
const alertWebhook = process.env.ALERT_WEBHOOK_URL ?? "";

let failStreak = 0;

async function apiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${api}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      "x-worker-token": workerToken,
      ...(init.headers || {})
    }
  });
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  return res.json() as Promise<T>;
}

async function alert(event: string, payload: Record<string, unknown>): Promise<void> {
  if (!alertWebhook) return;
  try {
    await fetch(alertWebhook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ source: "krakenalgobot-worker", event, ts: Date.now(), ...payload })
    });
  } catch {
    /* ignore */
  }
}

async function tick(): Promise<void> {
  const health = (await fetch(`${api}/health`).then((r) => r.json())) as { paused?: boolean; ok?: boolean };
  if (!health.ok) throw new Error("api unhealthy");
  if (health.paused) return;
  if (!ethRpc) return;

  const { txs } = await apiJson<{ txs: OnChainTx[] }>("/v1/internal/txs/pending");
  if (!txs.length) return;

  const head = await ethBlockNumber(ethRpc);
  for (const tx of txs) {
    if (tx.chain !== "ethereum") continue;
    const receipt = await ethGetReceipt(ethRpc, tx.hash);
    const failed = receiptFailed(receipt);
    const confirmations = confirmationsOf(head, receipt);
    if (!receipt && confirmations === 0 && !failed) continue;
    await apiJson(`/v1/internal/txs/${tx.hash}/reconcile`, {
      method: "POST",
      body: JSON.stringify({
        confirmations,
        failed,
        blockNumber: receipt?.blockNumber ? Number.parseInt(receipt.blockNumber, 16) : undefined
      })
    });
  }
}

export async function main() {
  console.log("krakenalgobot worker started", { api, rpc: Boolean(ethRpc) });
  const loop = async () => {
    try {
      await tick();
      failStreak = 0;
    } catch (err) {
      failStreak += 1;
      console.error("tick failed", err);
      if (failStreak === 3 || failStreak % 10 === 0) {
        await alert("worker_tick_failed", {
          failStreak,
          message: err instanceof Error ? err.message : String(err)
        });
      }
    }
  };
  setInterval(() => {
    void loop();
  }, Number(process.env.WORKER_POLL_MS ?? 12_000));
  await loop();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
