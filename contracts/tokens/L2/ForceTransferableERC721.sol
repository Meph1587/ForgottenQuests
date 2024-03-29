//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.15;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ForceTransferableERC721 is ERC721Enumerable, Ownable {
    mapping(address => bool) public minters;
    mapping(address => bool) public bridges;

    modifier onlyMinter() {
        require(
            minters[msg.sender],
            "ForceTransferableERC721: not allowed to mint"
        );
        _;
    }

    modifier onlyBridge() {
        require(
            bridges[msg.sender],
            "ForceTransferableERC721: not allowed to force-transfer"
        );
        _;
    }

    constructor(string memory _name, string memory _symbol)
        ERC721(_name, _symbol)
        Ownable()
    {
    }

    function mintNext(address receiver) public virtual onlyMinter returns(uint256){
        uint256 nextId = totalSupply();
        _safeMint(receiver, nextId);
        return nextId;
    }

    function mint(address receiver, uint256 tokenId) public virtual onlyMinter returns(uint256){
        _safeMint(receiver, tokenId);
        return tokenId;
    }

    function burn(uint256 tokenId) public onlyMinter {
        _burn(tokenId);
    }

    function forceTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public onlyBridge {
        // transfer without checking approval only if called by bridge
        _safeTransfer(from, to, tokenId, "");
    }

    function setMinter(address _minter, bool value) public onlyOwner {
        minters[_minter] = value;
    }

    function setBridge(address _bridge, bool value) public onlyOwner {
        bridges[_bridge] = value;
    }

    function exists(uint256 tokenId) public view returns (bool) {
        return _exists(tokenId);
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
