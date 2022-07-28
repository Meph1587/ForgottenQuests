//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.15;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

import "../storage/LostGrimoire.sol";
import "../utils/GlobalRandom.sol";

abstract contract AbstractQuest {
    mapping(address => bool) allowedTokens;

    mapping(address => uint256) traitsForToken;
    mapping(address => uint256) affinitiesForToken;

    bool initialized;
    LostGrimoire lostGrimoire;
    GlobalRandom randomness;

    // function getRandomTraitIdForToken(address token, uint256 nonce)
    //     public
    //     view
    //     returns (uint16)
    // {
    //     uint256 bigNr = randomness.getRandSeed();
    //     //overflow can not happen here
    //     uint16 aff = uint16(bigNr % traitsForToken[token]);
    //     return aff;
    // }

    // function getRandomAffinityIdForToken(address token, uint256 nonce)
    //     public
    //     view
    //     returns (uint16)
    // {
    //     uint256 bigNr = randomness.getRandSeed();
    //     //overflow can not happen here
    //     uint16 aff = uint16(bigNr % affinitiesForToken[token]);
    //     return aff;
    // }

    // function getRandomAffinityIdFromTraits(
    //     uint256 nonce,
    //     uint16[5] memory traitIds
    // ) public view returns (uint16) {
    //     uint16[] memory affinities = lostGrimoire.getAllTraitsAffinities(
    //         traitIds
    //     );

    //     //in case [7777, 7777, 7777, 7777, 7777] is provided
    //     if (affinities.length == 0) {
    //         return getRandomAffinity(nonce);
    //     }

    //     uint256 bigNr = randomness.getRandSeed();
    //     //overflow can not happen here
    //     uint16 aff = uint16(bigNr % affinities.length);
    //     return affinities[aff];
    // }

    // function tokenHasOneOfTraits(
    //     address token,
    //     uint256 tokenId,
    //     uint16[] memory traitIds
    // ) public view returns (bool) {
    //     for (uint8 i = 0; i < traitIds.length; i++) {
    //         if (
    //             lostGrimoire.tokenHasTrait(token, tokenId, traitIds[i]) &&
    //             traitIds[i] != 7777
    //         ) {
    //             return true;
    //         }
    //     }
    //     return false;
    // }

    // function tokenHasOneOfAffinities(
    //     address token,
    //     uint256 tokenId,
    //     uint16[] memory affinityIds
    // ) public view returns (bool) {
    //     for (uint8 i = 0; i < affinityIds.length; i++) {
    //         if (
    //             lostGrimoire.tokenHasAffinity(token, tokenId, affinityIds[i]) &&
    //             affinityIds[i] != 7777
    //         ) {
    //             return true;
    //         }
    //     }
    //     return false;
    // }
}
