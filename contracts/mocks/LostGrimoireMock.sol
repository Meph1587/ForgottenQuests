//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.15;

contract LostGrimoireMock {
    address token;
    uint16 traitId = 0;
    bool hasTrait = true;

    constructor(address _token) {
        token = _token;
    }

    function getRandomToken() public returns (address) {
        return token;
    }

    function getRandomTraitIdForToken(address token) public returns (uint16) {
        traitId++;
        return traitId;
    }

    function getHasTrait(
        address token,
        uint256 tokenId,
        uint16 trait
    ) public view returns (bool) {
        return hasTrait;
    }

    function setHasTrait(bool value) public {
        hasTrait = value;
    }
}
