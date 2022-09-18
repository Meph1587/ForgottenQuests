//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.15;
pragma experimental ABIEncoderV2;

import "../utils/GlobalRandom.sol";
import "../utils/StringUtils.sol";

contract PromptMaker {
    using StringUtils for string;
    using StringUtils for StringUtils.slice;

    string public locations="The Alchemists Archipelago, beaches, palm trees, tropical-Salt, beaches, palm trees, tropical-Red Wizard Keep, beaches, palm trees, tropical-Calista's Citadel, beaches, palm trees, tropical-Omega Oxbow, beaches, palm trees, tropical-Brine, beaches, palm trees, tropical-Weird House, beaches, palm trees, tropical-Scared Tower, beaches, palm trees, tropical-Skylord Rookery, beaches, palm trees, tropical-Alessar's Keep, beaches, palm trees, tropical-Aldo's Island, beaches, palm trees, tropical-Asmodeus's Surf, beaches, palm trees, tropical-Kobold's Crossroad, beaches, palm trees, tropical-Sacred Pillars, beaches, palm trees, tropical-Gate to the Seventh Realm, beaches, palm trees, tropical-Dream Master Lake, beaches, palm trees, tropical-Fur Gnome World, beaches, palm trees, tropical-Hedge Wizard Wood, beaches, palm trees, tropical-Kelpie's Bay, beaches, palm trees, tropical-Chronomancer's Riviera, beaches, palm trees, tropical-Blue Wizard Bastion, beaches, palm trees, tropical-Carnival Pass, beaches, palm trees, tropical-Frog Master Marsh, beaches, palm trees, tropical-Goblin Town, beaches, palm trees, tropical-BattleMage Mountains, beaches, palm trees, tropical-Yellow Wizard Haven, beaches, palm trees, tropical-Atlanta's Pool, beaches, palm trees, tropical-Infinity Veild, beaches, palm trees, tropical-Fey, beaches, palm trees, tropical-Thorn, beaches, palm trees, tropical-Quantum Shadow, beaches, palm trees, tropical-Great Owl Obelisk, beaches, palm trees, tropical-Sand, beaches, palm trees, tropical-Zaros Oasis, beaches, palm trees, tropical-Cave of the Platonic Shadow, beaches, palm trees, tropical-Valley of the Void Disciple, beaches, palm trees, tropical-Vampyre Mist, beaches, palm trees, tropical-Toadstool, beaches, palm trees, tropical-Hue Master's Pass, beaches, palm trees, tropical-Cuckoo Land, beaches, palm trees, tropical-Psychic Leap, beaches, palm trees, tropical";
    string public lightings=", sunrise-, sunset-, midday-, midnight-, moonlight-, foggy-, dark-, golden light-, silver light-, purple light-, blue light-, red light-";
    string public styles=", anime-, oil painting-, high resolution-, cartoon-, pixel art-, monet-, abstract art-, cyberpunk-, black and white-, retro colors-, detailed-";
    
    uint256 public locationsNr = 41;   
    uint256 public lightingsNr = 11;
    uint256 public stylesNr = 11;



    function getPrompt(uint256 seed) public view returns(string memory){
        string memory separatorStr = "-";
        StringUtils.slice memory separator = separatorStr.toSlice();
        
        uint256 locationIndex = seed % locationsNr;

        StringUtils.slice memory strSliceLocations = locations.toSlice();
        StringUtils.slice memory itemLocation;
        for (uint256 i = 0; i <= locationIndex; i++) {
            itemLocation = strSliceLocations.split(separator);
        }
        string memory location = itemLocation.toString();

        uint256 lightingIndex = seed % lightingsNr;

        StringUtils.slice memory strSliceLighting = lightings.toSlice();
        StringUtils.slice memory itemLighting;
        for (uint256 i = 0; i <= lightingIndex; i++) {
            itemLighting = strSliceLighting.split(separator);
        }
        string memory lighting = itemLighting.toString();


        uint256 styleIndex = seed % stylesNr;

        StringUtils.slice memory strSliceStyles = styles.toSlice();
        StringUtils.slice memory itemStyle;
        for (uint256 i = 0; i <= styleIndex; i++) {
            itemStyle = strSliceStyles.split(separator);
        }
        string memory style = itemStyle.toString();

        return 
            string(
                abi.encodePacked(
                    location, lighting, style
                )
            );
    }

}