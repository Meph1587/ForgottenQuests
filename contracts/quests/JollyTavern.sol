//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.15;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../tokens/L2/ForceTransferableNFT.sol";

contract JollyTavern is Ownable {
    mapping(address => bool) isQuestLoop;
    mapping(address => mapping(uint256=>mapping(uint256 => uint256))) rewardsForQuest;

    address[] rewardTokens;

    ForceTransferableNFT public soulGems;

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

    constructor(ForceTransferableNFT _soulGems) {
        soulGems = _soulGems;
        rewardTokens.push(address(soulGems));
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

     function mintReward(address reward, uint256 questId, uint256 slotId) public onlyQuestLoop {
        uint256 tokenId = ForceTransferableNFT(reward).mintNext(address(this));
        rewardsForQuest[reward][questId][slotId] = tokenId;
    }

     function claimAllRewards(address owner, uint256 questId, uint256 slotId)
        public
        onlyQuestLoop
    {
        for(uint256 i = 0; i< rewardTokens.length; i++){
            uint256 tokenId = rewardsForQuest[rewardTokens[i]][questId][slotId];
            if (tokenId != 0) {
                ERC721(rewardTokens[i]).safeTransferFrom(address(this), owner, tokenId);
            }
        }
    }

    function setQuestLoop(address loop, bool value) public onlyOwner {
        isQuestLoop[loop] = value;
    }

    function addRewardsToken(address token) public onlyOwner {
        rewardTokens.push(token);
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
