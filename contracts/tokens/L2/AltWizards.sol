//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.15;

import "./ForceTransferableNFT.sol";

contract AltWizards is ForceTransferableNFT {
    string public baseURI;
    address public originContract;
    uint256 public originDomainId;

    constructor(
        string memory _uri,
        address _originContract,
        uint256 _originDomainId
    ) ForceTransferableNFT("AlternateRuniverseWizards", "ALT-WIZARD") {
        baseURI = _uri;
        originContract = _originContract;
        originDomainId = _originDomainId;
    }

    function setBaseURI(string memory _uri) public onlyOwner {
        baseURI = _uri;
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }
}
