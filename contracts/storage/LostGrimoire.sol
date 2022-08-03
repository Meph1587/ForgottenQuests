//SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.15;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../utils/GlobalRandom.sol";
import "./AbstractPlugin.sol";

contract LostGrimoire is Ownable {
    mapping(address => address) plugins;
    mapping(address => uint256) tokenWeights;
    address[] allPlugins;
    uint256 totalWeight;

    GlobalRandom randomness;

    constructor(GlobalRandom _randomness) {
        randomness = _randomness;
    }

    function addPlugin(address token, address plugin) public onlyOwner {
        plugins[token] = plugin;
        allPlugins.push(plugin);
    }

    function setTokenWeights(address[] memory tokens, uint256[] memory weights)
        public
        onlyOwner
    {
        require(
            tokens.length == weights.length,
            "LostGrimoire: length mismatch"
        );
        uint256 used = 0;
        for (uint8 i = 0; i < tokens.length; i++) {
            tokenWeights[tokens[i]] = weights[i];
            used += weights[i];
        }
        totalWeight = used;
    }

    function removePlugin(address token) public onlyOwner {
        address plugin = plugins[token];
        uint256 index = 0;
        for (uint8 i = 0; i < allPlugins.length; i++) {
            if (allPlugins[i] == plugin) {
                index = i;
                break;
            }
        }
        for (uint256 i = index; i < allPlugins.length - 1; i++) {
            allPlugins[i] = allPlugins[i + 1];
        }
        delete allPlugins[allPlugins.length - 1];
        allPlugins.pop();

        plugins[token] = address(0);
    }

    function getPlugin(address token) public view returns (AbstractPlugin) {
        return AbstractPlugin(plugins[token]);
    }

    function getRandomToken() public returns (address) {
        uint256 tokensLen = allPlugins.length;
        uint256 bigNr = randomness.getRandSeed();

        uint16 value = uint16(bigNr % totalWeight);

        uint256 used = 0;
        for (uint8 i = 0; i < tokensLen; i++) {
            address token = AbstractPlugin(allPlugins[i]).getUnderlyingToken();
            used += tokenWeights[token];
            if (value <= used) {
                return token;
            }
        }
        return address(0);
    }

    function getRandomTraitIdForToken(address token) public returns (uint16) {
        AbstractPlugin datasource = getPlugin(token);
        uint256 bigNr = randomness.getRandSeed();
        //overflow can not happen here
        uint16 trait = uint16(bigNr % datasource.getNrTraits());
        return trait;
    }

    function getRandomAffinityIdForToken(address token)
        public
        returns (uint16)
    {
        AbstractPlugin datasource = getPlugin(token);
        uint256 bigNr = randomness.getRandSeed();
        //overflow can not happen here
        uint16 affinity = uint16(bigNr % datasource.getNrAffinities());
        return affinity;
    }

    function getHasAnyOfTraits(
        address token,
        uint256 tokenId,
        uint16 trait
    ) public view returns (bool) {
        AbstractPlugin datasource = getPlugin(token);
        uint16[] memory traits = new uint16[](1);
        traits[1] = trait;
        return datasource.getTokenHasOneOfTraits(tokenId, traits);
    }

    function getHasAnyOfAffinity(
        address token,
        uint256 tokenId,
        uint16 affinity
    ) public view returns (bool) {
        AbstractPlugin datasource = getPlugin(token);
        uint16[] memory affinities = new uint16[](1);
        affinities[1] = affinity;
        return datasource.getTokenHasOneOfAffinities(tokenId, affinities);
    }
}
