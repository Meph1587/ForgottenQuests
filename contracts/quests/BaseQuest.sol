//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.15;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./AbstractQuestLoop.sol";

contract BaseQuest is AbstractQuestLoop {
    address public feeAddress;

    uint256 public nextQuestAvailableAt;

    // function initialize(
    //     address _questTools,
    //     address _feeAddress,
    //     address _questAchievements
    // ) public {
    //     require(nextQuestAvailableAt == 0, "Already Initialized");
    //     feeAddress = _feeAddress;
    //     nextQuestAvailableAt = block.timestamp;
    // }

    // // generate a new quest using random affinity
    // function newQuest() public {
    //     require(
    //         nextQuestAvailableAt < block.timestamp,
    //         "Quest Cooldown not elapsed"
    //     );
    //     uint256 nonce = questLog.length.mul(4);
    //     uint16[2] memory pos_aff = [
    //         qt.getRandomAffinity(nonce),
    //         qt.getRandomAffinity(nonce.add(1))
    //     ];

    //     uint16[2] memory neg_aff = [
    //         qt.getRandomAffinity(nonce.add(2)),
    //         qt.getRandomAffinity(nonce.add(3))
    //     ];
    //     Quest memory quest = Quest({
    //         randSeed: uint256(
    //             keccak256(
    //                 abi.encodePacked(
    //                     questLog.length,
    //                     msg.sender,
    //                     block.difficulty
    //                 )
    //             )
    //         ),
    //         accepted_by: address(0),
    //         accepted_at: block.timestamp,
    //         wizardId: 10000,
    //         positive_affinities: pos_aff,
    //         negative_affinities: neg_aff,
    //         ends_at: 0,
    //         expires_at: block.timestamp + qt.BASE_EXPIRATION()
    //     });
    //     questLog.push(quest);
    //     nextQuestAvailableAt = block.timestamp.add(qt.COOLDOWN());
    // }

    // function acceptQuest(uint256 id, uint256 wizardId) public {
    //     Quest storage quest = questLog[id];

    //     qt.getWizards().transferFrom(msg.sender, address(this), wizardId);

    //     require(quest.accepted_by == address(0), "Quest accepted already");
    //     require(quest.expires_at > block.timestamp, "Quest expired");
    //     quest.accepted_by = msg.sender;
    //     quest.accepted_at = block.timestamp;
    //     quest.wizardId = wizardId;

    //     // reverts if wizard is not verified
    //     uint256 duration = qt.getQuestDuration(
    //         wizardId,
    //         quest.positive_affinities,
    //         quest.negative_affinities
    //     );
    //     quest.ends_at = block.timestamp.add(duration);
    // }

    // // allow to withdraw wizard after quest duration elapsed
    // function completeQuest(uint256 id) public {
    //     Quest storage quest = questLog[id];
    //     require(
    //         quest.accepted_by == msg.sender,
    //         "Only wizard owner can complete"
    //     );
    //     require(quest.ends_at < block.timestamp, "Quest not ended yet");
    //     qt.getWizards().approve(msg.sender, quest.wizardId);
    //     qt.getWizards().transferFrom(address(this), msg.sender, quest.wizardId);

    //     //mint reward NFT to user
    //     uint256 duration = quest.ends_at - quest.accepted_at;

    //     uint256 score = qt.getQuestScore(
    //         quest.positive_affinities,
    //         quest.negative_affinities
    //     );

    //     questAchievements.mint(
    //         msg.sender,
    //         quest.randSeed,
    //         qt.getGrimoire().getWizardName(quest.wizardId),
    //         score,
    //         duration,
    //         false
    //     );
    // }

    // function abandonQuest(uint256 id) public {
    //     Quest storage quest = questLog[id];
    //     require(
    //         quest.accepted_by == msg.sender,
    //         "Only wizard owner can abandon"
    //     );
    //     require(quest.ends_at > block.timestamp, "Quest ended");

    //     // pay penalty fee based o how early it is abondoned
    //     uint256 feeAmount = qt
    //         .BASE_FEE()
    //         .mul(block.timestamp.sub(quest.accepted_at))
    //         .div(quest.ends_at.sub(quest.accepted_at));

    //     qt.getWeth().transferFrom(msg.sender, feeAddress, feeAmount);
    //     qt.getWizards().approve(msg.sender, quest.wizardId);
    //     qt.getWizards().transferFrom(address(this), msg.sender, quest.wizardId);
    // }
}
