import {deployContract} from "../helpers/deploy"
import {switchNetwork} from "./utils/switchNetwork"

const sender = "rinkeby"
const receiver = "optKovan"
const senderDomain = 10001
const receiverDomain = 10011

export async function deployContracts(){

    console.log(`\n --- DEPLOY ---`);

    switchNetwork(sender)
    console.log(`\nConnected to: ${sender}`)

    const qt1 = await deployContract('OmniCounter');
    console.log(`QuantumTunnelSender deployed to: ${qt1.address.toLowerCase()}`);

    
    switchNetwork(receiver)
    console.log(`\nConnected to: ${receiver}`)

    const qt2 = await deployContract('OmniCounterL2');
    console.log(`QuantumTunnelReceiver deployed to: ${qt2.address.toLowerCase()}`);

   
    console.log(`\n`)
    console.log(`npx hardhat verify --network ${sender} ${qt1.address.toLowerCase()} `);
    console.log(`npx hardhat verify --network ${receiver} ${qt2.address.toLowerCase()} `);
  
    console.log(`\n --- SETUP ---`);

    switchNetwork(sender)
    console.log(`\nConnected to: ${sender}`)
    await qt1.setTrustedRemote(receiverDomain, qt2.address);

    switchNetwork(receiver)
    console.log(`\nConnected to: ${receiver}`)
    await qt2.setTrustedRemote(senderDomain,qt1.address);

  }

deployContracts()
.then(() => console.log("Ok"))
.catch(error => {
    console.error(error);
    process.exit(1);
});
