//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.15;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

import "../storage/LostGrimoire.sol";
import "../xchain/RewardsManager.sol";

abstract contract AbstractQuestLoop {
    struct Quest {
        uint256 randSeed;
        address created_at;
        uint256 started_at;
        uint256 ends_at;
        uint256 expires_at;
        address[] tokenAddresses;
        address[] tokenIds;
    }
    Quest[] private questLog;

    LostGrimoire lostGrimoire;
    RewardsManager rewardsManager;

    bool public isInitialized;
    uint256 questFrequency;
    uint256 questDuration;
    uint256 queueDuration;
    uint256 totalSlots;
    uint256 minSlotsFilled;
}
