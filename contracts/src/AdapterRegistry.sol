// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {Ownable} from "./utils/Ownable.sol";
contract AdapterRegistry is Ownable {
    mapping(address => bool) public allowed;
    address[] public adapters;
    event AdapterSet(address indexed adapter, bool allowed);
    function setAdapter(address adapter, bool isAllowed) external onlyOwner {
        require(adapter != address(0), "zero adapter");
        if (allowed[adapter] != isAllowed) {
            allowed[adapter] = isAllowed;
            if (isAllowed) {
                bool exists;
                for (uint256 i = 0; i < adapters.length; i++) {
                    if (adapters[i] == adapter) { exists = true; break; }
                }
                if (!exists) adapters.push(adapter);
            }
            emit AdapterSet(adapter, isAllowed);
        }
    }
    function isAllowed(address adapter) external view returns (bool) { return allowed[adapter]; }
}
