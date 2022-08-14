//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.15;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/Ownable.sol";

contract LostGrimoireStorage is Ownable {
    mapping(address => bool) allowedWriter;

    modifier onlyWriter() {
        require(
            allowedWriter[msg.sender],
            "LostGrimoireStorage: not allowed to write to storage"
        );
        _;
    }

    constructor() Ownable() {}

    mapping(address => mapping(uint256 => bytes)) tokenTraitMapping;
    mapping(address => mapping(uint256 => string)) tokenNameMapping;

    function storeTokenData(
        address token,
        uint256 tokenId,
        bytes memory traits,
        string memory name
    ) public onlyWriter {
        tokenTraitMapping[token][tokenId] = traits;
        tokenNameMapping[token][tokenId] = name;
    }

    function getTokenTraits(address token, uint256 tokenId)
        public
        view
        returns (bytes memory)
    {
        return tokenTraitMapping[token][tokenId];
    }

    function getTokenName(address token, uint256 tokenId)
        public
        view
        returns (string memory)
    {
        return tokenNameMapping[token][tokenId];
    }

    function hasData(address token, uint256 tokenId)
        public
        view
        returns (bool)
    {
        return bytes(tokenNameMapping[token][tokenId]).length != 0;
    }

    function setAllowedWriter(address writer, bool allowed) public onlyOwner {
        allowedWriter[writer] = allowed;
    }
}
