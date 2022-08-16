// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.15;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

import "../tokens/L2/ForceTransferableNFT.sol";

contract RewardsManager is Ownable {
    mapping(address => address) l1ToL2Mapping;
    mapping(address => address) l2ToL1Mapping;

    mapping(address => mapping(uint256 => bool)) claimedRewards;

    address[] public allL2Tokens;

    address public bridge;

    constructor(address _bridge) Ownable() {
        bridge = _bridge;
    }

    modifier onlyBridge() {
        require(
            msg.sender == bridge,
            "RewardsManager: not allowed set as claimed"
        );
        _;
    }

    function getUnclaimedRewards(address owner)
        public
        view
        returns (address[] memory, uint256[][] memory)
    {
        address[] memory tokens = new address[](allL2Tokens.length);

        uint256[][] memory ids = new uint256[][](allL2Tokens.length);

        for (uint8 i = 0; i < allL2Tokens.length; i++) {
            uint256[] memory tokenIds = ForceTransferableNFT(allL2Tokens[i])
                .tokensOfOwner(owner);

            uint256[] memory inner = new uint256[](tokenIds.length);

            for (uint8 ii = 0; ii < tokenIds.length; ii++) {
                if (!claimedRewards[allL2Tokens[i]][tokenIds[ii]]) {
                    inner[ii] = tokenIds[ii];
                } else {
                    inner[ii] = type(uint256).max;
                }
            }
            ids[i] = inner;
            tokens[i] = l2ToL1Mapping[allL2Tokens[i]];
        }

        return (tokens, ids);
    }

    function setAsClaimed(address[] memory tokens, uint256[][] memory tokenIds)
        public
        onlyBridge
    {
        for (uint8 i = 0; i < tokens.length; i++) {
            for (uint8 ii = 0; ii < tokenIds[i].length; ii++) {
                claimedRewards[tokens[i]][tokenIds[i][ii]] = true;
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
