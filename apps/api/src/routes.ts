import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { ASSETS, DEFAULT_RISK, STRATEGY_CATALOG, clamp, isAsset, isStrategy, type Asset, type RiskPolicy, type StrategyId, type Venue } from "@kab/shared";
import { evaluatePipeline } from "@kab/engine";
import { config, isAdmin } from "./config.js";
import { consumeNonce, issueNonce, readSession, signSession, siweMessage } from "./auth.js";
import { demoPortfolio, syntheticCandles } from "./market.js";
import { quote } from "./prices.js";
import { audit, createBot, emergencyPaused, listBots, listTxs, memory, putBot, putIntent, putTx, setEmergencyPause } from "./store.js";

function walletOf(req: { cookies?: Record<string, string>; headers: Record<string, unknown> }): string | null {
  const header = String(req.headers["x-session"] ?? "");
  return readSession(header || req.cookies?.kab_session);
}
const riskSchema = z.object({
  riskPct: z.number().positive().max(5),
  maxSlippageBps: z.number().int().positive().max(200),
  maxSpendUsdPerTx: z.number().positive(),
  maxSpendUsdPerDay: z.number().positive(),
  maxDailyLossUsd: z.number().positive(),
  cooldownSeconds: z.number().int().nonnegative(),
  deadlineSeconds: z.number().int().positive()
});

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async () => ({ ok: true, paused: emergencyPaused(), network: config.activeNetwork, ts: Date.now() }));
  app.get("/v1/meta", async () => ({ assets: ASSETS, strategies: STRATEGY_CATALOG, defaultRisk: DEFAULT_RISK, maxRiskPct: config.maxRiskPct }));
  app.get("/v1/prices", async () => memory.prices);
  app.post("/v1/auth/nonce", async (req, reply) => {
    const body = z.object({ address: z.string().min(4) }).parse(req.body);
    const nonce = issueNonce(body.address);
    audit(body.address.toLowerCase(), "nonce", { nonce }, "auth", req.ip);
    return reply.send({ nonce, message: siweMessage(body.address, nonce) });
  });
  app.post("/v1/auth/verify", async (req, reply) => {
    const body = z.object({ address: z.string().min(4), nonce: z.string().min(8), signature: z.string().min(8), message: z.string().min(16) }).parse(req.body);
    if (!consumeNonce(body.address, body.nonce)) return reply.code(401).send({ error: "invalid or expired nonce" });
    try {
      const { verifySiwe } = await import("./siwe.js");
      await verifySiwe(body.message, body.signature, body.nonce, body.address);
    } catch (err) {
      if (config.env === "production") return reply.code(401).send({ error: err instanceof Error ? err.message : "bad signature" });
    }
    const token = signSession(body.address);
    audit(body.address.toLowerCase(), "login", {}, "auth", req.ip);
    reply.setCookie("kab_session", token, { httpOnly: true, sameSite: "lax", secure: config.env === "production", path: "/", maxAge: 12 * 60 * 60 });
    return { address: body.address.toLowerCase(), token };
  });
  app.get("/v1/session", async (req, reply) => {
    const w = walletOf(req);
    if (!w) return reply.code(401).send({ error: "unauthenticated" });
    return { address: w, admin: isAdmin(w) };
  });
  app.get("/v1/portfolio", async (req, reply) => {
    const w = walletOf(req);
    if (!w) return reply.code(401).send({ error: "unauthenticated" });
    return demoPortfolio(w);
  });
  app.get("/v1/bots", async (req, reply) => {
    const w = walletOf(req);
    if (!w) return reply.code(401).send({ error: "unauthenticated" });
    return { bots: listBots(w) };
  });
  app.post("/v1/bots", async (req, reply) => {
    const w = walletOf(req);
    if (!w) return reply.code(401).send({ error: "unauthenticated" });
    const body = z.object({ asset: z.string(), strategy: z.string(), params: z.record(z.number()).default({}), risk: riskSchema, venue: z.enum(["onchain-dex", "kraken"]).default("onchain-dex") }).parse(req.body);
    if (!isAsset(body.asset) || !isStrategy(body.strategy)) return reply.code(400).send({ error: "unsupported asset or strategy" });
    if (body.risk.riskPct > config.maxRiskPct) return reply.code(400).send({ error: `riskPct exceeds protocol max ${config.maxRiskPct}` });
    if (body.venue === "kraken") return reply.code(400).send({ error: "End-user automation uses the on-chain DEX route." });
    const bot = createBot({ wallet: w, asset: body.asset, strategy: body.strategy, params: body.params, risk: body.risk, venue: body.venue });
    audit(w, "bot.create", bot, bot.id, req.ip);
    return reply.code(201).send(bot);
  });
  app.post("/v1/bots/:id/pause", async (req, reply) => {
    const w = walletOf(req);
    if (!w) return reply.code(401).send({ error: "unauthenticated" });
    const bot = memory.bots.get((req.params as { id: string }).id);
    if (!bot || bot.wallet !== w) return reply.code(404).send({ error: "not found" });
    bot.state = bot.state === "paused" ? "running" : "paused";
    bot.updatedAt = Date.now();
    putBot(bot);
    return bot;
  });
  app.post("/v1/bots/:id/activate", async (req, reply) => {
    const w = walletOf(req);
    if (!w) return reply.code(401).send({ error: "unauthenticated" });
    const bot = memory.bots.get((req.params as { id: string }).id);
    if (!bot || bot.wallet !== w) return reply.code(404).send({ error: "not found" });
    if (emergencyPaused()) return reply.code(423).send({ error: "emergency pause" });
    bot.state = "running"; bot.updatedAt = Date.now(); putBot(bot);
    return bot;
  });
  app.post("/v1/simulate", async (req, reply) => {
    const w = walletOf(req);
    if (!w) return reply.code(401).send({ error: "unauthenticated" });
    const body = z.object({ asset: z.string(), strategy: z.string(), params: z.record(z.number()).default({}), risk: riskSchema.default(DEFAULT_RISK), venue: z.enum(["onchain-dex", "kraken"]).default("onchain-dex") }).parse(req.body);
    if (!isAsset(body.asset) || !isStrategy(body.strategy)) return reply.code(400).send({ error: "invalid asset or strategy" });
    const portfolio = demoPortfolio(w);
    const result = evaluatePipeline({
      wallet: w, asset: body.asset as Asset, strategy: body.strategy as StrategyId, params: body.params,
      candles: syntheticCandles(body.asset as Asset),
      riskCtx: { policy: body.risk as RiskPolicy, portfolioUsd: portfolio.totalUsd, spentUsdToday: 0, realizedPnlUsdToday: 0, lastTradeTs: 0, paused: false, emergencyPaused: emergencyPaused() },
      policy: body.risk as RiskPolicy, venue: body.venue as Venue,
      networkFeeUsd: body.asset === "SOL" ? 0.02 : 1.8, venueFeeBps: 5, priceImpactBps: 6, nonce: `${Date.now()}`
    });
    if (result.simulation) putIntent(result.simulation.intent);
    return { mark: quote(body.asset as Asset), signal: result.signal, risk: result.risk, simulation: result.simulation, disclosures: result.simulation?.disclosures ?? null };
  });
  app.post("/v1/intents/:id/authorize", async (req, reply) => {
    const w = walletOf(req);
    if (!w) return reply.code(401).send({ error: "unauthenticated" });
    const intent = memory.intents.get((req.params as { id: string }).id);
    if (!intent || intent.wallet !== w) return reply.code(404).send({ error: "not found" });
    if (intent.state !== "simulated") return reply.code(409).send({ error: "intent not in simulated state" });
    if (intent.deadlineTs < Date.now()) { intent.state = "expired"; return reply.code(410).send({ error: "intent expired", intent }); }
    intent.state = "authorized"; putIntent(intent);
    return { intent, signing: { notice: "Your wallet must sign. The server never holds private keys.", feeUsd: intent.feeUsdEstimate, slippageBps: intent.maxSlippageBps, minOut: intent.minOut, deadlineTs: intent.deadlineTs, route: intent.routeSummary } };
  });
  app.post("/v1/intents/:id/broadcast", async (req, reply) => {
    const w = walletOf(req);
    if (!w) return reply.code(401).send({ error: "unauthenticated" });
    const body = z.object({ hash: z.string().min(8) }).parse(req.body);
    const intent = memory.intents.get((req.params as { id: string }).id);
    if (!intent || intent.wallet !== w) return reply.code(404).send({ error: "not found" });
    if (intent.state !== "authorized") return reply.code(409).send({ error: "authorize first" });
    intent.state = "broadcast"; putIntent(intent);
    const tx = putTx({ hash: body.hash, chain: intent.chain, state: "pending", from: w, to: intent.chain === "ethereum" ? process.env.EXECUTION_ROUTER_ETH || "router-pending-deploy" : "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4", intentId: intent.id, confirmations: 0, finalized: false, humanSummary: `${intent.side.toUpperCase()} ${intent.asset} · ${intent.routeSummary}`, submittedAt: Date.now(), updatedAt: Date.now() });
    return { intent, tx };
  });
  app.get("/v1/activity", async (req, reply) => {
    const w = walletOf(req);
    if (!w) return reply.code(401).send({ error: "unauthenticated" });
    return { txs: listTxs(w), intents: [...memory.intents.values()].filter((i) => i.wallet === w) };
  });
  app.post("/v1/admin/pause", async (req, reply) => {
    const w = walletOf(req);
    if (!w || !isAdmin(w)) return reply.code(403).send({ error: "admin only" });
    const body = z.object({ paused: z.boolean() }).parse(req.body);
    setEmergencyPause(body.paused);
    return { paused: emergencyPaused() };
  });
  app.get("/v1/risk/defaults", async () => ({ ...DEFAULT_RISK, riskPct: clamp(DEFAULT_RISK.riskPct, 0.1, config.maxRiskPct) }));
}
