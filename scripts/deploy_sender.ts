import {deployContract} from "../helpers/deploy"


import {QuantumTunnelL1} from "../typechain";
export async function deployContracts(){
    console.log(`\n --- DEPLOY ---`);

    const contract= await deployContract('QuantumTunnelL1', ["0x71a52104739064bc35bED4Fc3ba8D9Fb2a84767f",2221,"0xB5AabB55385bfBe31D627E2A717a7B189ddA4F8F"]);
    console.log(`QuantumTunnelL1 deployed to: ${contract.address.toLowerCase()}`);
    console.log(`npx hardhat verify --network kovan ${contract.address.toLowerCase()} 0x71a52104739064bc35bED4Fc3ba8D9Fb2a84767f 2221 0xB5AabB55385bfBe31D627E2A717a7B189ddA4F8F`);

    const token = await deployContract('L1Token');
    console.log(`L1Token deployed to: ${token.address.toLowerCase()}`);
    console.log(`npx hardhat verify --network kovan ${token.address.toLowerCase()}`);

    await contract.enableToken(token.address);

}

deployContracts()
.then(() => console.log("Ok"))
.catch(error => {
    console.error(error);
    process.exit(1);
});


