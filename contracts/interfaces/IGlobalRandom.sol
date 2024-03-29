//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.15;

interface IGlobalRandom {
    function getRandSeed() external returns (uint256);
}
