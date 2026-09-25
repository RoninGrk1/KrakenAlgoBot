export const TX_STATES = ["pending", "confirmed", "finalized", "failed"] as const;
export type TxState = (typeof TX_STATES)[number];
export const BOT_STATES = ["idle", "simulating", "awaiting_signature", "running", "paused", "stopped", "error"] as const;
export type BotState = (typeof BOT_STATES)[number];
export const INTENT_STATES = ["draft", "risk_rejected", "simulated", "authorized", "broadcast", "confirmed", "finalized", "failed", "expired"] as const;
export type IntentState = (typeof INTENT_STATES)[number];
