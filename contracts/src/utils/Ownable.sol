// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
abstract contract Ownable {
    address public owner;
    event OwnershipTransferred(address indexed previous, address indexed next);
    constructor() { owner = msg.sender; emit OwnershipTransferred(address(0), msg.sender); }
    modifier onlyOwner() { require(msg.sender == owner, "not owner"); _; }
    function transferOwnership(address next) external onlyOwner {
        require(next != address(0), "zero owner");
        emit OwnershipTransferred(owner, next);
        owner = next;
    }
}
