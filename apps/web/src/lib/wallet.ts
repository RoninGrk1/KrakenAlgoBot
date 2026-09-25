declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
    solana?: {
      isPhantom?: boolean;
      connect: () => Promise<{ publicKey: { toString: () => string } }>;
      signMessage: (msg: Uint8Array, enc: string) => Promise<{ signature: Uint8Array }>;
    };
  }
}

export type WalletKind = "eip1193" | "phantom";

export async function connectEvm(): Promise<string> {
  if (!window.ethereum) throw new Error("No EVM wallet found");
  const accounts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
  if (!accounts[0]) throw new Error("Wallet did not return an account");
  return accounts[0];
}

export async function signEvm(address: string, message: string): Promise<string> {
  if (!window.ethereum) throw new Error("No EVM wallet found");
  return (await window.ethereum.request({
    method: "personal_sign",
    params: [message, address]
  })) as string;
}

export async function connectSolana(): Promise<string> {
  if (!window.solana?.isPhantom) throw new Error("Phantom not found");
  const res = await window.solana.connect();
  return res.publicKey.toString();
}

export function shorten(addr: string): string {
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function toHexQty(value: string | number | bigint): string {
  const n = typeof value === "bigint" ? value : BigInt(value);
  return `0x${n.toString(16)}`;
}

export async function ensureChain(chainId: number): Promise<void> {
  if (!window.ethereum) throw new Error("No EVM wallet found");
  const hex = toHexQty(chainId);
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: hex }]
    });
  } catch (err) {
    const code = (err as { code?: number }).code;
    if (code === 4902 && chainId === 11155111) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: hex,
            chainName: "Sepolia",
            nativeCurrency: { name: "SepoliaETH", symbol: "ETH", decimals: 18 },
            rpcUrls: ["https://rpc.sepolia.org"],
            blockExplorerUrls: ["https://sepolia.etherscan.io"]
          }
        ]
      });
      return;
    }
    throw err;
  }
}

export interface WalletTx {
  to: string;
  data: string;
  value?: string;
  gas?: string;
  chainId?: number;
}

export async function sendEthTx(tx: WalletTx, from?: string): Promise<string> {
  if (!window.ethereum) throw new Error("No EVM wallet found");
  if (tx.chainId) await ensureChain(tx.chainId);
  const accounts =
    from ??
    ((await window.ethereum.request({ method: "eth_requestAccounts" })) as string[])[0];
  if (!accounts) throw new Error("Wallet did not return an account");
  const hash = (await window.ethereum.request({
    method: "eth_sendTransaction",
    params: [
      {
        from: accounts,
        to: tx.to,
        data: tx.data,
        value: toHexQty(tx.value ?? "0"),
        ...(tx.gas ? { gas: toHexQty(tx.gas) } : {})
      }
    ]
  })) as string;
  return hash;
}
