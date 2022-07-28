//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.15;

import "./ForceTransferableNFT.sol";

contract AltWizards is ForceTransferableNFT {
    string public baseURI;

    constructor(string memory _uri)
        ForceTransferableNFT("AlternateRuniverseWizards", "ALT-WIZARD")
    {
        baseURI = _uri;
    }

    function setBaseURI(string memory _uri) public onlyOwner {
        baseURI = _uri;
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }
}
