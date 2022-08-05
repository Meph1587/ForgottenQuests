//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.15;

import "./ForceTransferableNFT.sol";
import "../../utils/GlobalRandom.sol";
import "../../utils/StringUtils.sol";
import "../../utils/Base64.sol";

contract SoulGems is ForceTransferableNFT {
    using StringUtils for string;

    string public imgUri;
    GlobalRandom randomness;

    struct Stats {
        uint16 strength;
        uint16 dexterity;
        uint16 constitution;
        uint16 intelligence;
        uint16 wisdom;
        uint16 charisma;
    }

    struct TokenWithId {
        address token;
        uint256 tokenId;
    }

    mapping(uint256 => TokenWithId) gemToToken;
    mapping(address => mapping(uint256 => uint256)) tokenToGem;
    mapping(uint256 => Stats) tokenStats;

    constructor(
        string memory _uri,
        GlobalRandom _randomness,
        address _tavern
    ) ForceTransferableNFT("SoulGems", "SOULGEMS") {
        imgUri = _uri;
        randomness = _randomness;
        minters[_tavern] = true;
    }

    function setImgURI(string memory _uri) public onlyOwner {
        imgUri = _uri;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        return
            string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    Base64.encode(
                        bytes(
                            string(
                                abi.encodePacked(
                                    '{"name": "SoulGem #',
                                    StringConversion.stringFromUint(tokenId),
                                    '", "description": "SoulGems refelct the inner being of whomever they are bound to", "attributes": [',
                                    _getFormattedStats(tokenId),
                                    '], "image": "',
                                    imgUri,
                                    StringConversion.stringFromUint(tokenId),
                                    '"}'
                                )
                            )
                        )
                    )
                )
            );
    }

    function bindToToken(
        uint256 gemId,
        address token,
        uint256 tokenId
    ) public {
        TokenWithId memory tokenWithId = TokenWithId({
            token: token,
            tokenId: tokenId
        });
        require(
            msg.sender == ownerOf(gemId),
            "SoulGems: gem not owned by caller"
        );
        require(
            msg.sender == ERC721(token).ownerOf(tokenId),
            "SoulGems: token not owned by caller"
        );
        require(
            gemToToken[gemId].token == address(0),
            "SoulGems: gem already bound"
        );
        require(
            tokenToGem[token][tokenId] == 0,
            "SoulGems: token already has a gem"
        );

        gemToToken[gemId] = tokenWithId;
        tokenToGem[token][tokenId] = gemId;
    }

    function unBindFromToken(
        uint256 gemId,
        address token,
        uint256 tokenId
    ) public {
        TokenWithId memory tokenWithId = TokenWithId({
            token: token,
            tokenId: tokenId
        });
        require(
            msg.sender == ownerOf(gemId),
            "SoulGems: gem not owned by caller"
        );
        require(
            msg.sender == ERC721(token).ownerOf(tokenId),
            "SoulGems: token not owned by caller"
        );
        require(
            gemToToken[gemId].token == tokenWithId.token &&
                gemToToken[gemId].tokenId == tokenWithId.tokenId,
            "SoulGems: gem not bound to token"
        );
        require(
            tokenToGem[token][tokenId] == gemId,
            "SoulGems: token not bound to gem"
        );

        gemToToken[gemId] = TokenWithId({token: address(0), tokenId: 0});
        tokenToGem[token][tokenId] = 0;
    }

    function reRollStats(uint256 gemId) public {
        Stats memory stats = _rollStats();
        tokenStats[gemId] = stats;
    }

    function mintNextWithRoll(address owner) public onlyMinter {
        uint256 nextId = totalSupply();
        _safeMint(owner, nextId);
        Stats memory stats = _rollStats();
        tokenStats[nextId] = stats;
    }

    function getStats(uint256 gemId) public view returns (Stats memory) {
        return tokenStats[gemId];
    }

    function getStatsforToken(address token, uint256 tokenId)
        public
        view
        returns (Stats memory)
    {
        TokenWithId memory tokenWithId = TokenWithId({
            token: token,
            tokenId: tokenId
        });
        return getStats(tokenToGem[token][tokenId]);
    }

    function _getFormattedStats(uint256 gemId)
        internal
        view
        returns (string memory)
    {
        Stats memory stats = getStats(gemId);
        TokenWithId memory tokenWithId = gemToToken[gemId];
        return
            string(
                abi.encodePacked(
                    '"strength" : ',
                    stats.strength,
                    ', "dexterity" : ',
                    stats.dexterity,
                    ', "constitution" : ',
                    stats.constitution,
                    ', "intelligence" : ',
                    stats.intelligence,
                    ', "wisdom" : ',
                    stats.wisdom,
                    ', "charisma" : ',
                    stats.charisma,
                    ', "bount to" : ',
                    ERC721(tokenWithId.token).symbol(),
                    " #",
                    tokenWithId.tokenId
                )
            );
    }

    function _rollStats() internal returns (Stats memory) {
        uint16[] memory stats;
        for (uint16 i = 0; i < 6; i++) {
            uint256 bigNr = randomness.getRandSeed();
            //get value in range 3 - 20
            uint16 value = uint16(bigNr % 18) + 3;
            stats[i] = value;
        }

        Stats memory resp = Stats({
            strength: stats[0],
            dexterity: stats[1],
            constitution: stats[2],
            intelligence: stats[3],
            wisdom: stats[4],
            charisma: stats[5]
        });

        return resp;
    }
}
