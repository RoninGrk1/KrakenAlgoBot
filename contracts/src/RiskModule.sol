// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract RiskModule {
    struct Policy {
        uint16 maxSlippageBps;
        uint256 maxSpendPerTx;
        uint256 maxSpendPerDay;
        uint256 spentToday;
        uint64 dayStart;
        bool enabled;
    }
    mapping(address => Policy) public policies;
    mapping(address => bool) public walletPaused;
    address public router;
    error OnlyRouter();
    uint16 public constant MAX_SLIPPAGE_BPS = 200;
    uint256 public constant DAY = 1 days;
    event PolicySet(address indexed wallet, uint16 maxSlippageBps, uint256 maxSpendPerTx, uint256 maxSpendPerDay);
    event WalletPauseSet(address indexed wallet, bool paused);
    function setPolicy(uint16 maxSlippageBps, uint256 maxSpendPerTx, uint256 maxSpendPerDay) external {
        require(maxSlippageBps > 0 && maxSlippageBps <= MAX_SLIPPAGE_BPS, "slippage");
        require(maxSpendPerTx > 0 && maxSpendPerTx <= maxSpendPerDay, "spend");
        Policy storage p = policies[msg.sender];
        p.maxSlippageBps = maxSlippageBps;
        p.maxSpendPerTx = maxSpendPerTx;
        p.maxSpendPerDay = maxSpendPerDay;
        p.enabled = true;
        emit PolicySet(msg.sender, maxSlippageBps, maxSpendPerTx, maxSpendPerDay);
    }
    function setWalletPaused(bool value) external {
        walletPaused[msg.sender] = value;
        emit WalletPauseSet(msg.sender, value);
    }
    function setRouter(address router_) external {
        require(router == address(0) && router_ != address(0), "router set");
        router = router_;
    }
    function validate(address wallet, uint256 amountIn, uint16 slippageBps) external returns (bool) {
        if (router == address(0) || msg.sender != router) revert OnlyRouter();
        require(!walletPaused[wallet], "wallet paused");
        Policy storage p = policies[wallet];
        require(p.enabled, "no policy");
        require(slippageBps <= p.maxSlippageBps, "slippage exceeded");
        require(amountIn <= p.maxSpendPerTx, "tx spend");
        _rollDay(p);
        require(p.spentToday + amountIn <= p.maxSpendPerDay, "day spend");
        p.spentToday += amountIn;
        return true;
    }
    function _rollDay(Policy storage p) internal {
        if (block.timestamp >= p.dayStart + DAY) {
            p.dayStart = uint64(block.timestamp);
            p.spentToday = 0;
        }
    }
}
