import {deployContract} from "../helpers/deploy"
import { getAccount } from "../helpers/accounts";
import {switchNetwork} from "./utils/switchNetwork"
import { BigNumber, Contract } from "ethers";

import { OmniCounter, OmniCounterL2 } from "../typechain";
import { AbiCoder } from "ethers/lib/utils";

const sender = "rinkeby"
const receiver = "optKovan"
const senderDomain = 10001
const receiverDomain = 10011

let abi1 = require("../artifacts/contracts/xchain/LzQuantumTunnelL1.sol/OmniCounter.json");
let abi2 = require("../artifacts/contracts/xchain/LzQuantumTunnelL2.sol/OmniCounterL2.json");

export async function run(){

    console.log(`\n --- CALL ---`);

    let account = await getAccount("0x28c52701ECb85112a03B184a038Fc1367c3886Fb");

    let qt1 = new Contract(
      "0x5b55b645aa3d9b3bc15fef9255504b9f1b2d2e9f",
      abi1["abi"],
      account
    ) as OmniCounter;

    let qt2 = new Contract(
      "0xcbab1168f3a4403dbd1e7fe74f0324b7c48a25e0",
      abi2["abi"],
      account
    ) as OmniCounter;
  
    // switchNetwork(sender)
    // console.log(`\nConnected to: ${sender}`)

    // console.log( await qt1.counter())
    // console.log( await qt1.receivedData())


    // await qt1.incrementCounter("0xcbab1168f3a4403dbd1e7fe74f0324b7c48a25e0", 94)

    
    switchNetwork(receiver)
    console.log(`\nConnected to: ${receiver}`)


    console.log( (await qt2.counter()).toNumber())
    console.log( await qt2.receivedData())

    let data = (new AbiCoder()).encode(["string"], ["93"])

    await qt2.incrementCounter("0x5b55b645aa3d9b3bc15fef9255504b9f1b2d2e9f", data, {value: BigNumber.from(5000000000000000)})



  }

run()
.then(() => console.log("Ok"))
.catch(error => {
    console.error(error);
    process.exit(1);
});
