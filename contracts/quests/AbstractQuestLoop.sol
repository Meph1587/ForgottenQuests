//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.15;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

import "./JollyTavern.sol";
import "../storage/LostGrimoire.sol";
import "../xchain/RewardsManager.sol";

abstract contract AbstractQuestLoop {
    struct Quest {
        string location;
        uint256 slotsFilled;
        uint256 createdAt;
        uint256 startedAt;
        uint256 endsAt;
        uint256 expiresAt;
        address[] tokenAddresses;
        uint16[] traitIds;
        uint256[] tokenIds;
        bool rewardsMinted;
    }
    Quest[] internal questLog;
    uint256 public lastQuestCreatedAt;

    LostGrimoire public lostGrimoire;
    JollyTavern public tavern;

    bool public isInitialized = false;
    uint256 public questFrequency;
    uint256 public questDuration;
    uint256 public queueDuration;
    uint256 public totalSlots;
    uint256 public minSlotsFilled;

    // creates a new quest by selecting the tokens and attributes
    function createQuest() public virtual;

    // sends token on the quest, last joining token starts quest
    function acceptQuest(
        uint256 questId,
        uint256 tokenId,
        uint256 slotId
    ) public virtual;

    // removes token from quest after completion, first token to leave sets rewards for all
    function completeQuest(
        uint256 questId,
        uint256 tokenId,
        uint256 slotId
    ) public virtual;

    function getNrQuests() public view returns (uint256) {
        return questLog.length;
    }

    function getQuest(uint256 questId) public view returns (Quest memory) {
        return questLog[questId];
    }

    function nextQuestAt() public view returns (uint256) {
        return lastQuestCreatedAt + questFrequency;
    }
}


