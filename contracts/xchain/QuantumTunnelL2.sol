// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.15;

import "@openzeppelin/contracts/access/Ownable.sol";

import {NonblockingLzApp} from "layer-zero/contracts/lzApp/NonblockingLzApp.sol";

import {XChainUtils} from "./XChainUtils.sol";
import {RewardsManager} from "./RewardsManager.sol";
import {ForceTransferableNFT} from "../tokens/L2/ForceTransferableNFT.sol";

contract QuantumTunnelL2 is Ownable, NonblockingLzApp {
    // domain of sender-chain
    uint16 public l1DomainId;

    // address of QuantumTunnelL1 on sender-chain
    address public l1QuantumTunnel;

    // token address on sender-chain => token address on reciever-chain
    mapping(address => address) public tokenContractMap;

    RewardsManager rewards;

    constructor(address _endpoint, uint16 _l1DomainId)
        Ownable()
        NonblockingLzApp(_endpoint)
    {
        l1DomainId = _l1DomainId;
    }

    /// @dev Withdraws an ERC721 Token on the sender-chain, burning it on receiver-chain
    /// msg.value needs to be higher then relayerFee, to cover all costs
    function mintRewardsOriginChain() external payable {
        require(l1QuantumTunnel != address(0), "QTL2: origin contract not set");

        (
            address[] memory l1TokenAdresses,
            uint256[][] memory tokenIds
        ) = rewards.getUnclaimedRewards(msg.sender);

        require(l1TokenAdresses.length != 0, "QTL2: no rewards to mint");

        rewards.setAsClaimed(l1TokenAdresses, tokenIds);

        XChainUtils.MintRewardsData memory payload = XChainUtils
            .MintRewardsData({
                receiver: msg.sender,
                tokens: l1TokenAdresses,
                tokenIds: tokenIds
            });

        bytes memory encodedPayload = abi.encode(payload);

        XChainUtils._sendPayload(
            lzEndpoint,
            l1QuantumTunnel,
            l1DomainId,
            encodedPayload
        );
    }

    function estimateMessageFee(address user)
        public
        view
        returns (uint256 fee)
    {
        (
            address[] memory l1TokenAdresses,
            uint256[][] memory tokenIds
        ) = rewards.getUnclaimedRewards(user);

        XChainUtils.MintRewardsData memory payload = XChainUtils
            .MintRewardsData({
                receiver: user,
                tokens: l1TokenAdresses,
                tokenIds: tokenIds
            });

        bytes memory encodedPayload = abi.encode(payload);

        fee = XChainUtils._estimateMessageFee(
            lzEndpoint,
            l1DomainId,
            encodedPayload
        );
    }

    /// @dev Called through _nonblockingLzReceive from sender-chain to mint token to original owner
    function executeXCallMintAltToken(
        address newOwner,
        address originTokenAddress,
        uint256 tokenId
    ) internal {
        ForceTransferableNFT token = ForceTransferableNFT(
            tokenContractMap[originTokenAddress]
        );
        // check if the token exists
        if (token.exists(tokenId)) {
            token.forceTransferFrom(token.ownerOf(tokenId), newOwner, tokenId);
        } else {
            // else mint the token to owner
            token.mint(newOwner, tokenId);
        }
    }

    /// @dev maps the sender-chain token to the receiver-chain token
    function mapContract(address l1contract, address l2contract)
        external
        onlyOwner
    {
        tokenContractMap[l1contract] = l2contract;
    }

    /// @dev sets the sender contract on the sender-chain
    function setL1QuantumTunnel(address _l1QuantumTunnel) external onlyOwner {
        l1QuantumTunnel = _l1QuantumTunnel;
    }

    /// @dev sets the sender contract on the sender-chain
    function setRewardsManager(RewardsManager _rewards) external onlyOwner {
        rewards = _rewards;
    }

    function _nonblockingLzReceive(
        uint16,
        bytes memory,
        uint64,
        bytes memory _data
    ) internal override {
        XChainUtils.MintAltToken memory data = abi.decode(
            _data,
            (XChainUtils.MintAltToken)
        );
        executeXCallMintAltToken(
            data.newOwner,
            data.originTokenAddress,
            data.tokenId
        );
    }
}
