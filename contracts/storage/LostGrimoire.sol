//SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.15;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../utils/StringUtils.sol";
import "../utils/GlobalRandom.sol";
import "./AbstractPlugin.sol";

contract LostGrimoire is Ownable {
    using StringUtils for string;
    using StringUtils for StringUtils.slice;


    mapping(address => address) plugins;
    mapping(address => uint256) public tokenWeights;
    address[] public allPlugins;
    uint256 public totalWeight;

    string public locations="The Alchemists Archipelago-Salt-Red Wizard Keep-Calista's Citadel-Omega Oxbow-Brine-Weird House-Scared Tower-Skylord Rookery-Alessar's Keep-Aldo's Island-Asmodeus's Surf-Kobold's Crossroad-Sacred Pillars-Gate to the Seventh Realm-Dream Master Lake-Fur Gnome World-Hedge Wizard Wood-Kelpie's Bay-Chronomancer's Riviera-Blue Wizard Bastion-Carnival Pass-Frog Master Marsh-Goblin Town-BattleMage Mountains-Yellow Wizard Haven-Atlanta's Pool-Infinity Veild-Fey-Thorn-Quantum Shadow-Great Owl Obelisk-Sand-Zaros Oasis-Cave of the Platonic Shadow-Valley of the Void Disciple-Vampyre Mist-Toadstool-Hue Master's Pass-Cuckoo Land-Psychic Leap";
    uint256 locationsNr = 53;

    GlobalRandom randomness;

    constructor(GlobalRandom _randomness) {
        randomness = _randomness;
    }

    function addPlugin(address token, address plugin) public onlyOwner {
        if (plugins[token] != address(0)) {
            removePlugin(token);
        }
        allPlugins.push(plugin);
        plugins[token] = plugin;
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

    function setTokenWeights(address[] memory tokens, uint256[] memory weights)
        public
        onlyOwner
    {
        require(
            tokens.length == weights.length,
            "LostGrimoire: token-weights length mismatch"
        );
        require(
            tokens.length == allPlugins.length,
            "LostGrimoire: token-plugins length mismatch"
        );
        uint256 used = 0;
        for (uint8 i = 0; i < tokens.length; i++) {
            tokenWeights[tokens[i]] = weights[i];
            used += weights[i];
        }
        totalWeight = used;
    }

    

    function setLocations(string memory _locations, uint256 _locationsNr) public onlyOwner {
        locations = _locations;
        locationsNr = _locationsNr;
    }


    function getPlugin(address token) public view returns (AbstractPlugin) {
        return AbstractPlugin(plugins[token]);
    }

     function getRandomLocation() public returns(string memory){
        
        uint256 index = randomness.getRandSeed() % locationsNr;

        StringUtils.slice memory strSlice = locations.toSlice();
        string memory separatorStr = "-";
        StringUtils.slice memory separator = separatorStr.toSlice();
        StringUtils.slice memory item;
        for (uint256 i = 0; i <= index; i++) {
            item = strSlice.split(separator);
        }
        return item.toString();
    }

    function getRandomToken() public returns (address) {
        uint256 tokensLen = allPlugins.length;
        uint256 bigNr = randomness.getRandSeed();

        require(totalWeight > 0, "LostGrimoire: weights not set");

        uint16 value = uint16(bigNr % totalWeight);

        uint256 used = 0;
        address ret = address(0);
        for (uint8 i = 0; i < tokensLen; i++) {
            address token = AbstractPlugin(allPlugins[i]).getUnderlyingToken();
            used += tokenWeights[token];
            if (value <= used) {
                ret = token;
                break;
            }
        }

        return ret;
    }

    function getRandomTraitIdForToken(address token) public returns (uint16) {
        AbstractPlugin datasource = getPlugin(token);
        uint256 bigNr = randomness.getRandSeed();
        //overflow can not happen here
        uint16 trait = uint16(bigNr % datasource.getNrTraits());
        return trait;
    }

    function getHasTrait(
        address token,
        uint256 tokenId,
        uint16 trait
    ) public view returns (bool) {
        AbstractPlugin datasource = getPlugin(token);
        require(
            datasource.getTokenHasData(tokenId),
            "LostGrimoire: Token does not have data stored yet"
        );
        uint16[] memory traits = new uint16[](1);
        traits[0] = trait;
        return datasource.getTokenHasOneOfTraits(tokenId, traits);
    }
}
