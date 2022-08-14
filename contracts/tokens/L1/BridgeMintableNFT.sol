//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.15;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BridgeMintableNFT is ERC721Enumerable, Ownable {
    address public minter;

    modifier onlyMinter() {
        require(msg.sender == minter, "BridgeMintableNFT: not allowed to mint");
        _;
    }

    constructor(string memory _name, string memory _symbol)
        ERC721(_name, _symbol)
        Ownable()
    {}

    function mint(address receiver, uint256 tokenId) public onlyMinter {
        _mint(receiver, tokenId);
    }

    function setMinter(address _minter) public onlyOwner {
        minter = _minter;
    }

    function tokensOfOwner(address _owner)
        external
        view
        returns (uint256[] memory)
    {
        uint256 tokenCount = balanceOf(_owner);
        if (tokenCount == 0) {
            // Return an empty array
            return new uint256[](0);
        } else {
            uint256[] memory result = new uint256[](tokenCount);
            uint256 index;
            for (index = 0; index < tokenCount; index++) {
                result[index] = tokenOfOwnerByIndex(_owner, index);
            }
            return result;
        }
    }
}
