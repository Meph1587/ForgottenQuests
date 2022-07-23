// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.15;

import "@openzeppelin/contracts/access/Ownable.sol";

import {QuantumTunnelSender} from "../sender/QuantumTunnelSender.sol";
import {BridgedERC721} from "../tokens/BridgedERC721.sol";

import "../ConnextAdapter.sol";

/**
 * @title PermissionedTarget
 * @notice A contrived example target contract.
 */
contract QuantumTunnelReceiver is Ownable, ConnextAdapter {
    // domain of sender-chain
    uint32 public originDomain;

    // address of QuantumTunnelSender on sender-chain
    address public originContract;

    // token address on sender-chain => token address on reciever-chain
    mapping(address => address) public tokenContractMap;
    mapping(address => mapping(uint256 => uint256)) public lockedUntill;

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
    /// @param originTokenAddress The ERC721 Token address on the sender-chain
    /// @param tokenId Token ID to be withdrawn
    /// @param relayerFee fee paid to router for xCall
    /// @param callbackFee fee paid to router for callback transaction
    /// msg.value needs to be higher then relayerFee + callbackFee, to cover all costs
    function withdraw(
        address originTokenAddress,
        uint256 tokenId,
        uint256 relayerFee,
        uint256 callbackFee
    ) external payable {
        require(
            msg.value >= relayerFee + callbackFee,
            "QTReceiver: value to low to cover relayer and callback fee"
        );
        require(
            block.timestamp > lockedUntill[originTokenAddress][tokenId],
            "QTReceiver: token is still locked"
        );
        require(
            BridgedERC721(tokenContractMap[originTokenAddress]).ownerOf(
                tokenId
            ) == msg.sender,
            "QTReceiver: not called by the owner of the token"
        );

        require(
            originContract != address(0),
            "QTReceiver: origin contract not set"
        );

        lockedUntill[originTokenAddress][tokenId] = 0;
        BridgedERC721(tokenContractMap[originTokenAddress]).burn(tokenId);

        bytes memory callData = abi.encodeWithSelector(
            QuantumTunnelSender(originContract).executeXCallWithdraw.selector,
            originTokenAddress,
            tokenId
        );

        _xcall(originDomain, callData, originContract, callbackFee, relayerFee);
    }

    /// @dev Called by executer from sender-chain to mint token to original owner
    function executeXCallMint(
        address owner,
        address originTokenAddress,
        uint256 tokenId,
        uint256 timestamp
    ) external onlyExecutor {
        lockedUntill[originTokenAddress][tokenId] = timestamp;
        BridgedERC721(tokenContractMap[originTokenAddress]).mint(
            owner,
            tokenId
        );
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
}
