// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.11;


import "@rari-capital/solmate/src/auth/Auth.sol";
import "@rari-capital/solmate/src/token/ERC721.sol"l
import {IConnextHandler} from "@connext/nxtp-contracts/contracts/interfaces/IConnextHandler.sol";

/**
 * @title XDomainPermissioned
 * @notice Example of a cross-domain permissioned call.
 */
contract QuantumTunnelL1 is Auth{
    IConnextHandler public immutable connext;
    uint32 originDomain;
    address unusedAsset;
    mapping(uint32 => address) receiverOnL2;
    mapping(address => bool) tokenIsEnabled;
    mapping(address => mapping(uint256 => address)) originalTokenOwner;
    mapping(address => mapping(uint256 => uint32)) tokenTunneledTo;
    mapping(address => mapping(uint256 => uint256)) amountStakedPerToken;
    mapping(address => mapping(uint256 => uint256)) lockExpires;
    mapping(address => mapping(uint256 => uint256)) lockDuration;
    mapping(address => uint256) ethPerWeek;

    uint256 WEEK = 1 weeks;
    uint256 GRACE_PERIOD = 1 weeks;
    uint256 MIN_WEEKS = 2;


    constructor(
        IConnextHandler _connext,
        uint32 _originDomain,
        address unusedAsset
    ) {
        connext = _connext;
        originDomain = _originDomain;
        unusedAsset = _unusedAsset;
        super(msg.sender, address(0));
    }


    // receives stake from owner and mint token on L2
    function createTokenOnL2(
        ERC721 token,
        uint256 tokenId,
        uint32 destinationDomain,
        uint32 nrWeeksLocked
    ) external payable {
        
        require(tokenIsEnabled[address(token)], "This Token can not be transfered");
        require(token.ownerOf(tokenId) == msg.sender, "Sender does not own this token")
        require(nrWeeksLocked >= MIN_WEEKS, "Lock length to short");
        require(msg.value >= nrWeeksLocked * ethPerWeek[address(token)], "Not Enough Stake sent");
        require(tokenTunneledTo[address(token)][tokenId] == 0, "Token already Tunneled somewhere");

        uint256 lockDuration = (nrWeeksLocked * WEEK);
        uint256 lockExpiresAt = block.timestamp + lockDuration;

        //set params - maybe move to a struct
        lockExpires[address(token)][tokenId] = lockExpiresAt;
        lockDuration[address(token)][tokenId] = lockDuration;
        originalTokenOwner[address(token)][tokenId] = msg.sender;
        tokenTunneledTo[address(token)][tokenId] = destinationDomain;
        amountStakedPerToken[address(token)][tokenId] = msg.value;

        bytes4 selector = bytes4(keccak256("mintToken(address, address, uint256, uint256)"));
        bytes memory callData = abi.encodeWithSelector(selector, msg.sender, address(token), tokenId, lockExpiresAt + GRACE_PERIOD);

        _triggerXCall(destinationDomain, callData);

        emit UpdateInitiated(asset, newValue, msg.sender);
    }

    // repays owner his stakes and burns token on L2
    function removeStake(ERC721 token, uint256 tokenId) external {
        uint32 tokenInDomain = tokenTunneledTo[address(token)][tokenId];
        require(tokenInDomain != 0, "Token is not Tunneled anywhere");
        require(token.ownerOf(tokenId) == msg.sender, "Sender does not own this token");
        require(originalTokenOwner[address(token)][tokenId] == msg.sender, "Sender is not original owner of token");
        require(block.timestamp > lockExpires[address(token)][tokenId], "The token lock is not expired yet");

        require(msg.sender.send(amountStakedPerToken[address(token)][tokenId]), "transfer failed");

        //reset params
        lockExpires[address(token)][tokenId] = 0;
        lockDuration[address(token)][tokenId] = 0;
        originalTokenOwner[address(token)][tokenId] = address(0));
        tokenTunneledTo[address(token)][tokenId] = 0;
        amountStakedPerToken[address(token)][tokenId] = 0;

        bytes4 selector = bytes4(keccak256("burnToken(address, uint256)"));
        bytes memory callData = abi.encodeWithSelector(selector, address(token), tokenId);

        _triggerXCall(tokenInDomain, callData);
        
    }

    // renews the owners stake, funds stay in contract only expiry is updated
    function renewStake(ERC721 token, uint256 tokenId) external {
        uint32 tokenInDomain = tokenTunneledTo[address(token)][tokenId];
        require(tokenInDomain != 0, "Token is not Tunneled anywhere");
        require(token.ownerOf(tokenId) == msg.sender, "Sender does not own this token");
        require(originalTokenOwner[address(token)][tokenId] == msg.sender, "Sender is not original owner of token");
        require(block.timestamp > lockExpires[address(token)][tokenId], "The token lock is not expired yet");

        // update lock param
        uint256 lockExpiresAt = lockExpires[address(token)][tokenId] + lockDuration[address(token)][tokenId];
        lockExpires[address(token)][tokenId] = lockExpiresAt;

        // call L2
        bytes4 selector = bytes4(keccak256("updateExpiry(address, uint256, uint256)"));
        bytes memory callData = abi.encodeWithSelector(selector, address(token), tokenId, lockExpiresAt + GRACE_PERIOD);
        _triggerXCall(tokenInDomain, callData);
        
    }


    // allows anyone to redeem the stake and burn the L2 token
    function forceCloseStake(ERC721 token, uint256 tokenId) external {
        uint32 tokenInDomain = tokenTunneledTo[address(token)][tokenId];
        require(tokenInDomain != 0, "Token is not Tunneled anywhere");
        require(block.timestamp > lockExpires[address(token)][tokenId] + GRACE_PERIOD, "The token lock and grace period is not expired yet");

        uint bounty = amountStakedPerToken[address(token)][tokenId] / 2;

        require(msg.sender.send(bounty), "transfer failed");
        require(originalTokenOwner[address(token)][tokenId].send(amountStakedPerToken[address(token)][tokenId] - bounty), "transfer failed");

        //reset params
        lockExpires[address(token)][tokenId] = 0;
        lockDuration[address(token)][tokenId] = 0;
        originalTokenOwner[address(token)][tokenId] = address(0));
        tokenTunneledTo[address(token)][tokenId] = 0;
        amountStakedPerToken[address(token)][tokenId] = 0;

        // call L2
        bytes4 selector = bytes4(keccak256("burnToken(address, uint256)"));
        bytes memory callData = abi.encodeWithSelector(selector, address(token), tokenId);
        _triggerXCall(tokenInDomain, callData);
        
    }

    // allows a new ERC721 token to be tunnled
    function enableToken(address _token) external requiresAuth {
        tokenIsEnabled[_token] = true;
    }
    
    // allows a new domain to be reached by setting the receiver contract
    function setReceiverForL2(uint32 _domainId, address _receiver) external requiresAuth {
        receiverOnL2[_domainId] = _receiver;
    }

    // sets the amount of ETH that needs to be staked for a token per week
    function setEthPerWeek(address _token, uint256 _amount) external requiresAuth {
        ethPerWeek[_token] = _amount;
    }

    function _triggerXCall(uint23 destinationDomain, bytes memory callData) internal{
        address receiverContract = receiverOnL2[destinationDomain];
        require(receiverContract != address(0), "Destination domain not allowed");

        IConnextHandler.CallParams memory callParams = IConnextHandler
            .CallParams({
                to: receiverContract,
                callData: callData,
                originDomain: originDomain,
                destinationDomain: destinationDomain,
                forceSlow: false,
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

    event TransferInitiated(
        address asset,
        uint256 newValue,
        address onBehalfOf
    );
}
