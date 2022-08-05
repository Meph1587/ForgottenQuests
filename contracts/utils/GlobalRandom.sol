//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.15;

contract GlobalRandom {
    uint256 globalNonce;

    function getRandSeed() public returns (uint256) {
        uint256 bigNr = uint256(
            keccak256(
                abi.encodePacked(
                    blockhash(block.number - 1),
                    tx.origin,
                    globalNonce,
                    block.difficulty
                )
            )
        );
        globalNonce += 1;
        return bigNr;
    }
}
