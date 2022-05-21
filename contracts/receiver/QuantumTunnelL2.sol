// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.11;

import {IExecutor} from "@connext/nxtp-contracts/contracts/interfaces/IExecutor.sol";
import {IConnextHandler} from "@connext/nxtp-contracts/contracts/interfaces/IConnextHandler.sol";
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
    mapping(address => address) public l2contracts;
    address unusedAsset;

    // The address of xDomainPermissioned.sol
    address public originContract;

    // The origin Domain ID
    uint32 public originDomain;

    // The address of the Connext Executor contract
    address public executor;

    modifier onlyExecutor() {
        require(
            IExecutor(msg.sender).originSender() == originContract &&
                IExecutor(msg.sender).origin() == originDomain &&
                msg.sender == executor,
            "Expected origin contract on origin domain called by Executor"
        );
        _;
    }

    constructor(uint32 _originDomain, IConnextHandler _connext) Ownable() {
        originDomain = _originDomain;
        connext = _connext;
        executor = connext.getExecutor();
    }

    function addL2Contracts(address l1contract, address l2contract)
        external
        onlyOwner
    {
        l2contracts[l1contract] = l2contract;
    }

    function setOrigin(address _originContract) external onlyOwner {
        originContract = _originContract;
    }

    // Permissioned function
    function withdraw(address tokenAddress, uint256 tokenId) external {
        require(block.timestamp > locks[tokenAddress][tokenId], "still locked");
        require(
            L2Token(l2contracts[tokenAddress]).ownerOf(tokenId) == msg.sender,
            "not owner of token"
        );

        locks[tokenAddress][tokenId] = 0;
        L2Token(l2contracts[tokenAddress]).burn(tokenId);

        bytes memory callData = abi.encodeWithSelector(
            QuantumTunnelL1(originContract).triggeredWithdraw.selector,
            tokenAddress,
            tokenId
        );

        _triggerXCall(originDomain, callData);
    }

    // Permissioned function
    function mintToken(
        address owner,
        address tokenAddress,
        uint256 tokenId,
        uint256 timestamp
    ) external onlyExecutor {
        locks[tokenAddress][tokenId] = timestamp;
        L2Token(l2contracts[tokenAddress]).mint(owner, tokenId);
    }

    function _triggerXCall(uint32 destinationDomain, bytes memory callData)
        internal
    {
        address receiverContract = originContract;
        require(
            receiverContract != address(0),
            "Destination domain not allowed"
        );

        IConnextHandler.CallParams memory callParams = IConnextHandler
            .CallParams({
                to: receiverContract,
                callData: callData,
                originDomain: originDomain,
                destinationDomain: destinationDomain,
                forceSlow: true,
                receiveLocal: false
            });

        IConnextHandler.XCallArgs memory xcallArgs = IConnextHandler.XCallArgs({
            params: callParams,
            transactingAssetId: unusedAsset,
            amount: 0,
            relayerFee: 0
        });

        connext.xcall(xcallArgs);
    }
}
