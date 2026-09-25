export interface JsonRpcReceipt {
  status: string | null;
  blockNumber: string | null;
  blockHash: string | null;
  transactionHash: string;
  from: string;
  to: string | null;
}

async function rpc<T>(url: string, method: string, params: unknown[]): Promise<T> {
  if (!url) throw new Error("ETH_RPC_URL is not set");
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params })
  });
  if (!res.ok) throw new Error(`rpc http ${res.status}`);
  const body = (await res.json()) as { result?: T; error?: { message: string } };
  if (body.error) throw new Error(body.error.message);
  return body.result as T;
}

export async function ethBlockNumber(rpcUrl: string): Promise<number> {
  const hex = await rpc<string>(rpcUrl, "eth_blockNumber", []);
  return Number.parseInt(hex, 16);
}

export async function ethGetReceipt(rpcUrl: string, hash: string): Promise<JsonRpcReceipt | null> {
  return rpc<JsonRpcReceipt | null>(rpcUrl, "eth_getTransactionReceipt", [hash]);
}

export async function ethGetTransaction(rpcUrl: string, hash: string): Promise<{ hash: string } | null> {
  return rpc<{ hash: string } | null>(rpcUrl, "eth_getTransactionByHash", [hash]);
}

export async function ethGetBalance(rpcUrl: string, address: string): Promise<bigint> {
  const hex = await rpc<string>(rpcUrl, "eth_getBalance", [address, "latest"]);
  return BigInt(hex);
}

export function confirmationsOf(head: number, receipt: JsonRpcReceipt | null): number {
  if (!receipt?.blockNumber) return 0;
  const mined = Number.parseInt(receipt.blockNumber, 16);
  return Math.max(0, head - mined + 1);
}

export function receiptFailed(receipt: JsonRpcReceipt | null): boolean {
  return Boolean(receipt && receipt.status === "0x0");
}
