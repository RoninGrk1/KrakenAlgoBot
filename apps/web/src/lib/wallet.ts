declare global {
  interface Window {
    ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> };
    solana?: {
      isPhantom?: boolean;
      connect: () => Promise<{ publicKey: { toString: () => string } }>;
      signMessage: (msg: Uint8Array, enc: string) => Promise<{ signature: Uint8Array }>;
    };
  }
}
export async function connectEvm(): Promise<string> {
  if (!window.ethereum) throw new Error("No EVM wallet found");
  const accounts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
  if (!accounts[0]) throw new Error("Wallet did not return an account");
  return accounts[0];
}
export async function signEvm(address: string, message: string): Promise<string> {
  if (!window.ethereum) throw new Error("No EVM wallet found");
  return (await window.ethereum.request({ method: "personal_sign", params: [message, address] })) as string;
}
export function shorten(addr: string): string {
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
