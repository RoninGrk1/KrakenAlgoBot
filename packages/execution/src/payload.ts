import type { Allowlist, RiskPolicy, TradeIntent } from "@kab/shared";
import {
  buildApproveTx,
  buildEthRouterTx,
  buildSetPolicyTx,
  toBaseUnits,
  type UnsignedEthTx
} from "./ethereum.js";
import { isNativeToken, resolveNetwork, tokenForAsset } from "./networks.js";

export interface ExecutionAddresses {
  router: string;
  adapter: string;
  riskModule: string;
  registry: string;
}

export interface UnsignedPayload {
  deployed: boolean;
  chainId: number;
  network: string;
  steps: UnsignedEthTx[];
  notice: string;
}

export function buildUnsignedPayload(
  intent: TradeIntent,
  policy: RiskPolicy,
  addresses: ExecutionAddresses,
  allowlist: Allowlist,
  activeNetwork: string
): UnsignedPayload {
  const net = resolveNetwork(activeNetwork);
  const deployed = Boolean(addresses.router && addresses.adapter && addresses.riskModule);
  if (!deployed) {
    return {
      deployed: false,
      chainId: net.chainId,
      network: net.name,
      steps: [],
      notice:
        "Contracts are not deployed on this network. Set EXECUTION_ROUTER_ETH, ADAPTER_UNISWAP_V3 and RISK_MODULE after forge script."
    };
  }

  const { tokenIn, tokenInDecimals } = tokenForAsset(intent.asset, intent.side, net);
  const amountIn =
    intent.side === "buy"
      ? toBaseUnits(intent.notionalUsd, tokenInDecimals)
      : toBaseUnits(intent.qty, tokenInDecimals);

  const steps: UnsignedEthTx[] = [];
  steps.push(
    buildSetPolicyTx(
      addresses.riskModule,
      {
        maxSlippageBps: policy.maxSlippageBps,
        maxSpendPerTx: toBaseUnits(policy.maxSpendUsdPerTx, 6),
        maxSpendPerDay: toBaseUnits(policy.maxSpendUsdPerDay, 6)
      },
      net.chainId
    )
  );

  if (!isNativeToken(tokenIn)) {
    steps.push(buildApproveTx(tokenIn, addresses.router, amountIn, net.chainId));
  }

  steps.push(
    buildEthRouterTx(intent, {
      router: addresses.router,
      adapter: addresses.adapter,
      riskModule: addresses.riskModule,
      allowlist,
      network: net,
      valueWei: isNativeToken(tokenIn) ? amountIn : 0n
    })
  );

  return {
    deployed: true,
    chainId: net.chainId,
    network: net.name,
    steps,
    notice:
      "Your wallet signs every step. Approve only the clipped size for this intent. Revoke after you are done."
  };
}
