//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.15;

contract RewardsManagerMock {
    address token;
    bool claimed = false;

    function getUnclaimedRewards(address)
        public
        view
        returns (address[] memory, uint256[][] memory)
    {
        if (!claimed) {
            address[] memory tokens = new address[](1);
            tokens[0] = token;

            uint256[][] memory tokenIds = new uint256[][](1);
            uint256[] memory inner = new uint256[](1);
            inner[0] = 1;
            tokenIds[0] = inner;

            return (tokens, tokenIds);
        } else {
            address[] memory tokens = new address[](0);
            uint256[][] memory tokenIds = new uint256[][](0);
            return (tokens, tokenIds);
        }
    }

    function addRewardToken(address, address l2Address) public {
        token = l2Address;
    }

    function setAsClaimed(address[] memory, uint256[][] memory) public {
        claimed = true;
    }
}
