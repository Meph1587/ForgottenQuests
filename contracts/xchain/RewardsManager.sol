// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.15;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

import "../tokens/L2/ForceTransferableNFT.sol";

// mock for testing
contract RewardsManager is Ownable {
    mapping(address => address) l1ToL2Mapping;
    mapping(address => address) l2ToL1Mapping;

    mapping(address => mapping(uint256 => bool)) claimedRewards;

    address[] allL2Tokens;

    address bridge;

    constructor(address _bridge) Ownable() {
        bridge = _bridge;
    }

    modifier onlyBridge() {
        require(
            msg.sender == bridge,
            "RewardsCollector: not allowed to force-transfer"
        );
        _;
    }

    function getUnclaimedRewards(address owner)
        public
        view
        returns (address[] memory, uint256[][] memory)
    {
        address[] memory tokens;
        uint8 tokensAdded = 0;

        uint256[][] memory ids;
        uint8 idsAdded = 0;

        for (uint8 i = 0; i < allL2Tokens.length; i++) {
            uint256[] memory tokenIds = ForceTransferableNFT(allL2Tokens[i])
                .tokensOfOwner(owner);
            for (uint8 ii = 0; ii < tokenIds.length; ii++) {
                if (!claimedRewards[allL2Tokens[i]][tokenIds[ii]]) {
                    ids[i][idsAdded] = tokenIds[ii];
                    idsAdded += 1;
                    //claimedRewards[allL2Tokens[i]][tokenIds[ii]] = true;
                }
            }
            idsAdded = 0;
            if (ids[i].length != 0) {
                tokens[tokensAdded] = allL2Tokens[i];
                tokensAdded += 1;
            }
        }

        return (tokens, ids);
    }

    function setAsClaimed(address[] memory tokens, uint256[][] memory tokenIds)
        public
        onlyBridge
    {
        for (uint8 i = 0; i < tokens.length; i++) {
            for (uint8 ii = 0; ii < tokenIds[i].length; ii++) {
                claimedRewards[tokens[i]][tokenIds[i][ii]];
            }
        }
    }

    function addRewardToken(address l1Address, address l2Address)
        public
        onlyOwner
    {
        allL2Tokens.push(l2Address);
        l1ToL2Mapping[l1Address] = l2Address;
        l2ToL1Mapping[l2Address] = l1Address;
    }

    function setBridge(address _bridge) public onlyOwner {
        bridge = _bridge;
    }
}
