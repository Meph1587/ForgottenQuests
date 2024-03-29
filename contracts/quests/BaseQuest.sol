//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.15;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

import "./AbstractQuestLoop.sol";

contract BaseQuest is AbstractQuestLoop {

    mapping(address => mapping(uint256 =>  mapping(uint256 => bool))) public hasPurchasedMemory;

    uint256 public memoryPrice = 5 * 10 * 10**14; // 0.005 ETH

    function initialize(
        uint256 _questFrequency,
        uint256 _questDuration,
        uint256 _queueDuration,
        uint256 _totalSlots,
        uint256 _minSlotsFilled,
        LostGrimoire _lostGrimoire,
        JollyTavern _tavern, 
        MemoryToken _memories
    ) public {
        require(questFrequency == 0, "BaseQuest: Already initialized");
        questFrequency = _questFrequency;
        questDuration = _questDuration;
        queueDuration = _queueDuration;
        totalSlots = _totalSlots;
        minSlotsFilled = _minSlotsFilled;
        lostGrimoire = _lostGrimoire;
        tavern = _tavern;
        isInitialized = true;
        memories = _memories;
    }

    // generate a new quest using random affinity
    function createQuest() public override {
        require(
            lastQuestCreatedAt + questFrequency < block.timestamp,
            "BaseQuest: Not enought time passed since last quest"
        );

        address[] memory tokenAddresses = new address[](totalSlots);
        uint16[] memory traitIds = new uint16[](totalSlots);
        uint256[] memory tokenIds = new uint256[](totalSlots);

        for (uint256 i = 0; i < totalSlots; i++) {
            address token = lostGrimoire.getRandomToken();
            uint16 trait = lostGrimoire.getRandomTraitIdForToken(token);
            tokenAddresses[i] = token;
            traitIds[i] = trait;
            tokenIds[i] = type(uint256).max;
        }

        Quest memory quest = Quest({
            promptSeed: lostGrimoire.getRandSeed(),
            slotsFilled: 0,
            createdAt: block.timestamp,
            startedAt: 0,
            endsAt: 0,
            expiresAt: block.timestamp + queueDuration,
            tokenAddresses: tokenAddresses,
            traitIds: traitIds,
            tokenIds: tokenIds,
            rewardsMinted: false
        });
        questLog.push(quest);
        lastQuestCreatedAt = block.timestamp;
    }

    function acceptQuest(
        uint256 questId,
        uint256 tokenId,
        uint256 slotId
    ) public override {
        Quest storage quest = questLog[questId];
        address token = quest.tokenAddresses[slotId];

        require(
            quest.tokenIds[slotId] == type(uint256).max,
            "BaseQuest: slot filled already"
        );
        require(quest.startedAt == 0, "BaseQuest: quest already started");
        require(quest.expiresAt > block.timestamp, "BaseQuest: quest expired");
        require(
            lostGrimoire.getHasTrait(token, tokenId, quest.traitIds[slotId]),
            "BaseQuest: token does not have required trait"
        );
        require(
            ERC721(token).ownerOf(tokenId) == msg.sender,
            "BaseQuest: sender does not own token"
        );
        require(
            !tavern.getIsLocked(token, tokenId),
            "BaseQuest: token already in a quest"
        );

        tavern.lockInQuest(token, tokenId, questId);

        quest.tokenIds[slotId] = tokenId;
        quest.slotsFilled += 1;

        // start quest
        if (quest.slotsFilled == minSlotsFilled) {
            quest.startedAt = block.timestamp;
            quest.expiresAt = 0;
            quest.endsAt = block.timestamp + questDuration;
            memories.mint(address(this), questId, minSlotsFilled);
        }
    }

    function completeQuest(
        uint256 questId,
        uint256 tokenId,
        uint256 slotId
    ) public override {
        Quest storage quest = questLog[questId];
        address token = quest.tokenAddresses[slotId];

        require(
            quest.tokenIds[slotId] == tokenId,
            "BaseQuest: token did not participate in quest"
        );
        require(
            ERC721(token).ownerOf(tokenId) == msg.sender,
            "BaseQuest: sender does not own token"
        );
        // if exiting an expired quest
        if (quest.startedAt == 0 && block.timestamp > quest.expiresAt) {
            tavern.unlockFromQuest(token, tokenId);
            return;
        }

        // if exiting a quest which started
        require(
            quest.endsAt < block.timestamp,
            "BaseQuest: quest not over yet"
        );

        if (!quest.rewardsMinted){
            for(uint256 i = 0; i < totalSlots; i++){
                if(quest.tokenIds[i] != type(uint256).max){
                    tavern.mintReward(address(tavern.soulGems()),  questId, i);
                }
            }
        }
        tavern.claimAllRewards(msg.sender,  questId, slotId);

        tavern.unlockFromQuest(token, tokenId);
    }

    function purchaseQuestMemory(
        uint256 questId,
        uint256 tokenId,
        uint256 slotId
    ) public payable {
        Quest storage quest = questLog[questId];
        address token = quest.tokenAddresses[slotId];

        require(msg.value >= memoryPrice, "BaseQuest: payment too low");
        require(
            quest.tokenIds[slotId] == tokenId,
            "BaseQuest: token did not participate in quest"
        );
        require(
            ERC721(token).ownerOf(tokenId) == msg.sender,
            "BaseQuest: sender does not own token"
        );
        require(
            !hasPurchasedMemory[msg.sender][questId][slotId],
            "BaseQuest: has purchased memory already"
        );

        hasPurchasedMemory[msg.sender][questId][slotId] = true;

        memories.safeTransferFrom(address(this), msg.sender, questId, 1, "");

    }

    function getQuestPrompt(uint256 questId) public view returns(string memory) {

        Quest storage quest = questLog[questId];

        return lostGrimoire.getPrompt(quest.promptSeed);
    }

     function onERC1155Received(
        address ,
        address ,
        uint256 ,
        uint256 ,
        bytes calldata 
    ) external pure returns (bytes4){
        return IERC1155Receiver.onERC1155Received.selector;
    }
}
