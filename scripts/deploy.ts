import {deployContract} from "../helpers/deploy"
import {switchNetwork} from "./utils/switchNetwork"

const sender = "rinkeby"
const receiver = "goerli"
const senderDomain = 1111
const receiverDomain = 3331
const senderConnextHandler = "0x4cAA6358a3d9d1906B5DABDE60A626AAfD80186F"
const receiverConnextHandler = "0x6c9a905Ab3f4495E2b47f5cA131ab71281E0546e"
const senderDummyToken = "0x3FFc03F05D1869f493c7dbf913E636C6280e0ff9"
const receiverDummyToken = "0x26FE8a8f86511d678d031a022E48FfF41c6a3e3b"

export async function deployContracts(){

    console.log(`\n --- DEPLOY ---`);

    switchNetwork(sender)
    console.log(`\nConnected to: ${sender}`)

    const qt1 = await deployContract('QuantumTunnelSender', [senderConnextHandler,senderDomain,senderDummyToken]);
    console.log(`QuantumTunnelSender deployed to: ${qt1.address.toLowerCase()}`);

    const t1 = await deployContract('L1TokenMock', ["ipfs://QmfUgAKioFE8taS41a2XEjYFrkbfpVyXYRt7c6iqTZVy9G/"]);
    console.log(`L1TokenMock deployed to: ${t1.address.toLowerCase()}`);

    
    switchNetwork(receiver)
    console.log(`\nConnected to: ${receiver}`)

    const qt2 = await deployContract('QuantumTunnelReceiver', [receiverConnextHandler, receiverDomain, senderDomain, receiverDummyToken]);
    console.log(`QuantumTunnelReceiver deployed to: ${qt2.address.toLowerCase()}`);

    const t2 = await deployContract('BridgedERC721', ["ipfs://QmfUgAKioFE8taS41a2XEjYFrkbfpVyXYRt7c6iqTZVy9G/", t1.address, senderDomain]);
    console.log(`BridgedERC721 deployed to: ${t2.address.toLowerCase()}`);

    console.log(`\n`)
    console.log(`npx hardhat verify --network ${sender} ${qt1.address.toLowerCase()} ${senderConnextHandler} ${senderDomain} ${senderDummyToken}`);
    console.log(`npx hardhat verify --network ${sender} ${t1.address.toLowerCase()} ipfs://QmfUgAKioFE8taS41a2XEjYFrkbfpVyXYRt7c6iqTZVy9G/`);
    console.log(`npx hardhat verify --network ${receiver} ${qt2.address.toLowerCase()} ${receiverConnextHandler} ${receiverDomain} ${senderDomain} ${receiverDummyToken}`);
    console.log(`npx hardhat verify --network ${receiver} ${t2.address.toLowerCase()} ipfs://QmfUgAKioFE8taS41a2XEjYFrkbfpVyXYRt7c6iqTZVy9G/ ${t1.address} ${senderDomain}`);

    console.log(`\n --- SETUP ---`);

    switchNetwork(sender)
    console.log(`\nConnected to: ${sender}`)
    await qt1.enableToken(t1.address);
    await qt1.setDestinationReceiver(receiverDomain, qt2.address);

    switchNetwork(receiver)
    console.log(`\nConnected to: ${receiver}`)
    await qt2.mapContract(t1.address,t2.address);
    await qt2.setOriginContract(qt1.address);
    await t2.setMinter(qt2.address)

  }

deployContracts()
.then(() => console.log("Ok"))
.catch(error => {
    console.error(error);
    process.exit(1);
});
