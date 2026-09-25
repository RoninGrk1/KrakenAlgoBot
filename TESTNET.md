# Sepolia testnet

Do not point a mainnet allowance at these contracts.

```bash
cd contracts
forge install foundry-rs/forge-std --no-commit
# PRIVATE_KEY is the deployer only. It never signs user trades.
forge script script/Deploy.s.sol:Deploy --rpc-url $ETH_TESTNET_RPC_URL --broadcast
```

Copy the printed addresses into `.env`:

```
ACTIVE_NETWORK=testnet
ETH_TESTNET_CHAIN_ID=11155111
EXECUTION_ROUTER_ETH=0x...
ADAPTER_UNISWAP_V3=0x...
ADAPTER_REGISTRY=0x...
RISK_MODULE=0x...
TOKEN_USDC=0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
TOKEN_WETH=0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14
WORKER_TOKEN=dev-worker-token
```

Restart API + worker. Authorise in the setup wizard:

1. Switches the wallet to Sepolia
2. Signs `RiskModule.setPolicy`
3. Signs a tight `approve` (ERC-20 in only)
4. Signs `ExecutionRouter.execute`
5. POSTs the execute hash to `/v1/intents/:id/broadcast`
6. Worker polls `eth_getTransactionReceipt` → Pending → Confirmed → Finalized

Adapter: Uniswap SwapRouter02 on Sepolia `0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E`.
Need Sepolia ETH + test USDC. BTC skipped until `TOKEN_WBTC_TESTNET` is set.

The server never holds keys and never signs user transactions.
