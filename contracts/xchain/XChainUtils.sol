// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.15;

import {ILayerZeroEndpoint} from "layer-zero/contracts/interfaces/ILayerZeroEndpoint.sol";

library XChainUtils {
    struct MintRewardsData {
        address receiver;
        address[] tokens;
        uint256[][] tokenIds;
    }

    struct MintAltToken {
        address newOwner;
        address originTokenAddress;
        uint256 tokenId;
    }

    function _sendPayload(
        ILayerZeroEndpoint endpoint,
        address receiver,
        uint16 destDomain,
        bytes memory payload
    ) internal {
        uint16 version = 1;
        uint256 gasForDestinationLzReceive = 350000;
        bytes memory adapterParams = abi.encodePacked(
            version,
            gasForDestinationLzReceive
        );

        (uint256 messageFee, ) = endpoint.estimateFees(
            destDomain,
            address(this),
            payload,
            false,
            adapterParams
        );
        require(
            address(this).balance >= messageFee,
            "XChainUtils: provided message fee to low"
        );

        // send LayerZero message
        endpoint.send{value: messageFee}(
            destDomain,
            abi.encodePacked(receiver),
            payload,
            payable(msg.sender),
            address(0x0),
            adapterParams
        );
    }

    function _estimateMessageFee(
        ILayerZeroEndpoint endpoint,
        uint16 destDomain,
        bytes memory payload
    ) internal view returns (uint256) {
        uint16 version = 1;
        uint256 gasForDestinationLzReceive = 350000;
        bytes memory adapterParams = abi.encodePacked(
            version,
            gasForDestinationLzReceive
        );

        (uint256 messageFee, ) = endpoint.estimateFees(
            destDomain,
            address(this),
            payload,
            false,
            adapterParams
        );

        return (messageFee);
    }
}
