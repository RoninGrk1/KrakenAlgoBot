// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IAdapter} from "../interfaces/IAdapter.sol";
import {Ownable} from "../utils/Ownable.sol";

/// @dev SwapRouter02 (Sepolia 0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E and mainnet
///      0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45). No deadline field.
interface ISwapRouter02 {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    function exactInputSingle(ExactInputSingleParams calldata params)
        external
        payable
        returns (uint256 amountOut);
}

/// @title UniswapV3Adapter
/// @notice Thin allowlisted adapter. Router address is immutable.
contract UniswapV3Adapter is IAdapter, Ownable {
    ISwapRouter02 public immutable swapRouter;
    address public immutable nativeSentinel;

    constructor(address swapRouter_, address nativeSentinel_) {
        require(swapRouter_ != address(0), "router");
        swapRouter = ISwapRouter02(swapRouter_);
        nativeSentinel = nativeSentinel_;
    }

    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        address recipient,
        bytes calldata data
    ) external payable returns (uint256 amountOut) {
        uint24 fee = data.length >= 32 ? abi.decode(data, (uint24)) : uint24(3000);
        bool nativeIn = tokenIn == address(0) || tokenIn == nativeSentinel;
        address out = tokenOut == address(0) ? nativeSentinel : tokenOut;
        amountOut = swapRouter.exactInputSingle{value: nativeIn ? msg.value : 0}(
            ISwapRouter02.ExactInputSingleParams({
                tokenIn: nativeIn ? nativeSentinel : tokenIn,
                tokenOut: out,
                fee: fee,
                recipient: recipient,
                amountIn: amountIn,
                amountOutMinimum: minAmountOut,
                sqrtPriceLimitX96: 0
            })
        );
    }
}
