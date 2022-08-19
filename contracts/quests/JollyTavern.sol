//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.15;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../tokens/L2/L2SoulGems.sol";

contract JollyTavern is Ownable {
    mapping(address => bool) isQuestLoop;

    address[] rewardTokens;

    SoulGems soulGems;

    modifier onlyQuestLoop() {
        require(
            isQuestLoop[msg.sender],
            "JollyTavern: can only be called by quest Loop"
        );
        _;
    }

    struct QuestLoopId {
        address questLoop;
        uint256 questId;
    }
    mapping(address => mapping(uint256 => QuestLoopId)) isInQuest;

    constructor(SoulGems _soulGems) {
        soulGems = _soulGems;
    }

    function mintSoulGem(address owner) public onlyQuestLoop {
        soulGems.mintNextWithRoll(owner);
    }

    function lockInQuest(
        address token,
        uint256 tokenId,
        uint256 questId
    ) public onlyQuestLoop {
        isInQuest[token][tokenId] = QuestLoopId({
            questLoop: msg.sender,
            questId: questId
        });
    }

    function unlockFromQuest(address token, uint256 tokenId)
        public
        onlyQuestLoop
    {
        isInQuest[token][tokenId] = QuestLoopId({
            questLoop: address(0),
            questId: type(uint256).max
        });
    }

    function setQuestLoop(address loop, bool value) public onlyOwner {
        isQuestLoop[loop] = value;
    }

    function getIsLocked(address token, uint256 tokenId)
        public
        view
        returns (bool)
    {
        QuestLoopId memory quest = isInQuest[token][tokenId];
        return quest.questLoop != address(0);
    }

    function getQuest(address token, uint256 tokenId)
        public
        view
        returns (address, uint256)
    {
        QuestLoopId memory quest = isInQuest[token][tokenId];
        uint256 questId = type(uint256).max;
        if (quest.questLoop != address(0)) {
            questId = quest.questId;
        }
        //returns (address(0), uint256.max) if not in quest
        return (quest.questLoop, quest.questId);
    }
}
