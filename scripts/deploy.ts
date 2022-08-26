import {deployContract} from "../helpers/deploy"
import {switchNetwork} from "./utils/switchNetwork"
import { BigNumber, Contract } from "ethers";
import { getAccount } from "../helpers/accounts";

import * as merkle from "../helpers/merkletree";


const wizardsToTraits = require("../data/wizards.json");

const l1 = "rinkeby"
const l2 = "arbitrum"
const l1Domain = 10001
const l2Domain = 10010
const l1Endpoint = "0x79a63d6d8BBD5c6dfc774dA79bCcD948EAcb53FA"
const l2Endpoint = "0x4D747149A57923Beb89f22E6B7B97f7D8c087A00"
const l1GemUrl = "ipfs://QmebNYy9k7JFzofbYa6d7hr5AWYaPqtwqTjHe6gk2BBRm1/"
const l2GemUrl = "ipfs://QmWG5jc3spgFGPfiX3Rd4YLNSxDjXRSxeBQsS9TytVL1YD"
const l1WizUrl = "ipfs://QmfUgAKioFE8taS41a2XEjYFrkbfpVyXYRt7c6iqTZVy9G/"
const l2WizUrl = "ipfs://QmfUgAKioFE8taS41a2XEjYFrkbfpVyXYRt7c6iqTZVy9G/"

let qt1;
let l1Gems;
let l1Wiz;
let qt2;
let rm;
let random;
let l2Gems;
let l2Wiz;
let storage;
let plugin;
let grimoire;
let tavern;
let quests;

let qt1Abi = require("../artifacts/contracts/xchain/QuantumTunnelL1.sol/QuantumTunnelL1.json");
let l1GemsAbi = require("../artifacts/contracts/tokens/L1/L1SoulGems.sol/L1SoulGems.json");
let l1WizAbi = require("../artifacts/contracts/mocks/NFTMock.sol/NFTMock.json");
let qt2Abi = require("../artifacts/contracts/xchain/QuantumTunnelL2.sol/QuantumTunnelL2.json");
let rmAbi = require("../artifacts/contracts/xchain/RewardsManager.sol/RewardsManager.json");
let randomAbi = require("../artifacts/contracts/utils/GlobalRandom.sol/GlobalRandom.json");
let l2GemsAbi = require("../artifacts/contracts/tokens/L2/L2SoulGems.sol/SoulGems.json");
let l2WizAbi = require("../artifacts/contracts/tokens/L2/AltWizards.sol/AltWizards.json");
let storageAbi = require("../artifacts/contracts/storage/LostGrimoireStorage.sol/LostGrimoireStorage.json");
let pluginAbi = require("../artifacts/contracts/storage/WizardStoragePlugin.sol/WizardStoragePlugin.json");
let grimoireAbi = require("../artifacts/contracts/storage/LostGrimoire.sol/LostGrimoire.json");
let questsAbi = require("../artifacts/contracts/quests/BaseQuest.sol/BaseQuest.json");
let tavernAbi = require("../artifacts/contracts/quests/JollyTavern.sol/JollyTavern.json");

let qt1Address = "0x88c0b1d9523fd7c8f225d57067cb709a2c648e67"
let l1GemsAddress = "0xc8ac645fb4efccfaf8761ae2a1f9770b441cc3a6"
let l1WizAddress = "0x5ffb41ccafb6d7c50b9b077f117e62d51227580c"
let qt2Address = "0x286faa336d2519a804034e99794ea584a85e08c4"
let rmAddress = "0x96ebab5455044c56ed7e870c03704d2cf8e9de38"
let randomAddress = "0x13c4b5f74e5fe9109891f573577df07d5ad467d4"
let l2GemsAddress = "0x658fb2bc9f9a450e6f94cc9239cb2b04a326b263"
let l2WizAddress = "0x50c9d2bfd88e243297c610b73f5b5ad55882e49a"
let storageAddress = "0x6c36529fbe328b5dd2afce4438fc6f34f2b51cbd"
let pluginAddress = "0xf522a2ae2b8d863e4d39cf98d8f5f1e06e3d174b"
let grimoireAddress = "0xe864ae6028d9b6f8aa72536b172aa00190cb040e"
let tavernAddress = "0x88c0b1d9523fd7c8f225d57067cb709a2c648e67"
let questsAddress = "0xc8ac645fb4efccfaf8761ae2a1f9770b441cc3a6"

