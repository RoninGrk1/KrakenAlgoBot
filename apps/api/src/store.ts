import { newId, type BotConfig, type OnChainTx, type TradeIntent } from "@kab/shared";

export interface AuditRow {
  at: number;
  actor: string;
  action: string;
  entity?: string;
  payload: unknown;
  ip?: string;
}

export interface MemoryStore {
  wallets: Map<string, { address: string; chain: string; createdAt: number }>;
  bots: Map<string, BotConfig>;
  intents: Map<string, TradeIntent>;
  txs: Map<string, OnChainTx>;
  audit: AuditRow[];
  prices: Record<string, { usd: number; changePct: number; ts: number }>;
  flags: Record<string, string>;
  nonces: Map<string, { nonce: string; exp: number }>;
  sessions: Map<string, { address: string; exp: number }>;
}

export const memory: MemoryStore = {
  wallets: new Map(),
  bots: new Map(),
  intents: new Map(),
  txs: new Map(),
  audit: [],
  prices: {
    BTC: { usd: 64000, changePct: 3.1, ts: Date.now() },
    ETH: { usd: 3200, changePct: 2.4, ts: Date.now() },
    SOL: { usd: 148, changePct: 4.8, ts: Date.now() }
  },
  flags: { emergency_pause: "false" },
  nonces: new Map(),
  sessions: new Map()
};

export function audit(actor: string, action: string, payload: unknown, entity?: string, ip?: string): void {
  memory.audit.push({ at: Date.now(), actor, action, entity, payload, ip });
}

export function upsertWallet(address: string, chain: string): void {
  const key = address.toLowerCase();
  if (!memory.wallets.has(key)) {
    memory.wallets.set(key, { address: key, chain, createdAt: Date.now() });
  }
}

export function listBots(wallet: string): BotConfig[] {
  return [...memory.bots.values()].filter((b) => b.wallet === wallet.toLowerCase());
}

export function putBot(bot: BotConfig): BotConfig {
  memory.bots.set(bot.id, bot);
  return bot;
}

export function createBot(partial: Omit<BotConfig, "id" | "createdAt" | "updatedAt" | "state">): BotConfig {
  const now = Date.now();
  const bot: BotConfig = {
    ...partial,
    wallet: partial.wallet.toLowerCase(),
    id: newId("bot"),
    state: "idle",
    createdAt: now,
    updatedAt: now
  };
  return putBot(bot);
}

export function putIntent(intent: TradeIntent): TradeIntent {
  memory.intents.set(intent.id, intent);
  return intent;
}

export function putTx(tx: OnChainTx): OnChainTx {
  memory.txs.set(tx.hash, tx);
  return tx;
}

export function listTxs(wallet: string): OnChainTx[] {
  return [...memory.txs.values()]
    .filter((t) => t.from.toLowerCase() === wallet.toLowerCase())
    .sort((a, b) => b.submittedAt - a.submittedAt);
}

export function listPendingTxs(): OnChainTx[] {
  return [...memory.txs.values()].filter((t) => t.state === "pending" || t.state === "confirmed");
}

export function emergencyPaused(): boolean {
  return memory.flags.emergency_pause === "true";
}

export function setEmergencyPause(value: boolean): void {
  memory.flags.emergency_pause = value ? "true" : "false";
}
