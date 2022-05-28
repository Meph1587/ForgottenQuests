// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.11;

import {IExecutor} from "@connext/nxtp-contracts/contracts/interfaces/IExecutor.sol";
import {XCallArgs, CallParams} from "@connext/nxtp-contracts/contracts/libraries/LibConnextStorage.sol";

contract ConnextHandlerMock {
    XCallArgs public args;

    address public executor;

    constructor(address _executor) {
        executor = _executor;
    }

    function xcall(XCallArgs memory _args) external payable returns (bytes32) {
        args = _args;
        return bytes32(0);
    }

    function getArgs() public view returns (XCallArgs memory) {
        return args;
    }
}
