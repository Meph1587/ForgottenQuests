// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.11;

import {IExecutor} from "@connext/nxtp-contracts/contracts/interfaces/IExecutor.sol";
import {IConnextHandler} from "@connext/nxtp-contracts/contracts/interfaces/IConnextHandler.sol";
import {XCallArgs, CallParams} from "@connext/nxtp-contracts/contracts/libraries/LibConnextStorage.sol";
import {QuantumTunnelL1} from "../sender/QuantumTunnelL1.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "../tokens/L2Token.sol";

/**
 * @title PermissionedTarget
 * @notice A contrived example target contract.
 */
contract QuantumTunnelL2 is Ownable {
    IConnextHandler public immutable connext;
    mapping(address => mapping(uint256 => uint256)) public locks;
    mapping(address => address) public contractMap;
    address unusedAsset;

    address recovery;
    address callback;

    // The address of xDomainPermissioned.sol
    address public originContract;

    // The origin Domain ID
    uint32 public originDomain;

    modifier onlyExecutor() {
        require(
            IExecutor(msg.sender).originSender() == originContract &&
                IExecutor(msg.sender).origin() == originDomain &&
                msg.sender == address(connext.executor()),
            "Expected origin contract on origin domain called by Executor"
        );
        _;
    }

    constructor(IConnextHandler _connext, uint32 _originDomain) Ownable() {
        originDomain = _originDomain;
        connext = _connext;
        recovery = address(0);
        callback = address(this);
    }

    function withdraw(
        address tokenAddress,
        uint256 tokenId,
        uint256 callbackFee,
        uint256 relayerFee
    ) external {
        require(block.timestamp > locks[tokenAddress][tokenId], "still locked");
        require(
            L2Token(contractMap[tokenAddress]).ownerOf(tokenId) == msg.sender,
            "not owner of token"
        );

        locks[tokenAddress][tokenId] = 0;
        L2Token(contractMap[tokenAddress]).burn(tokenId);

        bytes memory callData = abi.encodeWithSelector(
            QuantumTunnelL1(originContract).executeXCallWithdraw.selector,
            tokenAddress,
            tokenId
        );

        _triggerXCall(originDomain, callData, callbackFee, relayerFee);
    }

    // Permissioned function
    function executeXCallMint(
        address owner,
        address tokenAddress,
        uint256 tokenId,
        uint256 timestamp
    ) external onlyExecutor {
        locks[tokenAddress][tokenId] = timestamp;
        L2Token(contractMap[tokenAddress]).mint(owner, tokenId);
    }

    function mapContract(address l1contract, address l2contract)
        external
        onlyOwner
    {
        contractMap[l1contract] = l2contract;
    }

    function setOrigin(address _originContract) external onlyOwner {
        originContract = _originContract;
    }

    function setRecovery(address _recovery) external onlyOwner {
        recovery = _recovery;
    }

    function setCallback(address _callback) external onlyOwner {
        callback = _callback;
    }

    function _triggerXCall(
        uint32 destinationDomain,
        bytes memory callData,
        uint256 callbackFee,
        uint256 relayerFee
    ) internal {
        address receiverContract = originContract;
        require(
            receiverContract != address(0),
            "Destination domain not allowed"
        );

        CallParams memory callParams = CallParams({
            to: receiverContract,
            callData: callData,
            originDomain: originDomain,
            destinationDomain: destinationDomain,
            recovery: recovery,
            callback: callback,
            callbackFee: callbackFee,
            forceSlow: true,
            receiveLocal: false
        });

        XCallArgs memory xcallArgs = XCallArgs({
            params: callParams,
            transactingAssetId: unusedAsset,
            amount: 0,
            relayerFee: relayerFee
        });

        connext.xcall(xcallArgs);
    }
}
