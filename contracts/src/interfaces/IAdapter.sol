// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
interface IAdapter {
    function swap(address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut, address recipient, bytes calldata data) external payable returns (uint256 amountOut);
}
