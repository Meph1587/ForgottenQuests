import {deployContract} from "../helpers/deploy"


import {QuantumTunnelL1} from "../typechain";
export async function deployContracts(){
    console.log(`\n --- DEPLOY ---`);

    const contract= await deployContract('QuantumTunnelL1', ["0x2307Ed9f152FA9b3DcDfe2385d279D8C2A9DF2b0",1111,"0x3FFc03F05D1869f493c7dbf913E636C6280e0ff9"]);
    console.log(`QuantumTunnelL1 deployed to: ${contract.address.toLowerCase()}`);
    console.log(`npx hardhat verify --network kovan ${contract.address.toLowerCase()} 0x2307Ed9f152FA9b3DcDfe2385d279D8C2A9DF2b0 1111 0x3FFc03F05D1869f493c7dbf913E636C6280e0ff9`);

    const token = await deployContract('L1Token', ["ipfs://QmfUgAKioFE8taS41a2XEjYFrkbfpVyXYRt7c6iqTZVy9G/"]);
    console.log(`L1Token deployed to: ${token.address.toLowerCase()}`);
    console.log(`npx hardhat verify --network kovan ${token.address.toLowerCase()} ipfs://QmfUgAKioFE8taS41a2XEjYFrkbfpVyXYRt7c6iqTZVy9G/`);

    await contract.enableToken(token.address);

}

deployContracts()
.then(() => console.log("Ok"))
.catch(error => {
    console.error(error);
    process.exit(1);
});


