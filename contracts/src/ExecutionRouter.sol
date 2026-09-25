// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AdapterRegistry} from "./AdapterRegistry.sol";
import {IAdapter} from "./interfaces/IAdapter.sol";
import {RiskModule} from "./RiskModule.sol";
import {Pausable} from "./utils/Pausable.sol";

/// @title ExecutionRouter
/// @notice Minimal non-custodial router: user (or authorized keeper) pulls
///         tokens from the wallet only after risk validation, then calls an
///         allowlisted adapter. The router does not store balances.
contract ExecutionRouter is Pausable {
    RiskModule public immutable risk;
    AdapterRegistry public immutable registry;
    mapping(address => address) public keepers;
    mapping(bytes32 => bool) public usedIntents;

    event KeeperSet(address indexed wallet, address indexed keeper);
    event Executed(
        bytes32 indexed intentId,
        address indexed wallet,
        address adapter,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    error IntentUsed();
    error Deadline();
    error BadKeeper();
    error AdapterDenied();
    error MinOut();

    constructor(RiskModule risk_, AdapterRegistry registry_) {
        risk = risk_;
        registry = registry_;
        risk.setRouter(address(this));
    }

    function setKeeper(address keeper) external {
        keepers[msg.sender] = keeper;
        emit KeeperSet(msg.sender, keeper);
    }

    struct Intent {
        bytes32 intentId;
        address wallet;
        address adapter;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 minAmountOut;
        uint16 slippageBps;
        uint64 deadline;
        bytes adapterData;
    }

    /// @dev Called by the wallet or its keeper. Tokens must already be approved
    ///      to this router with a tight allowance.
    function execute(Intent calldata i) external payable whenNotPaused returns (uint256 amountOut) {
        if (block.timestamp > i.deadline) revert Deadline();
        if (usedIntents[i.intentId]) revert IntentUsed();
        if (msg.sender != i.wallet && msg.sender != keepers[i.wallet]) revert BadKeeper();
        if (!registry.allowed(i.adapter)) revert AdapterDenied();

        usedIntents[i.intentId] = true;
        risk.validate(i.wallet, i.amountIn, i.slippageBps);

        if (i.tokenIn != address(0)) {
            _pull(i.tokenIn, i.wallet, i.amountIn);
            _approve(i.tokenIn, i.adapter, i.amountIn);
        }

        amountOut = IAdapter(i.adapter).swap{value: msg.value}(
            i.tokenIn,
            i.tokenOut,
            i.amountIn,
            i.minAmountOut,
            i.wallet,
            i.adapterData
        );
        if (amountOut < i.minAmountOut) revert MinOut();

        _approve(i.tokenIn, i.adapter, 0);
        emit Executed(i.intentId, i.wallet, i.adapter, i.tokenIn, i.tokenOut, i.amountIn, amountOut);
    }

    function _pull(address token, address from, uint256 amount) internal {
        (bool ok, bytes memory data) = token.call(
            abi.encodeWithSignature("transferFrom(address,address,uint256)", from, address(this), amount)
        );
        require(ok && (data.length == 0 || abi.decode(data, (bool))), "pull");
    }

    function _approve(address token, address spender, uint256 amount) internal {
        if (token == address(0)) return;
        // USDT-style tokens require a zero allowance before a new non-zero value.
        (bool ok0, ) = token.call(abi.encodeWithSignature("approve(address,uint256)", spender, 0));
        require(ok0, "approve0");
        if (amount == 0) return;
        (bool ok, ) = token.call(abi.encodeWithSignature("approve(address,uint256)", spender, amount));
        require(ok, "approve");
    }

    receive() external payable {}
}
