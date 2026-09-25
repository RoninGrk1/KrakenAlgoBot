import { confirmationsOf, ethBlockNumber, ethGetReceipt, receiptFailed } from "@kab/execution";
import type { OnChainTx } from "@kab/shared";

/**
 * Keeper / indexer loop.
 * - Polls pending txs via the API
 * - Reads receipts from ETH_RPC
 * - Never signs user transactions
 * - Advances Pending → Confirmed → Finalized
 */
const api = process.env.API_PUBLIC_URL ?? "http://localhost:8080";
const workerToken = process.env.WORKER_TOKEN ?? "dev-worker-token";
const ethRpc = process.env.ETH_TESTNET_RPC_URL || process.env.ETH_RPC_URL || "";

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

async function tick(): Promise<void> {
  const health = (await fetch(`${api}/health`).then((r) => r.json())) as { paused?: boolean };
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
  setInterval(() => {
    tick().catch((err) => console.error("tick failed", err));
  }, Number(process.env.WORKER_POLL_MS ?? 12_000));
  await tick().catch((err) => console.error("initial tick failed", err));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
