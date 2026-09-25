import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import { config } from "./config.js";
import { registerRoutes } from "./routes.js";
import { refreshPrices } from "./prices.js";
import { audit } from "./store.js";
import { assertProductionSafe } from "./observability.js";

async function main() {
  assertProductionSafe();
  const app = Fastify({ logger: { level: process.env.LOG_LEVEL ?? "info" } });

  await app.register(cors, {
    origin: config.webOrigin,
    credentials: true
  });
  await app.register(cookie);
  await app.register(rateLimit, {
    max: config.env === "production" ? 60 : 120,
    timeWindow: "1 minute"
  });

  app.addHook("onSend", async (_req, reply, payload) => {
    reply.header("x-content-type-options", "nosniff");
    reply.header("x-frame-options", "DENY");
    reply.header("referrer-policy", "no-referrer");
    reply.header("permissions-policy", "camera=(), microphone=(), geolocation=()");
    if (config.env === "production") reply.header("strict-transport-security", "max-age=15552000; includeSubDomains");
    return payload;
  });

  await registerRoutes(app);

  app.setErrorHandler((err, req, reply) => {
    req.log.error(err);
    audit("system", "error", { message: err.message, url: req.url });
    const status = (err as { statusCode?: number }).statusCode ?? 500;
    reply.code(status).send({ error: err.message });
  });

  await refreshPrices();
  setInterval(() => {
    refreshPrices().catch(() => undefined);
  }, Number(process.env.PRICE_POLL_MS ?? 15_000));

  await app.listen({ port: config.port, host: "0.0.0.0" });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
