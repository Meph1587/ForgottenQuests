//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.15;

import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ForceTransferableERC1155 is ERC1155Supply, Ownable {
    mapping(address => bool) public minters;
    mapping(address => bool) public bridges;

    modifier onlyMinter() {
        require(
            minters[msg.sender],
            "ForceTransferableNFT: not allowed to mint"
        );
        _;
    }

    modifier onlyBridge() {
        require(
            bridges[msg.sender],
            "ForceTransferableNFT: not allowed to force-transfer"
        );
        _;
    }

    constructor(string memory _uri)
        ERC1155(_uri)
        Ownable()
    {
    }

    function mint(address receiver, uint256 tokenId, uint256 amount) public virtual onlyMinter returns(uint256){
        _mint(receiver, tokenId, amount, "");
        return tokenId;
    }

    function forceTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        uint256 amount
    ) public onlyBridge {
        // transfer without checking approval only if called by bridge
        _safeTransferFrom(from, to, tokenId, amount, "");
    }

    function setMinter(address _minter, bool value) public onlyOwner {
        minters[_minter] = value;
    }

    function setBridge(address _bridge, bool value) public onlyOwner {
        bridges[_bridge] = value;
    }

}
