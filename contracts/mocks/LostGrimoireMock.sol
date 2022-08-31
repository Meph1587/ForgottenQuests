//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.15;

contract LostGrimoireMock {
    address token;
    uint16 traitId = 0;
    bool hasTrait = true;

    constructor(address _token) {
        token = _token;
    }

    function getRandomToken() public view returns (address) {
        return token;
    }

    function getRandomTraitIdForToken(address) public returns (uint16) {
        traitId++;
        return traitId;
    }

    function getHasTrait(
        address,
        uint256,
        uint16
    ) public view returns (bool) {
        return hasTrait;
    }

    function getRandomLocation() public pure returns (string memory){
        return "The Fey";
    }

    function setHasTrait(bool value) public {
        hasTrait = value;
    }

    
}
