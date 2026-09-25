import { config } from "./config.js";

export interface InfraHealth {
  postgres: "ok" | "skipped" | "down";
  redis: "ok" | "skipped" | "down";
  prices: "live" | "stale" | "seeded";
}

export async function checkInfra(priceTs: number): Promise<InfraHealth> {
  const out: InfraHealth = {
    postgres: config.databaseUrl ? "down" : "skipped",
    redis: config.redisUrl ? "down" : "skipped",
    prices: priceAge(priceTs)
  };

  if (config.databaseUrl) {
    try {
      const { default: pg } = await import("pg");
      const client = new pg.Client({ connectionString: config.databaseUrl, connectionTimeoutMillis: 1500 });
      await client.connect();
      await client.query("select 1");
      await client.end();
      out.postgres = "ok";
    } catch {
      out.postgres = "down";
    }
  }

  if (config.redisUrl) {
    try {
      const { default: Redis } = await import("ioredis");
      const redis = new Redis(config.redisUrl, { connectTimeout: 1500, lazyConnect: true, maxRetriesPerRequest: 1 });
      await redis.connect();
      const pong = await redis.ping();
      await redis.quit();
      out.redis = pong ? "ok" : "down";
    } catch {
      out.redis = "down";
    }
  }

  return out;
}

export function priceAge(ts: number): "live" | "stale" | "seeded" {
  if (!ts) return "seeded";
  const age = Date.now() - ts;
  if (age > 5 * 60_000) return "stale";
  return "live";
}
