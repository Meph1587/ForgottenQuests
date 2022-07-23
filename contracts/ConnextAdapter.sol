// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.15;

import "@openzeppelin/contracts/access/Ownable.sol";
import {IExecutor} from "@connext/nxtp-contracts/contracts/core/connext/interfaces/IExecutor.sol";
import {IConnextHandler} from "@connext/nxtp-contracts/contracts/core/connext/interfaces/IConnextHandler.sol";
import {XCallArgs, CallParams} from "@connext/nxtp-contracts/contracts/core/connext/libraries/LibConnextStorage.sol";
import "hardhat/console.sol";

contract ConnextAdapter is Ownable {
    address private _connext;
    address private _executor;
    address private _transactingAssetId;
    uint32 private _deploymentDomain;

    mapping(uint32 => address) _allowedOrigin;

    event SetConnext(address connextContract);
    event SetAllowedOrigin(uint32 domain, address bridgeContract);
    event TransactingAssetIdSet(address transactingAssetId);

    modifier onlyExecutor() {
        address allowedOrigin = _allowedOrigin[IExecutor(msg.sender).origin()];
        console.log(allowedOrigin);
        require(msg.sender == _executor, "QuantumTunnel: sender invalid");
        require(
            IExecutor(msg.sender).originSender() == allowedOrigin,
            "QuantumTunnel: sender invalid"
        );
        _;
    }

    constructor(
        address connext,
        uint32 deploymentDomain,
        address transactingAssetId
    ) {
        _deploymentDomain = deploymentDomain;
        setTransactingAssetId(transactingAssetId);
        setConnext(connext);
    }

    function setConnext(address connext) public onlyOwner {
        _connext = connext;
        _executor = address(IConnextHandler(_connext).executor());
        emit SetConnext(connext);
    }

    function setAllowedOrigin(uint32 domain, address originContract)
        public
        onlyOwner
    {
        _allowedOrigin[domain] = originContract;
        emit SetAllowedOrigin(domain, originContract);
    }

    function setTransactingAssetId(address transactingAssetId)
        public
        onlyOwner
    {
        _transactingAssetId = transactingAssetId;
        emit TransactingAssetIdSet(transactingAssetId);
    }

    function getConnext() public view returns (address) {
        return _connext;
    }

    function getExecutor() public view returns (address) {
        return _executor;
    }

    function getTransactingAssetId() public view returns (address) {
        return _transactingAssetId;
    }

    function _xcall(
        uint32 destinationDomain,
        bytes memory callData,
        address receiver,
        uint256 callbackFee,
        uint256 relayerFee
    ) internal {
        CallParams memory callParams = CallParams({
            to: receiver,
            callData: callData,
            originDomain: _deploymentDomain,
            destinationDomain: destinationDomain,
            agent: msg.sender,
            recovery: receiver,
            forceSlow: true,
            receiveLocal: false,
            callback: address(this),
            callbackFee: callbackFee,
            relayerFee: relayerFee,
            slippageTol: 9995
        });
        XCallArgs memory xcallArgs = XCallArgs({
            params: callParams,
            transactingAssetId: _transactingAssetId,
            amount: 0
        });
        IConnextHandler(_connext).xcall{value: msg.value}(xcallArgs);
    }
}
