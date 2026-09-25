// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {Ownable} from "./Ownable.sol";
abstract contract Pausable is Ownable {
    bool public paused;
    event PauseSet(bool paused);
    modifier whenNotPaused() { require(!paused, "paused"); _; }
    function setPaused(bool value) external onlyOwner { paused = value; emit PauseSet(value); }
}
