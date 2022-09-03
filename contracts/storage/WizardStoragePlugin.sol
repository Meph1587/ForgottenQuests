//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.15;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./AbstractPlugin.sol";
import "./LostGrimoireStorage.sol";

contract WizardStoragePlugin is AbstractPlugin {
    string private constant TRAIT_NAMES =
        "3D Frog-9272ETH-A Big Magic Stick-A dumb stick...-Ace in the Hole-Albino Rat-All Seeing Robe-Ancient Sphinx-Animist-Anuran-Aphrodite's Heart: the Love Spell-Arcadian Master-Aristocrat Blue-Aristocrat Green-Aristocrat Purple-ArtChick-Ascetic-Astral Arcanist-Astral Potion-Astral Snail-Astrologer-Aura Wolf-Bag of Tricks-Banded Overall-Bard-Bengal Cat-Bernardo-Big Gross Eyeball-Bippadotta-Black-Black Mage-Black Wraith-Bliss Cat-Blue-Blue Big Buckle-Blue Coveralls-Blue Elven Cloak-Blue Hip Pouch-Blue Lined Coveralls -Blue Rat-Blue Wizard-Book of Magic-Botanic Master-BrainDrain-Brown Coveralls-Brown Harem Pants-Brown Tunic-Brown Wizard-Caduceus-Canaanite-Candle of Intuition-Cannabis Potion-Cape in the Wind-Card Magician-Celestial Sash-Chaos Staff-Charmer-Cheetah Print-Chroma Crystal-Claire Silver-Cloud Prophet-Corvid-Cosmic Arcanist-Cosmic Cardigan-Courage Staff-Coven Sister-Crackerjack Crow-Creol-Crone-Crystal Ball-Crystal Skull-Cyborg Skeleton Arcanist-Cyborg Skeleton Rogue-Dapper Arcanist-Dapper Formal-Dark Arcanist-Dark Sister-Darkling-Death Eater-Deeze-Deeze Body-Desert Wear-Dirt Rabbit-Diviner-Djinn-Double Sash-Dragon Fireworks-Dream Master-Dryad's Ear: the Plant Spell-Durm and Strang-Eastern Arcanist-Egg of Unknown Beast-Ember Frog-Emerald Slime-Emerald Staff-Empress-Enchantress-Eternal Rose-Ether Staff-Evil One-Fairy Glamour: the Dazzle Spell-Faustian-Felis-Field Dog-Fiskantes-Flaming Skull-Flesh Eating Plant-Floral Master-Forever Bat-Formal Suit-Fortune Seeker-Fox Trickster-Fungus-Fur Gnome-GFunk Head-Garnet Staff-Gfunk-Giant Ladybug-Goblet of Immortality-Gold Chain-Gold Skeleton-Golden Bull Staff-Golden Soul Reaper-Golden Toad-Golden Viper-Gorgon's Eye-Great Old One-Great Owl-Green-Green Asp-Green Big Buckle-Green Caped Traveller-Green Cloak-Green Coveralls-Green Elven Cloak-Green Hip Pouch-Green Hip Scarf-Green Lined Coveralls-Green Mantle Robe-Green Mushroom-Green Scholar-Green Wizard-Grey Tunic-Grim Reaper's Breath: the Death Spell-Gruffling-Guillaume's Broom-Hag-Harmony Staff-Headless-Hermit-Hobgoblin's Flame: the Wayward Spell-Houngan-Hue Master-Hunter-Huntress-Ice Robe-Illuminatus-Imp-Indigo Moon Staff-Isaac's Apple-Jester Diamonds-Jewled Hummingbird-Jinx Staff-Joey Billboard-Joy Staff-Kabuki -Kelpie's Fury: the Water Spell-Kelt-Kempo-Key of the 7th Realm-Kobold-Koopling-Labyrinthian-LeggoGreggo-Loki's Bridge: the Rainbow Spell-Loopify-Lucky Black Cat-Lucky Horseshoe-Lunar Staff-Lycanthrope-MachoMan-Mambo-Man Behind the Curtain-Mandinka-Mandrake Potion-Marlo-Master of Wood, Water, and Hill-Medicine Man-Merlin's Monkey-Mesozoic Cockatrice-Mug of Ale-Myrddin-Mystic Ice Cream-Nightshade Potion-None-Olympian-Onyx Wolf-Orange Caped Traveller-Orange Harem Pants-Orange Hip Scarf -Orange Scholar-Overcoat-Passion Potion-Peace Staff-Philosopher-Phoenix Feather-Phosphorus Spear-Pink Butterfly-Pink Cosmic-Pink Footed Crow-Plague Rat-Polar Shapeshifter-Poncho-Professor-Prometheus's Torch-Prophet-Psychic Rabbit-Pumpkin Head-Punjabi-Punker-Purple Caped Traveller-Purple Cloak-Purple Harem Pants-Purple Mantle Robe-Purple Wizard-Purple Yoga-Purple Yoga -Rain Toucan-Rainbow Suit-Red-Red Cleric-Red Coveralls-Red Hip Pouch-Red Mamba-Red Mushroom-Red Priestess-Red Suit-Red Wizard-Red Yoga-Robe of Shadow-Rogue Arcanist-Rose Yoga-Ruby Staff-Rune of Air-Rune of Brass-Rune of Brimstone-Rune of Cinnabar-Rune of Down-Rune of Earth-Rune of Fire-Rune of Infinity-Rune of Jupiter-Rune of Lime-Rune of Mars-Rune of Mercury-Rune of Neptune-Rune of Omega-Rune of Pluto-Rune of Saturn-Rune of Sigma-Rune of Steel-Rune of Sun-Rune of Up Only-Rune of Uranus-Rune of Venus-Rune of Water-Salamander's Tongue: the Fire Spell-Sandman-Sapphire Slime-Scholar-Seer-Shaman's Peyote-Shaolin-Shoulder Cape Green-Shoulder Cape Red-Silver Skeleton-Siren's Bell-Siren's Harp-Skeleton Flame-Skipper-Skramps-Skylord-Solar Staff-Soul Harvester-Space Chroma-Spandex  Dark-Spandex  Green-Sphinx's Hourglass-Staff-Stellar Staff-Stranger-Strongman-Sun Cat-SupaFly-Swamp Bullfrog-Swamp Witch-Swashbuckler-Swashbuckling Gear-Tech Coat-Tengu Preist-The Bone Stave-The Gnome's Tooth: the Earth Spell-The Mamba Stick-The Midas Rod-The Orb Staff-The World Egg-Thelemist-Thor's Wrath: the Lightning Spell-Topaz Slime-Trickster-Tundra Wear-Two Tone Fringe-Vamp-Vampyre-Vegetable-Venus Fly Trap-Vest Blue-Vest Green-Vile of Virgin's Blood-Warlock-Weird Wizz-WereBeast-White Coveralls-White Dog-White Tunic-White Wizard-White Wraith-Wicked Wizard-Wicker Wear-Wild Woman-Wildman-Witch-Wizard's Pipe-Wolfkin-Wooden Boy-Woodland Shapeshifter-Yellow Cleric-Yellow Elven Cloak-Yellow Wizard-Zephyr's Laugh: the Wind Spell-aff:Academic-aff:Alien-aff:Amber-aff:Anuran-aff:Ascetic-aff:Astral-aff:Astral Arcanist-aff:Astrologer-aff:Bard-aff:Bell-aff:Blackness-aff:Blood-aff:Blue Shift-aff:Bone-aff:Book-aff:Broom-aff:Brownish-aff:Buckle-aff:Caduceus-aff:Cardistry-aff:Cat-aff:Chemistry-aff:Claire-aff:Cold-aff:Cosmic-aff:Cosmic Arcanist-aff:Creol-aff:Crimson-aff:Cyan-aff:Dapper Arcanist-aff:Dark Arcanist-aff:Darkness-aff:Dazzling-aff:Death-aff:Deeze-aff:Desert-aff:Diviner-aff:Djinn-aff:Dream Master-aff:Durm and Strang-aff:Earth-aff:Electrification-aff:Enchantress-aff:Eyeball-aff:Feminine-aff:Fire-aff:Flame-aff:Flora-aff:Forest-aff:Formal-aff:Fortune Seeker-aff:Frog-aff:GFunk-aff:Goblet-aff:Gold-aff:Goofy-aff:Grey-aff:Hermit-aff:Hourglass-aff:Hue-aff:JB-aff:Jungle-aff:Key-aff:Koopling-aff:Light-aff:Loopify-aff:Love-aff:Lycanthrope-aff:MachoMan-aff:Mambo-aff:Man Behind the Curtain-aff:Masculine-aff:Medicine Man-aff:Monk-aff:Mountains-aff:Music-aff:Myrddin-aff:Nature-aff:Ocean-aff:Olympian-aff:Oracle-aff:Orange-aff:Orb-aff:Pirate-aff:Professor-aff:Prophet-aff:Punjabi-aff:Purple Haze-aff:Rainbow-aff:Rodent-aff:Rugged-aff:Sandman-aff:Scholar-aff:Sea-aff:Shaolin-aff:Skylord-aff:Slime-aff:Snake-aff:Sun-aff:Swamp-aff:Swashbuckler-aff:Thelema-aff:Time-aff:Torch-aff:Tundra-aff:Unique-aff:Urban-aff:Verdant-aff:Wand-aff:Warlock-aff:Warm-aff:Water Magic-aff:Were Beast-aff:White Magic-aff:Witch-aff:Wizzle-aff:Wizzy-aff:Wraith";

    event StoredTrait(uint256 wizardId, string name, bytes encodedTraits);

    constructor(
        bytes32 _rootTraits,
        bytes32 _rootNames,
        uint256 _traits_nr,
        address _tokenAddress,
        LostGrimoireStorage _storageContract
    ) {
        storageOwner = msg.sender;
        merkleRootTraitsTree = _rootTraits;
        merkleRootNamesTree = _rootNames;
        storageContract = _storageContract;
        tokenAddress = _tokenAddress;
        traits_nr = _traits_nr;
        traitNames = TRAIT_NAMES;
    }

    function storeTokenData(
        uint256 wizardId,
        string calldata tokenName,
        uint16[] calldata traits,
        bytes32[] calldata proofsName,
        bytes32[] calldata proofsTraits
    ) public override {
        require(
            traits.length == 8,
            "WizardStoragePlugin: provided trait list has invalid length"
        );
        require(
            traits[0] == wizardId,
            "WizardStoragePlugin: incoherent wizardId"
        );
        require(
            !storageContract.hasData(tokenAddress, wizardId),
            "WizardStoragePlugin: traits are already stored for wizard"
        );

        require(
            _verifyName(proofsName, wizardId, tokenName),
            "WizardStoragePlugin: Merkle Proof for name is invalid!"
        );

        bytes memory encodedTraits = _encode(
            traits[0],
            traits[1],
            traits[2],
            traits[3],
            traits[4],
            traits[5],
            traits[6],
            traits[7]
        );

        require(
            _verifyEncodedTraits(proofsTraits, encodedTraits),
            "WizardStoragePlugin: Merkle Proof for traits is invalid!"
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
            uint16 t5,
            uint16 t6
        ) = _decode(storageContract.getTokenTraits(tokenAddress, wizardId));

        uint16[] memory traitsList = new uint16[](7);
        traitsList[0] = t0;
        traitsList[1] = t1;
        traitsList[2] = t2;
        traitsList[3] = t3;
        traitsList[4] = t4;
        traitsList[5] = t5;
        traitsList[6] = t6;
        return traitsList;
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
        uint16 t5,
        uint16 t6
    ) internal pure returns (bytes memory) {
        bytes memory data = new bytes(18);

        assembly {
            mstore(add(data, 32), 32)

            mstore(add(data, 34), shl(240, id))
            mstore(add(data, 36), shl(240, t0))
            mstore(add(data, 38), shl(240, t1))
            mstore(add(data, 40), shl(240, t2))
            mstore(add(data, 42), shl(240, t3))
            mstore(add(data, 44), shl(240, t4))
            mstore(add(data, 46), shl(240, t5))
            mstore(add(data, 48), shl(240, t6))
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
            uint16 t5,
            uint16 t6
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
            t6 := mload(add(data, 18))
        }
    }
}
