//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "../QuestAchievements.sol";
import "../QuestTools.sol";

contract LoreQuest {
    using SafeMath for uint16;
    using SafeMath for uint256;

    address public rewardNFT;

    address public feeAddress;

    uint256 public nextQuestAvailableAt;

    struct Quest {
        address accepted_by;
        uint256 accepted_at;
        uint256 wizardId;
        uint16[2] positive_affinities;
        uint16[2] negative_affinities;
        string name;
        uint256 ends_at;
        uint256 expires_at;
        address rewardNFT;
        uint256 nftId;
        uint256 entryFee;
        address creator;
        uint16[5] traits;
    }
    Quest[] private questLog;

    QuestAchievements public questAchievements;

    QuestTools private qt;

    mapping(address => bool) public canMakeQuest;
    address public questMaster;

    function initialize(
        address _questTools,
        address _feeAddress,
        address _questAchievements
    ) public {
        require(nextQuestAvailableAt == 0, "Already Initialized");
        feeAddress = _feeAddress;
        questAchievements = QuestAchievements(_questAchievements);
        nextQuestAvailableAt = block.timestamp;
        questMaster = msg.sender;
        canMakeQuest[msg.sender] = true;
        qt = QuestTools(_questTools);
    }

    function setCanMakeQuest(address addr, bool newValue) public {
        require(msg.sender == questMaster, "Only quest master can edit this");
        canMakeQuest[addr] = newValue;
    }

    function setQuestMaster(address addr) public {
        require(msg.sender == questMaster, "Only quest master can edit this");
        questMaster = addr;
    }

    // generate a new quest using random affinity
    function newQuest(
        string calldata _name,
        address _rewardNFT,
        uint256 _nftId,
        uint256 _entryFee,
        uint16[5] calldata requiredTraits
    ) public {
        require(canMakeQuest[msg.sender], "Not allowed to make  quests");
        require(
            nextQuestAvailableAt < block.timestamp,
            "Quest Cooldown not elapsed"
        );

        uint256 nonce = questLog.length.mul(4);
        uint16[2] memory pos_aff = [
            qt.getRandomAffinityFromTraits(nonce, requiredTraits),
            qt.getRandomAffinity(nonce.add(1))
        ];

        uint16[2] memory neg_aff = [
            qt.getRandomAffinity(nonce.add(2)),
            qt.getRandomAffinity(nonce.add(3))
        ];
        Quest memory quest = Quest({
            accepted_by: address(0),
            accepted_at: block.timestamp,
            wizardId: 10000,
            positive_affinities: pos_aff,
            negative_affinities: neg_aff,
            name: _name,
            ends_at: 0,
            expires_at: block.timestamp + qt.BASE_EXPIRATION(),
            rewardNFT: _rewardNFT,
            nftId: _nftId,
            entryFee: _entryFee,
            creator: msg.sender,
            traits: requiredTraits
        });
        questLog.push(quest);
        ERC721(_rewardNFT).transferFrom(msg.sender, address(this), _nftId);
        nextQuestAvailableAt = block.timestamp.add(259200); /// 3 days;
    }

    function acceptQuest(uint256 id, uint256 wizardId) public {
        Quest storage quest = questLog[id];

        if (quest.entryFee != 0) {
            qt.getWeth().transferFrom(
                msg.sender,
                quest.creator,
                quest.entryFee
            );
        }

        require(
            qt.wizardHasOneOfTraits(wizardId, quest.traits),
            "Wizard does not have trait"
        );

        qt.getWizards().transferFrom(msg.sender, address(this), wizardId);

        require(quest.accepted_by == address(0), "Quest accepted already");
        require(quest.expires_at > block.timestamp, "Quest expired");
        quest.accepted_by = msg.sender;
        quest.accepted_at = block.timestamp;
        quest.wizardId = wizardId;

        // reverts if wizard is not verified
        uint256 duration = qt.getQuestDuration(
            wizardId,
            quest.positive_affinities,
            quest.negative_affinities
        );
        quest.ends_at = block.timestamp.add(duration);
    }

    // allow to withdraw wizard after quest duration elapsed
    function completeQuest(uint256 id) public {
        Quest storage quest = questLog[id];

        require(
            quest.accepted_by == msg.sender,
            "Only wizard owner can complete"
        );
        require(quest.ends_at < block.timestamp, "Quest not ended yet");
        qt.getWizards().approve(msg.sender, quest.wizardId);
        qt.getWizards().transferFrom(address(this), msg.sender, quest.wizardId);

        ERC721(quest.rewardNFT).approve(msg.sender, quest.nftId);
        ERC721(quest.rewardNFT).transferFrom(
            address(this),
            msg.sender,
            quest.nftId
        );

        //mint reward NFT to user
        uint256 duration = quest.ends_at - quest.accepted_at;

        uint256 score = qt.getQuestScore(
            quest.positive_affinities,
            quest.negative_affinities
        );

        questAchievements.mint(
            msg.sender,
            quest.wizardId,
            qt.getGrimoire().getWizardName(quest.wizardId),
            score,
            duration,
            true
        );
    }

    function abandonQuest(uint256 id) public {
        Quest storage quest = questLog[id];

        require(
            quest.accepted_by == msg.sender,
            "Only wizard owner can abandon"
        );
        require(quest.ends_at > block.timestamp, "Quest ended");

        // pay penalty fee based o how early it is abondoned
        uint256 feeAmount = qt
            .BASE_FEE()
            .mul(block.timestamp - quest.accepted_at)
            .div(quest.ends_at - quest.accepted_at);

        qt.getWeth().transferFrom(msg.sender, feeAddress, feeAmount);

        qt.getWizards().approve(msg.sender, quest.wizardId);
        qt.getWizards().transferFrom(address(this), msg.sender, quest.wizardId);
    }

    function getQuest(uint256 id) public view returns (Quest memory) {
        return questLog[id];
    }

    function getNrOfQuests() public view returns (uint256) {
        return questLog.length;
    }
}
