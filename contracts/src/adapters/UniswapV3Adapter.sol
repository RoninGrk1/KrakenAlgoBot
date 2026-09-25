// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {IAdapter} from "../interfaces/IAdapter.sol";
import {Ownable} from "../utils/Ownable.sol";
interface ISwapRouter {
    struct ExactInputSingleParams {
        address tokenIn; address tokenOut; uint24 fee; address recipient;
        uint256 deadline; uint256 amountIn; uint256 amountOutMinimum; uint160 sqrtPriceLimitX96;
    }
    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut);
}
contract UniswapV3Adapter is IAdapter, Ownable {
    ISwapRouter public immutable swapRouter;
    address public immutable nativeSentinel;
    constructor(address swapRouter_, address nativeSentinel_) {
        require(swapRouter_ != address(0), "router");
        swapRouter = ISwapRouter(swapRouter_);
        nativeSentinel = nativeSentinel_;
    }
    function swap(address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut, address recipient, bytes calldata data) external payable returns (uint256 amountOut) {
        uint24 fee = data.length >= 3 ? abi.decode(data, (uint24)) : uint24(3000);
        bool nativeIn = tokenIn == address(0) || tokenIn == nativeSentinel;
        amountOut = swapRouter.exactInputSingle{value: nativeIn ? msg.value : 0}(
            ISwapRouter.ExactInputSingleParams({
                tokenIn: nativeIn ? nativeSentinel : tokenIn, tokenOut: tokenOut, fee: fee,
                recipient: recipient, deadline: block.timestamp, amountIn: amountIn,
                amountOutMinimum: minAmountOut, sqrtPriceLimitX96: 0
            })
        );
    }
}
