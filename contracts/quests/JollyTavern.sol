//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.15;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract JollyTavern {
    struct QuestLoopId {
        address questLoop;
        uint256 questId;
    }
    mapping(address => mapping(uint256 => QuestLoopId)) isInQuest;

    function mintSoulGem(address owner) public {}

    function lockInQuest(
        address token,
        uint256 tokenId,
        uint256 questId
    ) public {
        isInQuest[token][tokenId] = QuestLoopId({
            questLoop: msg.sender,
            questId: questId
        });
    }

    function unlockFromQuest(address token, uint256 tokenId) public {
        isInQuest[token][tokenId] = QuestLoopId({
            questLoop: address(0),
            questId: 0
        });
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
        return (quest.questLoop, quest.questId);
    }
}
