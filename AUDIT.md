# KrakenAlgoBot audit

Date: 2026-09-25
Tests: 20 passed, 0 failed.

## Fixes applied
- Execution allowlist no longer accepts a caller-supplied router.
- RiskModule.validate is OnlyRouter.
- AdapterRegistry does not duplicate entries.
- Simulation ok compares impact vs slippage in bps.

## Do not ship with
- Real user allowances on unaudited contracts
- Default SESSION_SECRET
- Demo portfolio presented as reconciled balances
- NODE_ENV=development in production (SIWE bypass)
