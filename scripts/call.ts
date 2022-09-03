import {deployContract} from "../helpers/deploy"
import { getAccount } from "../helpers/accounts";
import {switchNetwork} from "./utils/switchNetwork"
import { BigNumber, Contract } from "ethers";
import { ethers } from "hardhat";

import { AbiCoder } from "ethers/lib/utils";

const sender = "rinkeby"
const receiver = "optKovan"
const senderDomain = 10001
const receiverDomain = 10011


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
let grimoireAddress = "0xddc5d16279525b695810d3cd490fb11ff32ed76d"
let tavernAddress = "0x88c0b1d9523fd7c8f225d57067cb709a2c648e67"
let questsAddress = "0x8ec194ace6a43a40e62fa96043aced08e25a0bc8"


export async function run(){


  let account = await getAccount(process.env.DEPLOYER_ADDRESS);

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

  


  console.log(await quests.getNrQuests())
  console.log(await quests.getQuest(1))
  console.log(await quests.isInitialized())
  //await quests.createQuest({gasLimit:500000})


  }

run()
.then(() => console.log("Ok"))
.catch(error => {
    console.error(error);
    process.exit(1);
});
