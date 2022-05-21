//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract L1Token is ERC721Enumerable, Ownable {
    constructor() ERC721("L1Token", "L1") Ownable() {}

    function mint(uint256 tokenId) public {
        _mint(msg.sender, tokenId);
    }
}