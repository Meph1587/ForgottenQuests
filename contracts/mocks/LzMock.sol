// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.15;

contract LzMock {
    bytes public data;

    constructor() {}

    function send(
        uint16,
        bytes calldata,
        bytes calldata _payload,
        address payable, // _refundAddress
        address, // _zroPaymentAddress
        bytes memory
    ) external payable {
        data = _payload;
    }

    function getData() public view returns (bytes memory) {
        return data;
    }

    function execute(address to, bytes memory callData) public {
        (bool success, bytes memory resp) = to.call{value: 0}(callData);
        require(success, string(resp));
    }

    function estimateFees(
        uint16,
        address,
        bytes memory _payload,
        bool,
        bytes memory
    ) external pure returns (uint256 _nativeFee, uint256 _zroFee) {
        _nativeFee = 100 * _payload.length;
        _zroFee = 0;
    }
}
