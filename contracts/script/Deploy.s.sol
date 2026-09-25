// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {RiskModule} from "../src/RiskModule.sol";
import {AdapterRegistry} from "../src/AdapterRegistry.sol";
import {ExecutionRouter} from "../src/ExecutionRouter.sol";
import {UniswapV3Adapter} from "../src/adapters/UniswapV3Adapter.sol";

/// @notice Testnet deploy. Do not point mainnet allowances at the result
///         until an external audit. Usage:
///         forge script script/Deploy.s.sol:Deploy --rpc-url $ETH_TESTNET_RPC_URL --broadcast
contract Deploy is Script {
    // Uniswap SwapRouter02 + WETH9 on Ethereum Sepolia
    address constant SEPOLIA_SWAP_ROUTER_02 = 0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E;
    address constant SEPOLIA_WETH = 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14;

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address swapRouter = vm.envOr("UNISWAP_SWAP_ROUTER", SEPOLIA_SWAP_ROUTER_02);
        address weth = vm.envOr("TOKEN_WETH", SEPOLIA_WETH);

        vm.startBroadcast(pk);

        RiskModule risk = new RiskModule();
        AdapterRegistry registry = new AdapterRegistry();
        ExecutionRouter router = new ExecutionRouter(risk, registry);
        UniswapV3Adapter adapter = new UniswapV3Adapter(swapRouter, weth);
        registry.setAdapter(address(adapter), true);

        vm.stopBroadcast();

        console2.log("RISK_MODULE", address(risk));
        console2.log("ADAPTER_REGISTRY", address(registry));
        console2.log("EXECUTION_ROUTER_ETH", address(router));
        console2.log("ADAPTER_UNISWAP_V3", address(adapter));
        console2.log("UNISWAP_SWAP_ROUTER", swapRouter);
        console2.log("TOKEN_WETH", weth);
    }
}
