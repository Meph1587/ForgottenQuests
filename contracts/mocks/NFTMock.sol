//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.15;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTMock is ERC721Enumerable, Ownable {
    string baseURI;

    constructor(string memory _uri) ERC721("L1Token", "L1") Ownable() {
        baseURI = _uri;
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function mint(uint256 tokenId) public {
        _mint(msg.sender, tokenId);
    }
}
