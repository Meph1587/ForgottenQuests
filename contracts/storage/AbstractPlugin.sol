//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.15;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "../utils/StringUtils.sol";
import "./LostGrimoireStorage.sol";

abstract contract AbstractPlugin {
    using StringUtils for string;
    using StringUtils for StringUtils.slice;

    bytes32 public merkleRootTraitsTree;
    bytes32 public merkleRootNamesTree;

    uint256 public traits_nr;
    uint256 public affinities_nr;

    string internal traitNames;

    address storageOwner;

    address tokenAddress;
    LostGrimoireStorage storageContract;

    //custom methods

    function storeTokenData(
        uint256 tokenId,
        string calldata tokenName,
        uint16[] calldata traits,
        bytes32[] calldata proofsName,
        bytes32[] calldata proofsTraits
    ) public virtual {}

    function getTokenTraits(uint256 tokenId)
        public
        view
        virtual
        returns (uint16[] memory)
    {}

    // standard methods

    function getUnderlyingToken() public view returns (address) {
        return tokenAddress;
    }

    function getNrTraits() public view returns (uint256) {
        return traits_nr;
    }

    function getTokenName(uint256 tokenId) public view returns (string memory) {
        return storageContract.getTokenName(tokenAddress, tokenId);
    }

    function getTokenHasData(uint256 tokenId) public view returns (bool) {
        return storageContract.hasData(tokenAddress, tokenId);
    }

    function getTokenHasOneOfTraits(uint256 tokenId, uint16[] memory traitIds)
        public
        view
        returns (bool)
    {
        uint16[] memory traits = getTokenTraits(tokenId);

        for (uint8 i = 0; i < traitIds.length; i++) {
            for (uint8 ii = 0; ii < traits.length; ii++) {
                if (traits[ii] == traitIds[i] && traits[ii] != 7777) {
                    return true;
                }
            }
        }

        return false;
    }

    function getTraitName(uint256 index) public view returns (string memory) {
        StringUtils.slice memory strSlice = traitNames.toSlice();
        string memory separatorStr = "-";
        StringUtils.slice memory separator = separatorStr.toSlice();
        StringUtils.slice memory item;
        for (uint256 i = 0; i <= index; i++) {
            item = strSlice.split(separator);
        }
        return item.toString();
    }

    function _verifyName(
        bytes32[] memory proof,
        uint256 tokenId,
        string memory name
    ) internal view returns (bool) {
        return
            MerkleProof.verify(
                proof,
                merkleRootNamesTree,
                keccak256(abi.encode(tokenId, name))
            );
    }

    function _verifyEncodedTraits(bytes32[] memory proof, bytes memory traits)
        internal
        view
        returns (bool)
    {
        bytes32 hashedTraits = keccak256(abi.encodePacked(traits));
        return MerkleProof.verify(proof, merkleRootTraitsTree, hashedTraits);
    }
}
