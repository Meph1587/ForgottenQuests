//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.15;

import "./BridgeMintableNFT.sol";

contract L1SoulGem is BridgeMintableNFT {
    string public baseURI;

    constructor(string memory _uri) BridgeMintableNFT("SoulGems", "SOULGEMS") {
        baseURI = _uri;
    }

    function setBaseURI(string memory _uri) public onlyOwner {
        baseURI = _uri;
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }
}
