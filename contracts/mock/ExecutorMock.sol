// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.11;

import {IExecutor} from "@connext/nxtp-contracts/contracts/interfaces/IExecutor.sol";
import {XCallArgs, CallParams} from "@connext/nxtp-contracts/contracts/libraries/LibConnextStorage.sol";

import "hardhat/console.sol";

contract ExecutorMock {
    uint32 public origin;
    address public originSender;

    constructor() {}

    function setOrigins(address _originSender, uint32 _origin) public {
        originSender = _originSender;
        origin = _origin;
    }

    function execute(address to, bytes memory callData) public {
        (bool success, bytes memory returnData) = to.call{value: 0}(callData);
        require(success, "failed to execute");
    }
}
