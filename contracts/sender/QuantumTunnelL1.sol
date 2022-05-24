// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IExecutor} from "@connext/nxtp-contracts/contracts/interfaces/IExecutor.sol";
import {IConnextHandler} from "@connext/nxtp-contracts/contracts/interfaces/IConnextHandler.sol";
import {QuantumTunnelL2} from "../receiver/QuantumTunnelL2.sol";
import {XCallArgs, CallParams} from "@connext/nxtp-contracts/contracts/libraries/LibConnextStorage.sol";

import "hardhat/console.sol";

contract QuantumTunnelL1 is Ownable {
    IConnextHandler public immutable connext;
    uint32 deploymentDomain;
    address unusedAsset;
    bool emergencyWithdrawEnabled;
    uint256 lastWithdraw;
    address recovery;
    address callback;
    mapping(uint32 => address) public receiverOnL2;
    mapping(address => bool) public tokenIsEnabled;
    mapping(address => mapping(uint256 => address)) public originalTokenOwner;
    mapping(address => mapping(uint256 => uint32)) public tokenTunneledTo;
    mapping(address => mapping(uint256 => uint256)) public lockExpires;
    mapping(uint32 => address) public originContract;

    uint256 WEEK = 1 weeks;
    uint256 MIN_WEEKS = 0;

    event Deposited(address, address, uint256, uint256);
    event Withdrawn(address, address, uint256);
    event Renewed(address, address, uint256, uint256);

    modifier onlyExecutor() {
        uint32 originDomain = IExecutor(msg.sender).origin();
        require(
            IExecutor(msg.sender).originSender() ==
                originContract[originDomain] &&
                msg.sender == address(connext.executor()),
            "Expected origin contract on origin domain called by Executor"
        );
        _;
    }

    constructor(
        IConnextHandler _connext,
        uint32 _deploymentDomain,
        address _unusedAsset
    ) Ownable() {
        connext = _connext;
        deploymentDomain = _deploymentDomain;
        unusedAsset = _unusedAsset;
        recovery = address(0);
        callback = address(this);
    }

    function deposit(
        ERC721 token,
        uint256 tokenId,
        uint32 destinationDomain,
        uint32 nrWeeksLocked,
        uint256 callbackFee,
        uint256 relayerFee
    ) external {
        require(
            tokenIsEnabled[address(token)],
            "This Token can not be tunneled"
        );
        require(
            token.ownerOf(tokenId) == msg.sender,
            "Sender does not own this token"
        );
        require(nrWeeksLocked >= MIN_WEEKS, "Lock length to short");
        require(
            tokenTunneledTo[address(token)][tokenId] == 0,
            "Token already Tunneled somewhere"
        );

        token.transferFrom(msg.sender, address(this), tokenId);

        uint256 lockExpiresAt = block.timestamp + (nrWeeksLocked * WEEK);

        // set params - maybe move to a struct
        lockExpires[address(token)][tokenId] = lockExpiresAt;
        originalTokenOwner[address(token)][tokenId] = msg.sender;
        tokenTunneledTo[address(token)][tokenId] = destinationDomain;

        bytes memory callData = abi.encodeWithSelector(
            QuantumTunnelL2(receiverOnL2[destinationDomain])
                .executeXCallMint
                .selector,
            msg.sender,
            address(token),
            tokenId,
            lockExpiresAt
        );

        _triggerXCall(destinationDomain, callData, callbackFee, relayerFee);

        emit Deposited(msg.sender, address(token), tokenId, lockExpiresAt);
    }

    function executeXCallWithdraw(address token, uint256 tokenId)
        external
        onlyExecutor
    {
        //withdraw
        ERC721(token).safeTransferFrom(
            address(this),
            originalTokenOwner[token][tokenId],
            tokenId
        );

        //reset params
        lockExpires[token][tokenId] = 0;
        originalTokenOwner[token][tokenId] = address(0);
        tokenTunneledTo[token][tokenId] = 0;

        lastWithdraw = block.timestamp;

        emit Withdrawn(msg.sender, address(token), tokenId);
    }

    function emergencyWithdraw(ERC721 token, uint256 tokenId) external {
        require(
            emergencyWithdrawEnabled ||
                (lastWithdraw + 8 weeks < block.timestamp),
            "Emergency withdraw not active"
        );
        require(
            msg.sender == originalTokenOwner[address(token)][tokenId],
            "Not the owner of this token"
        );

        //withdraw
        token.transferFrom(
            address(this),
            originalTokenOwner[address(token)][tokenId],
            tokenId
        );
    }

    // allows a new ERC721 token to be tunnled
    function enableEmergencyWithdraw() external onlyOwner {
        emergencyWithdrawEnabled = true;
    }

    // allows a new ERC721 token to be tunnled
    function enableToken(address _token) external onlyOwner {
        tokenIsEnabled[_token] = true;
    }

    // allows a new ERC721 token to be tunnled
    function setOriginContract(uint32 _domainId, address _originContract)
        external
        onlyOwner
    {
        originContract[_domainId] = _originContract;
    }

    // allows a new domain to be reached by setting the receiver contract
    function setDestinationReceiver(uint32 _domainId, address _receiver)
        external
        onlyOwner
    {
        receiverOnL2[_domainId] = _receiver;
    }

    function _triggerXCall(
        uint32 destinationDomain,
        bytes memory callData,
        uint256 callbackFee,
        uint256 relayerFee
    ) internal {
        address receiverContract = receiverOnL2[destinationDomain];
        require(
            receiverContract != address(0),
            "Destination domain not allowed"
        );

        CallParams memory callParams = CallParams({
            to: receiverContract,
            callData: callData,
            originDomain: deploymentDomain,
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

    event TransferInitiated(
        address asset,
        uint256 newValue,
        address onBehalfOf
    );
}
