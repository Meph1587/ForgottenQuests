//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.15;

import "./ForceTransferableERC1155.sol";

contract MemoryToken is ForceTransferableERC1155 {
    string public baseURI;
    address public originContract;
    uint256 public originDomainId;

    constructor(
        string memory _uri
    ) ForceTransferableERC1155(_uri) {
    }

    function setBaseURI(string memory _uri) public onlyOwner {
        _setURI(_uri);
    }
}
