# KrakenAlgoBot

Non-custodial. Automated. On-chain.

Production-oriented trading platform for **BTC, ETH & SOL**: automated strategies, wallet-signed execution, and verifiable settlement. The server never stores private keys and never signs user transactions.

> Plug in. Automate. Trade on-chain.

## Product flow

```
CONNECT WALLET
      ↓
SELECT ASSET
      ↓
SELECT STRATEGY
      ↓
SET RISK
      ↓
SIMULATE
      ↓
AUTHORISE
      ↓
AUTOMATE
      ↓
ON-CHAIN SETTLEMENT
```

Every strategy goes through the same engine:

```
SIGNAL → RISK CHECK → SIMULATION → USER/AUTOMATION AUTHORIZATION → EXECUTION
```

Settlement states: **Pending → Confirmed → Finalized** (plus Failed).

## What this repo is

| Layer | Path | Role |
| --- | --- | --- |
| Web | `apps/web` | Next.js 14, dark-first, mobile-first UI |
| API | `apps/api` | Fastify session, portfolio, bots, simulate, authorize |
| Worker | `apps/worker` | Indexer / keeper loop, tx reconciliation |
| Engine | `packages/engine` | Trend, Momentum, DCA, Rebalancing + risk + simulation |
| Execution | `packages/execution` | DEX router, Solana allowlist, optional Kraken connector |
| Shared | `packages/shared` | Assets, types, allowlists, money helpers |
| Contracts | `contracts` | Minimal Solidity: RiskModule → ExecutionRouter → Adapter |
| Infra | `infra`, `docker-compose.yml` | Postgres, Redis, Docker, CI |

Kraken is an **optional execution connector**, not a custody layer. End-user automation uses `wallet → on-chain venue → wallet`. User Kraken API keys are rejected.

## Quick start

```bash
cp .env.example .env
npm install
npm test
```

```bash
npm run dev:api
npm run dev:worker
npm run dev:web
```

Or `docker compose up --build`.

Web: http://localhost:3000  
API: http://localhost:8080/health

## Security model

- Non-custodial: no private-key storage, no server-side signing of user funds
- Allowlisted contracts / programs only
- Spend and slippage caps in the risk engine and on-chain `RiskModule`
- Transaction simulation and fee/slippage disclosure before authorize
- Idempotent `clientOrderId`
- Deadline / expiry on every intent
- Emergency pause (admin) and per-bot pause
- Rate limiting, audit log, session HMAC

Contracts must be independently tested and audited before they handle production value.

## License

MIT
