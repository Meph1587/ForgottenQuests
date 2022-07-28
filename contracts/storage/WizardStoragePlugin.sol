//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.15;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./AbstractPlugin.sol";
import "./LostGrimoireStorage.sol";

contract WizardsStoragePlugin is AbstractPlugin {
    string private constant TRAIT_NAMES =
        "Black-Blue-Green-Red-Card Magician-Desert Wear-Shoulder Cape Green-Shoulder Cape Red-Banded Overall-Brown Tunic-Grey Tunic-White Tunic-Blue Big Buckle-Green Big Buckle-Blue Lined Coveralls-Green Lined Coveralls-Space Chroma-Cape in the Wind-Green Caped Traveller-Orange Caped Traveller-Purple Caped Traveller-Spandex  Green-Spandex  Dark-Overcoat-Tech Coat-Deeze Body-Jester Diamonds-Double Sash-Blue Elven Cloak-Green Elven Cloak-Yellow Elven Cloak-Purple Yoga-Purple Yoga-Red Yoga-Rose Yoga-Blue Hip Pouch-Green Hip Pouch-Red Hip Pouch-Green Cloak-Purple Cloak-Formal Suit-Blue Coveralls-Brown Coveralls-Green Coveralls-Red Coveralls-White Coveralls-SupaFly-Gfunk-Gold Chain-Green Hip Scarf-Orange Hip Scarf-Cheetah Print-Ice Robe-Loopify-Red Cleric-Yellow Cleric-Pink Cosmic-Swashbuckling Gear-Poncho-Brown Harem Pants-Orange Harem Pants-Purple Harem Pants-Green Scholar-Orange Scholar-Rainbow Suit-Red Suit-All Seeing Robe-Green Mantle Robe-Purple Mantle Robe-Punker-Skeleton Flame-Gold Skeleton-Silver Skeleton-Tundra Wear-Dapper Formal-Cosmic Cardigan-Aristocrat Blue-Aristocrat Green-Aristocrat Purple-Two Tone Fringe-Skipper-Vest Blue-Vest Green-Celestial Sash-Wicker Wear-Black Wraith-White Wraith-Robe of Shadow-Forever Bat-Dirt Rabbit-Psychic Rabbit-Pink Butterfly-Bengal Cat-Lucky Black Cat-Sun Cat-Bliss Cat-Mesozoic Cockatrice-Crackerjack Crow-Pink Footed Crow-Field Dog-White Dog-Fox Trickster-3D Frog-Golden Toad-Swamp Bullfrog-Ember Frog-Jewled Hummingbird-Giant Ladybug-Merlin's Monkey-Great Owl-Blue Rat-Plague Rat-Albino Rat-Skramps-Sapphire Slime-Emerald Slime-Topaz Slime-Astral Snail-Golden Viper-Green Asp-Red Mamba-Ancient Sphinx-Rain Toucan-Onyx Wolf-Aura Wolf-Ascetic-Kabuki-Thelemist-Djinn-Kelt-ArtChick-Huntress-Floral Master-Woodland Shapeshifter-Bernardo-Enchantress-Evil One-BrainDrain-Skylord-Dark Sister-Felis-Cloud Prophet-Stranger-Claire Silver-Corvid-Great Old One-Black Mage-Arcadian Master-Deeze-Houngan-Dapper Arcanist-Bippadotta-Vampyre-Professor-Vegetable-Witch-Empress-Big Gross Eyeball-Flaming Skull-Swamp Witch-Eastern Arcanist-9272ETH-Cosmic Arcanist-GFunk Head-Dream Master-Gruffling-Hag-Hunter-Fiskantes-Hue Master-Illuminatus-Imp-Pumpkin Head-Wildman-Labyrinthian-Joey Billboard-Crone-Strongman-Koopling-Creol-Kempo-Loopify-Lycanthrope-MachoMan-Marlo-Warlock-Seer-Mambo-Olympian-Faustian-Coven Sister-Red Priestess-Myrddin-Canaanite-Death Eater-Fungus-Philosopher-Fortune Seeker-Botanic Master-Man Behind the Curtain-Anuran-Wooden Boy-Sandman-Durm and Strang-Swashbuckler-Rogue Arcanist-Animist-Bard-Charmer-Wild Woman-LeggoGreggo-Hermit-Astrologer-Medicine Man-Prophet-Scholar-WereBeast-Mandinka-Master of Wood, Water, and Hill-Punjabi-Polar Shapeshifter-Diviner-Dark Arcanist-Vamp-Darkling-Weird Wizz-Wicked Wizard-Blue Wizard-Brown Wizard-Green Wizard-Purple Wizard-Red Wizard-White Wizard-Yellow Wizard-Wolfkin-Kobold-Shaolin-Trickster-Astral Arcanist-Gold Skeleton-Cyborg Skeleton Arcanist-Cyborg Skeleton Rogue-Silver Skeleton-Tengu Preist-Fur Gnome-Mug of Ale-Isaac's Apple-Siren's Bell-Vile of Virgin's Blood-Book of Magic-Candle of Intuition-Ace in the Hole-Crystal Ball-Egg of Unknown Beast-Gorgon's Eye-Dragon Fireworks-Goblet of Immortality-Siren's Harp-Lucky Horseshoe-Sphinx's Hourglass-Key of the 7th Realm-Bag of Tricks-Green Mushroom-Red Mushroom-Shaman's Peyote-Phoenix Feather-Wizard's Pipe-Astral Potion-Cannabis Potion-Mandrake Potion-Nightshade Potion-Passion Potion-Chroma Crystal-Eternal Rose-Crystal Skull-Mystic Ice Cream-A dumb stick...-Prometheus's Torch-Venus Fly Trap-Flesh Eating Plant-The Midas Rod-The World Egg-Rune of Air-Rune of Brass-Rune of Brimstone-Rune of Cinnabar-Rune of Down-Rune of Earth-Rune of Fire-Rune of Infinity-Rune of Jupiter-Rune of Lime-Rune of Mars-Rune of Mercury-Rune of Neptune-Rune of Omega-Rune of Pluto-Rune of Saturn-Rune of Sigma-Rune of Steel-Rune of Sun-Rune of Up Only-Rune of Uranus-Rune of Venus-Rune of Water-Thor's Wrath: the Lightning Spell-Fairy Glamour: the Dazzle Spell-Grim Reaper's Breath: the Death Spell-The Gnome's Tooth: the Earth Spell-Salamander's Tongue: the Fire Spell-Hobgoblin's Flame: the Wayward Spell-Aphrodite's Heart: the Love Spell-Dryad's Ear: the Plant Spell-Loki's Bridge: the Rainbow Spell-Kelpie's Fury: the Water Spell-Zephyr's Laugh: the Wind Spell-Ruby Staff-Emerald Staff-The Orb Staff-A Big Magic Stick-The Bone Stave-Guillaume's Broom-Caduceus-Harmony Staff-Staff-Jinx Staff-Courage Staff-Peace Staff-Joy Staff-Ether Staff-Phosphorus Spear-Golden Bull Staff-Lunar Staff-Indigo Moon Staff-Chaos Staff-Soul Harvester-Golden Soul Reaper-The Mamba Stick-Stellar Staff-Solar Staff-Garnet Staff";

    string private constant AFFINITY_NAMES =
        "Academic-Ascetic-Kumadori-Air-Drunk-Thelema-Desert-Djinn-Khelt-Apple-Arm Sash-Artgirl-Huntress-Astral-Magic Bag-Banded Overall-Bat-Bell-Floral Master-Woodland Shapeshifter-Bernardo-Enchantress-Blackness-Evil One-Blood-Blue Shift-Electrification-Bone-Book-Boots-BrainDrain-Brass-Brimstone-Broom-Brownish-Brownish Red-Buckle-Butterfly-Caduceus-Skylord-Candle-Cape-Cardistry-Dark Sister-Cat-Cat-Cloud Prophet-Chemistry-Stranger-Cinnabar-Urban-Claire-Coat-Cockatrice-Cold-Corvid-Cosmic-Crook-Crow-Ctulu-Cyan-Darkness-Black Mage-Arcadian Master-Dazzling-Death-Deeze-Desert-Dog-DooVoo-Dapper Arcanist-Dotta-Down-Vampyre-Drape-Professor-Earth-Earth-Egg-Vegetable-Witch-Electrification-Elven-Empress-Ether-Eyeball-Eyeball-Feather-Feminine-Fire-Firework-Flame-Swamp Witch-Food-Forest-Formal-Fox-Frog-Eastern Arcanist-Urban-Gender Neutral-Cosmic Arcanist-GFunk-Goblet-Dream Master-Gold-Goofy-Verdant-Grey-Gruffling-Hag-Harp-Stag-Cardistry-Horseshoe-Hourglass-Hue-Hummingbird-Hunter-Icecream-Illuminatus-Imp-Infinity-Pumpkin-Wildman-Labyrinthian-Jester-JB-Jungle-Crone-Jupiter-Strongman-Key-Koopling-Ladybug-Creol-Greggo-Light-Lime-Kempo-Loopify-Love-Lucky-Lycanthrope-MachoMan-Masculine-Alien-Warlock-Mars-Seer-Mambo-Olympian-Faustian-Coven Sister-Red Preistess-Mercury-Myrddin-Middle Sash-Canaanite-Monk-Monkey-Moon-Mountains-Death Man-Mushroom-Music-Nature-Nature-Neptune-Philosopher-Ocean-Olive-Omega-Oracle-Orange-Orb-Owl-Fortune Seeker-Botanic Master-Man Behind the Curtain-Peyote-Anuran-Pink-Alien-Wooden Boy-Pipe-Pirate-Flora-Pluto-Poison-Poncho-Potion-Prism-Prophecy-Prophecy-Sandman-Purple Haze-Lagomorph-Rainbow-Rodent-Durm and Strang-Crimson-Red Suit-Robe-Swashbuckler-Rogue Arcanist-Animist-Bard-Rose-Rugged-Rune-Saturn-Charmer-Academic-Scythe-Sea-Shaman-Wild Woman-Sigma-Quick Silver-Skeleton-Tone Dark-Tone Green-Tone Light-Skramps-Skull-Slime-Snail-Snake-Hermit-Astrologer-Sparkles-Spell-Sphinx-Staff-Star-Steel-Stick-Medicine Man-Suit-Suit-Sun-Prophet-Swamp-Scholar-Tengu Preist-Were Beast-Time-Mandinka-Master of Wood, Water, and Hill-Torch-Toucan-Punjabi-Tundra-Polar Shapeshifter-Tunic-Unihorn-Unique-Up-Uranus-Urban-Diviner-Fur Gnome-Dark Arcanist-Venus Flytrap-Vamp-Void-Darkling-Voodoo-Wand-Warm-Water Magic-White Magic-Wicker-Wind-Wizzle-Wizzy-Lupus-Lupus-Kobold-World Egg-Wraith-Amber-Shaolin-Trickster-Astral Arcanist";

    event StoredTrait(uint256 wizardId, string name, bytes encodedTraits);

    constructor(
        bytes32 _rootTraits,
        bytes32 _rootNames,
        uint256 _traits_nr,
        uint256 _affinities_nr,
        address _tokenAddress,
        LostGrimoireStorage _storageContract
    ) {
        storageOwner = msg.sender;
        merkleRootTraitsTree = _rootTraits;
        merkleRootNamesTree = _rootNames;
        storageContract = _storageContract;
        tokenAddress = _tokenAddress;
        traits_nr = _traits_nr;
        affinities_nr = _affinities_nr;
        traitNames = TRAIT_NAMES;
        affinityNames = AFFINITY_NAMES;
    }

    function storeTokenData(
        uint256 wizardId,
        string calldata tokenName,
        uint16[] calldata traits,
        bytes32[] calldata proofsName,
        bytes32[] calldata proofsTraits
    ) public override {
        require(traits.length == 7, "Invalid Length");
        require(traits[0] == wizardId, "WizardsId to Trait mismatch");
        require(
            !storageContract.hasData(tokenAddress, wizardId),
            "Traits are already stored"
        );

        require(
            _verifyName(proofsName, wizardId, tokenName),
            "Merkle Proof for name is invalid!"
        );

        bytes memory encodedTraits = _encode(
            traits[0],
            traits[1],
            traits[2],
            traits[3],
            traits[4],
            traits[5],
            traits[6]
        );
        require(
            _verifyEncodedTraits(proofsTraits, encodedTraits),
            "Merkle Proof for traits is invalid!"
        );

        storageContract.storeTokenData(
            tokenAddress,
            wizardId,
            encodedTraits,
            tokenName
        );

        emit StoredTrait(wizardId, tokenName, encodedTraits);
    }

    /**
        VIEWS
     */

    function getTokenTraits(uint256 wizardId)
        public
        view
        override
        returns (uint16[] memory)
    {
        //ignore id
        (
            ,
            uint16 t0,
            uint16 t1,
            uint16 t2,
            uint16 t3,
            uint16 t4,
            uint16 t5
        ) = _decode(storageContract.getTokenTraits(tokenAddress, wizardId));

        uint16[] memory traitsList = new uint16[](6);
        traitsList[0] = t0;
        traitsList[1] = t1;
        traitsList[2] = t2;
        traitsList[3] = t3;
        traitsList[4] = t4;
        traitsList[5] = t5;
        return traitsList;
    }

    function getTokenAffinities(uint256 wizardId)
        public
        view
        override
        returns (uint16[] memory)
    {
        uint16[] memory traits = getTokenTraits(wizardId);

        uint16[] storage affinityT1 = traitsToAffinities[traits[0]];
        uint16[] storage affinityT2 = traitsToAffinities[traits[1]];
        uint16[] storage affinityT3 = traitsToAffinities[traits[2]];
        uint16[] storage affinityT4 = traitsToAffinities[traits[3]];
        uint16[] storage affinityT5 = traitsToAffinities[traits[4]];

        uint16[] memory affinitiesList = new uint16[](
            affinityT1.length +
                affinityT2.length +
                affinityT3.length +
                affinityT4.length +
                affinityT5.length
        );

        uint256 lastIndexWritten = 0;

        // 7777 is used as a filler for empty Trait slots
        if (traits[0] != 7777) {
            for (uint256 i = 0; i < affinityT1.length; i++) {
                affinitiesList[i] = affinityT1[i];
            }
            lastIndexWritten = lastIndexWritten + affinityT1.length;
        }

        if (traits[1] != 7777) {
            for (uint256 i = 0; i < affinityT2.length; i++) {
                affinitiesList[lastIndexWritten + i] = affinityT2[i];
            }
            lastIndexWritten = lastIndexWritten + affinityT2.length;
        }

        if (traits[2] != 7777) {
            for (uint8 i = 0; i < affinityT3.length; i++) {
                affinitiesList[lastIndexWritten + i] = affinityT3[i];
            }
            lastIndexWritten = lastIndexWritten + affinityT3.length;
        }

        if (traits[3] != 7777) {
            for (uint8 i = 0; i < affinityT4.length; i++) {
                affinitiesList[lastIndexWritten + i] = affinityT4[i];
            }
            lastIndexWritten = lastIndexWritten + affinityT4.length;
        }

        if (traits[4] != 7777) {
            for (uint8 i = 0; i < affinityT5.length; i++) {
                affinitiesList[lastIndexWritten + i] = affinityT5[i];
            }
        }

        return affinitiesList;
    }

    /**
        INTERNAL
     */

    function _encode(
        uint16 id,
        uint16 t0,
        uint16 t1,
        uint16 t2,
        uint16 t3,
        uint16 t4,
        uint16 t5
    ) internal pure returns (bytes memory) {
        bytes memory data = new bytes(16);

        assembly {
            mstore(add(data, 32), 32)

            mstore(add(data, 34), shl(240, id))
            mstore(add(data, 36), shl(240, t0))
            mstore(add(data, 38), shl(240, t1))
            mstore(add(data, 40), shl(240, t2))
            mstore(add(data, 42), shl(240, t3))
            mstore(add(data, 44), shl(240, t4))
            mstore(add(data, 46), shl(240, t5))
        }

        return data;
    }

    function _decode(bytes memory data)
        internal
        pure
        returns (
            uint16 id,
            uint16 t0,
            uint16 t1,
            uint16 t2,
            uint16 t3,
            uint16 t4,
            uint16 t5
        )
    {
        assembly {
            let len := mload(add(data, 0))

            id := mload(add(data, 4))
            t0 := mload(add(data, 6))
            t1 := mload(add(data, 8))
            t2 := mload(add(data, 10))
            t3 := mload(add(data, 12))
            t4 := mload(add(data, 14))
            t5 := mload(add(data, 16))
        }
    }
}
