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

let qt1Address = "0x5e0f60ee176c268bebb67e3dca191c11275aa36b"
let l1GemsAddress = "0x124b8c34c34a1691bcf49a83c91e8a51c462ba66"
let l1WizAddress = "0xdc15dd7e092d9e195ab6c03cbeb3f7d1afa082f1"
let qt2Address = "0xb12bb899ca6de03ed0149e0cbf851633608c1e03"
let rmAddress = "0xc44f170c442caebb5cbdb8be377f2f9490d36108"
let randomAddress = "0x868c7630fd69ca19c4e1923c944ee7e83336fea1"
let l2GemsAddress = "0xf1b1aa31b9d6e4b0d2ccefc75e610a972dfa4d1d"
let l2WizAddress = "0xc1a8fd912c2fc45255ddf3aa3deb25af0023f549"
let storageAddress = "0xef7aaf4f05a5ebf46c9357325c6a004698a13b4a"
let pluginAddress = "0x7614bfa46cfc3b158c1804e76d2e7001e07d0412"
let grimoireAddress = "0xc543cc078bcae4f5320539841ad45a36468fff8d"
let tavernAddress = "0x3d5cacf72b9675905d042fe668a0568c2ab79a69"
let questsAddress = "0x95e686f1103c7547ddc250ae45e75f5642b2ce54"


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
  console.log(await quests.isInitialized())
  //await quests.createQuest({gasLimit:500000})


  }

run()
.then(() => console.log("Ok"))
.catch(error => {
    console.error(error);
    process.exit(1);
});
