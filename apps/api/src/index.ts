import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import { config } from "./config.js";
import { registerRoutes } from "./routes.js";
import { refreshPrices } from "./prices.js";
import { audit } from "./store.js";

async function main() {
  const app = Fastify({ logger: { level: process.env.LOG_LEVEL ?? "info" } });
  await app.register(cors, { origin: config.webOrigin, credentials: true });
  await app.register(cookie);
  await app.register(rateLimit, { max: 120, timeWindow: "1 minute" });
  await registerRoutes(app);
  app.setErrorHandler((err, req, reply) => {
    req.log.error(err);
    audit("system", "error", { message: err.message, url: req.url });
    const status = (err as { statusCode?: number }).statusCode ?? 500;
    reply.code(status).send({ error: err.message });
  });
  await refreshPrices();
  setInterval(() => { refreshPrices().catch(() => undefined); }, Number(process.env.PRICE_POLL_MS ?? 15_000));
  await app.listen({ port: config.port, host: "0.0.0.0" });
}

main().catch((err) => { console.error(err); process.exit(1); });
