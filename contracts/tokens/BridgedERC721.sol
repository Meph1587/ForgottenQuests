//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BridgedERC721 is ERC721Enumerable, Ownable {
    string public baseURI;
    address public minter;
    address public originalContract;
    uint32 public originalDomainId;

    modifier onlyMinter() {
        require(msg.sender == minter, "AlternateWizards: not allowed");
        _;
    }

    constructor(
        string memory _uri,
        address _originalContract,
        uint32 _originalDomainId
    ) ERC721("AlternateRuniverseWizards", "ALT-WIZARD") Ownable() {
        baseURI = _uri;
        originalContract = _originalContract;
        originalDomainId = _originalDomainId;
    }

    function mint(address receiver, uint256 tokenId) public onlyMinter {
        _mint(receiver, tokenId);
    }

    function burn(uint256 tokenId) public onlyMinter {
        _burn(tokenId);
    }

    function setMinter(address _minter) public onlyOwner {
        minter = _minter;
    }

    function setBaseURI(string memory _uri) public onlyOwner {
        baseURI = _uri;
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }
}
