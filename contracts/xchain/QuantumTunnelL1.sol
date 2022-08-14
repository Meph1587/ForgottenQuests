// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.15;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

import {NonblockingLzApp} from "layer-zero/contracts/lzApp/NonblockingLzApp.sol";

import {XChainUtils} from "./XChainUtils.sol";
import {BridgeMintableNFT} from "../tokens/L1/BridgeMintableNFT.sol";

contract QuantumTunnelL1 is Ownable, NonblockingLzApp {
    // addresses of contract on receiver-chains
    mapping(uint16 => address) public receiverContract;

    // addresses of contract that can be tunneled
    mapping(address => bool) public tokenIsEnabled;

    // map numeric ids to reward tokens, making it easy to add/remove/change them
    mapping(uint8 => address) public rewardTokenFromId;

    event SpawnedAltTokenCall(
        address indexed owner,
        address indexed token,
        uint256 tokenId
    );
    event MintedRewards(
        address indexed owner,
        address indexed token,
        uint256 tokenId
    );

    constructor(address _endpoint) Ownable() NonblockingLzApp(_endpoint) {}

    /// @dev initiates a spawn call to mint an Alternate Runiverse Token,
    ///      if the token already exists it force-transfers it to caller.
    ///      msg.value needs to be higher then relayerFee, to cover all costs
    /// @param token The ERC721 Token contract to be used, must be enabled by owner
    /// @param tokenId Token ID to be spawned
    /// @param l2DomainId Domain Id of receiver-chain, see connext docs
    /// @param relayerFee fee paid to router for xCall
    function spawnAltToken(
        ERC721 token,
        uint256 tokenId,
        uint16 l2DomainId,
        uint256 relayerFee
    ) external payable {
        require(
            msg.value >= relayerFee,
            "QTSender: value to low to cover relayer fee"
        );
        require(
            tokenIsEnabled[address(token)],
            "QTSender: token is not enabled"
        );
        require(
            receiverContract[l2DomainId] != address(0),
            "QTSender: no receiver contract set for destination"
        );
        require(
            token.ownerOf(tokenId) == msg.sender,
            "QTSender: token not owned by sender"
        );

        XChainUtils.MintAltToken memory payload = XChainUtils.MintAltToken({
            newOwner: msg.sender,
            originTokenAddress: address(token),
            tokenId: tokenId
        });

        bytes memory encodedPayload = abi.encode(payload);

        XChainUtils.sendPayload(
            lzEndpoint,
            receiverContract[l2DomainId],
            l2DomainId,
            encodedPayload
        );

        emit SpawnedAltTokenCall(msg.sender, address(token), tokenId);
    }

    /// @dev Called through _nonblockingLzReceive from receiver-chain to mint rewards to owner of Alt-Token
    ///      if Alt-Token owner is not original Token owner, first call spawn to force transfer Alt-Token
    function executeXCallMintRewards(
        address receiver,
        address[] memory tokens,
        uint256[][] memory tokenIds
    ) internal {
        for (uint8 i = 0; i < tokens.length; i++) {
            for (uint8 ii = 0; ii < tokenIds[i].length; ii++) {
                BridgeMintableNFT(tokens[i]).mint(receiver, tokenIds[i][ii]);
            }
        }
    }

    /// @dev enables a not token to be spawned
    function enableToken(address _token) external onlyOwner {
        tokenIsEnabled[_token] = true;
    }

    /// @dev enables a not token to be spawned
    function setBridgeMintableNFT(uint8 _rewardsId, address _token)
        external
        onlyOwner
    {
        rewardTokenFromId[_rewardsId] = _token;
    }

    /// @dev sets the receiver contarct on the reciver-chain
    function setDestinationReceiver(uint16 _domainId, address _receiver)
        external
        onlyOwner
    {
        receiverContract[_domainId] = _receiver;
    }

    function _nonblockingLzReceive(
        uint16,
        bytes memory,
        uint64,
        bytes memory _data
    ) internal override {
        XChainUtils.MintRewardsData memory data = abi.decode(
            _data,
            (XChainUtils.MintRewardsData)
        );
        executeXCallMintRewards(data.receiver, data.tokens, data.tokenIds);
    }
}