export async function deployContracts(){

    console.log(`\n ----  DEPLOY  ----`);

    // console.log(`\n --- L1 ---`);
    // await switchNetwork(l1)

    // qt1 = await deployContract('QuantumTunnelL1', [l1Endpoint]);
    // qt1Address = qt1.address;
    // console.log(`QuantumTunnelL1 deployed to: ${qt1.address.toLowerCase()}`);
    // console.log(`npx hardhat verify --network ${l1} ${qt1.address.toLowerCase()} ${l1Endpoint.toLowerCase()}`);

    // l1Gems = (await deployContract('L1SoulGems', [l1GemUrl]));
    // l1GemsAddress = l1Gems.address;
    // console.log(`L1SoulGem deployed to: ${l1Gems.address.toLowerCase()}`);
    // console.log(`npx hardhat verify --network ${l1} ${l1Gems.address.toLowerCase()} ${l1GemUrl}`);

    // l1Wiz = (await deployContract('NFTMock', [l1WizUrl]));
    // l1WizAddress = qt1.address;
    // console.log(`NFTMock deployed to: ${l1Wiz.address.toLowerCase()}`);
    // console.log(`npx hardhat verify --network ${l1} ${l1Wiz.address.toLowerCase()} ${l1WizUrl}`);


    // console.log(`\n --- L2 ---`);
    // await switchNetwork(l2)

    // qt2 = await deployContract('QuantumTunnelL2', [l2Endpoint, l1Domain]);
    // qt2Address = qt2.address;
    // console.log(`QuantumTunnelL2 deployed to: ${qt2.address.toLowerCase()}`);
    // console.log(`npx hardhat verify --network ${l2} ${qt2.address.toLowerCase()} ${l2Endpoint.toLowerCase()} ${l1Domain}`);

    // rm = (await deployContract('RewardsManager', [qt2Address]));
    // rmAddress = rm.address;
    // console.log(`RewardsManager deployed to: ${rm.address.toLowerCase()}`);
    // console.log(`npx hardhat verify --network ${l2} ${rm.address.toLowerCase()} ${qt2Address.toLowerCase()}`);

    // random = (await deployContract('GlobalRandom'));
    // randomAddress = random.address;
    // console.log(`GlobalRandom deployed to: ${random.address.toLowerCase()}`);
    // console.log(`npx hardhat verify --network ${l2} ${random.address.toLowerCase()} ${l2Endpoint.toLowerCase()}`);
    
    // l2Gems = (await deployContract('SoulGems', [l2GemUrl, randomAddress]));
    // l2GemsAddress = l2Gems.address;
    // console.log(`SoulGems deployed to: ${l2Gems.address.toLowerCase()}`);
    // console.log(`npx hardhat verify --network ${l2} ${l2Gems.address.toLowerCase()} ${l1GemUrl}  ${randomAddress.toLowerCase()}`);

    // l2Wiz = (await deployContract('AltWizards', [l2WizUrl, l1WizAddress, l1Domain]));
    // l2WizAddress = l2Wiz.address;
    // console.log(`AltWizards deployed to: ${l2Wiz.address.toLowerCase()}`);
    // console.log(`npx hardhat verify --network ${l2} ${l2Wiz.address.toLowerCase()} ${l1GemUrl}  ${l1Domain} ${l1WizAddress.toLowerCase()}`);

    // storage = (await deployContract('LostGrimoireStorage'));
    // storageAddress = storage.address;
    // console.log(`LostGrimoireStorage deployed to: ${storage.address.toLowerCase()}`);
    // console.log(`npx hardhat verify --network ${l2} ${storage.address.toLowerCase()}`);

    // let treeTraits = await merkle.makeTreeFromTraits(wizardsToTraits.traits);
    // let treeNames = await merkle.makeTreeFromNames( wizardsToTraits.names);
    // plugin = (await deployContract('WizardStoragePlugin', [treeTraits.getHexRoot(), treeNames.getHexRoot(), 627, l2WizAddress, storageAddress]));
    // pluginAddress = plugin.address;
    // console.log(`WizardStoragePlugin deployed to: ${plugin.address.toLowerCase()}`);
    // console.log(`npx hardhat verify --network ${l2} ${plugin.address.toLowerCase()} ${treeTraits.getHexRoot()} ${treeNames.getHexRoot()} ${627} ${l2WizAddress.toLowerCase()} ${storageAddress.toLowerCase()}`);

    // grimoire = (await deployContract('LostGrimoire',[randomAddress])) ;
    // grimoireAddress = grimoire.address;
    // console.log(`LostGrimoire deployed to: ${grimoire.address.toLowerCase()}`);
    // console.log(`npx hardhat verify --network ${l2} ${grimoire.address.toLowerCase()} ${randomAddress.toLowerCase()}`);

    // tavern = (await deployContract('JollyTavern', [l2GemsAddress])) ;
    // tavernAddress = tavern.address;
    // console.log(`JollyTavern deployed to: ${tavern.address.toLowerCase()}`);
    // console.log(`npx hardhat verify --network ${l2} ${tavern.address.toLowerCase()} ${l2GemsAddress.toLowerCase()}`);

    // quests = (await deployContract('BaseQuest')) ;
    // questsAddress = quests.address;
    // console.log(`BaseQuest deployed to: ${quests.address.toLowerCase()}`);
    // console.log(`npx hardhat verify --network ${l2} ${quests.address.toLowerCase()}`);


    console.log(`\n ----  SETUP  ----`);

    let account = await getAccount(process.env.DEPLOYER_ADDRESS);


    console.log(`\n --- L1 ---`);
    await switchNetwork(l1)

    qt1 = new Contract(
      qt1Address,
      qt1Abi["abi"],
      account
    ) as Contract;

    l1Gems = new Contract(
      l1GemsAddress,
      l1GemsAbi["abi"],
      account
    ) as Contract;

    // await qt1.setTrustedRemote(l2Domain, qt2Address);
    // console.log(`\n ok`);
    // await qt1.setDestinationReceiver(l2Domain, qt2Address);
    // console.log(`\n ok`);
    // await qt1.enableToken(l1WizAddress);
    // console.log(`\n ok`);
    // await qt1.setBridgeMintableNFT(0, l1GemsAddress);
    // console.log(`\n ok`);
    // console.log(`\n qt1 setup`);

    // await l1Gems.setMinter(qt1Address)
    // console.log(`\n ok`);
    // console.log(`\n l1Gems setup`);



    console.log(`\n --- L2 ---`);
    await switchNetwork(l2)

    qt2 = new Contract(
      qt2Address,
      qt2Abi["abi"],
      account
    ) as Contract;

    rm = new Contract(
      rmAddress,
      rmAbi["abi"],
      account
    ) as Contract;

    l2Gems = new Contract(
      l2GemsAddress,
      l2GemsAbi["abi"],
      account
    ) as Contract;

    l2Wiz = new Contract(
      l2WizAddress,
      l2WizAbi["abi"],
      account
    ) as Contract;

    storage = new Contract(
      storageAddress,
      storageAbi["abi"],
      account
    ) as Contract;

    grimoire = new Contract(
      grimoireAddress,
      grimoireAbi["abi"],
      account
    ) as Contract;

    tavern = new Contract(
      tavernAddress,
      tavernAbi["abi"],
      account
    ) as Contract;

    quests = new Contract(
      questsAddress,
      questsAbi["abi"],
      account
    ) as Contract;

    // await qt2.mapContract(l1WizAddress, l2WizAddress);
    // console.log(`\n ok`);
    // await qt2.setTrustedRemote(l1Domain, qt1Address);
    // console.log(`\n ok`);
    // await qt2.setL1QuantumTunnel(qt1Address);
    // console.log(`\n ok`);
    // await qt2.setRewardsManager(rmAddress);
    // console.log(`\n ok`);
    // console.log(`\n qt2 setup`);

    // await rm.addRewardToken(l1GemsAddress, l2GemsAddress)
    // console.log(`\n ok`);
    // console.log(`\n rm setup`);

    // await l2Gems.setMinter(tavernAddress, true)
    // console.log(`\n ok`);
    // await l2Gems.setAllowedTokens(l2WizAddress, true)
    // console.log(`\n ok`);
    // console.log(`\n l2Gems setup`);

    // await l2Wiz.setMinter(qt2Address, true);
    // console.log(`\n ok`);
    // await l2Wiz.setBridge(qt2Address, true);
    // console.log(`\n ok`);
    // console.log(`\n l2Wiz setup`);

    // await storage.setAllowedWriter(pluginAddress,true)
    // console.log(`\n ok`);
    // console.log(`\n storage setup`);

    // await grimoire.addPlugin(l2WizAddress, pluginAddress)
    // console.log(`\n ok`);
    // await grimoire.setTokenWeights([l2WizAddress], [100])
    // console.log(`\n ok`);
    // console.log(`\n grimoire setup`);

    // await tavern.setQuestLoop(questsAddress, true);
    // console.log(`\n ok`);
    // console.log(`\n tavern setup`);

    // await quests.initialize(
    //   3600,
    //   7200,
    //   600,
    //   3,
    //   2,
    //   grimoireAddress,
    //   tavernAddress
    // );
    // console.log(`\n ok`);
    // console.log(`\n quests setup`);
}

deployContracts()
.then(() => console.log("Ok"))
.catch(error => {
    console.error(error);
    process.exit(1);
});
