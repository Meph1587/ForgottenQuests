import {deployContract} from "../helpers/deploy"

export async function deployContracts(){
    console.log(`\n --- DEPLOY ---`);

    const contract = await deployContract('QuantumTunnelL2', ["0x3366A61A701FA84A86448225471Ec53c5c4ad49f", 1111 ]);
    console.log(`QuantumTunnelL2 deployed to: ${contract.address.toLowerCase()}`);
    console.log(`npx hardhat verify --network kovan ${contract.address.toLowerCase()} 0x3366A61A701FA84A86448225471Ec53c5c4ad49f 1111 `);

    const token = await deployContract('L2Token', ["ipfs://QmfUgAKioFE8taS41a2XEjYFrkbfpVyXYRt7c6iqTZVy9G/"]);
    console.log(`L2Token deployed to: ${token.address.toLowerCase()}`);
    console.log(`npx hardhat verify --network kovan ${token.address.toLowerCase()} ipfs://QmfUgAKioFE8taS41a2XEjYFrkbfpVyXYRt7c6iqTZVy9G/`);

}

deployContracts()
.then(() => console.log("Ok"))
.catch(error => {
    console.error(error);
    process.exit(1);
});


