// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.15;

import "@openzeppelin/contracts/access/Ownable.sol";

import {QuantumTunnelL1} from "./QuantumTunnelL1.sol";
import {RewardsManager} from "./RewardsManager.sol";
import {ConnextAdapter} from "./ConnextAdapter.sol";
import {ForceTransferableNFT} from "../tokens/L2/ForceTransferableNFT.sol";

contract QuantumTunnelL2 is Ownable, ConnextAdapter {
    // domain of sender-chain
    uint32 public originDomain;

    // address of QuantumTunnelL1 on sender-chain
    address public originContract;

    // token address on sender-chain => token address on reciever-chain
    mapping(address => address) public tokenContractMap;

    RewardsManager rewards;

    constructor(
        address _connext,
        uint32 _deploymentDomain,
        uint32 _originDomain,
        address _transactingAssetId
    )
        Ownable()
        ConnextAdapter(_connext, _deploymentDomain, _transactingAssetId)
    {
        originDomain = _originDomain;
    }

    /// @dev Withdraws an ERC721 Token on the sender-chain, burning it on receiver-chain
    /// @param relayerFee fee paid to router for xCall
    /// msg.value needs to be higher then relayerFee, to cover all costs
    function mintRewardsOriginChain(uint256 relayerFee) external payable {
        require(
            msg.value >= relayerFee,
            "QTReceiver: value to low to cover relayer fee"
        );
        require(
            originContract != address(0),
            "QTReceiver: origin contract not set"
        );

        (
            address[] memory l1TokenAdresses,
            uint256[][] memory tokenIds
        ) = rewards.getUnclaimedRewards(msg.sender);

        require(l1TokenAdresses.length != 0, "QTReceiver: no rewards to mint");

        rewards.setAsClaimed(l1TokenAdresses, tokenIds);

        bytes memory callData = abi.encodeWithSelector(
            QuantumTunnelL1(originContract).executeXCallMintRewards.selector,
            msg.sender,
            l1TokenAdresses,
            tokenIds
        );

        _xcall(originDomain, callData, originContract, relayerFee);
    }

    /// @dev Called by executer from sender-chain to mint token to original owner
    function executeXCallMintAltToken(
        address newOwner,
        address originTokenAddress,
        uint256 tokenId
    ) external onlyExecutor {
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
    function setOriginContract(address _originContract) external onlyOwner {
        originContract = _originContract;
        setAllowedOrigin(originDomain, _originContract);
    }

    /// @dev sets the sender contract on the sender-chain
    function setRewardsManager(RewardsManager _rewards) external onlyOwner {
        rewards = _rewards;
    }
}
