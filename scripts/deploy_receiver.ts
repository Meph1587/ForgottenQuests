import {deployContract} from "../helpers/deploy"

export async function deployContracts(){
    console.log(`\n --- DEPLOY ---`);

    const contract= await deployContract('QuantumTunnelL2', [2221,"0x979588965099F4DEA3CAd850d67ca3356284591e"]);
    console.log(`QuantumTunnelL2 deployed to: ${contract.address.toLowerCase()}`);
    console.log(`npx hardhat verify --network rinkeby ${contract.address.toLowerCase()} 2221 0x979588965099F4DEA3CAd850d67ca3356284591e`);

    // const token = await deployContract('L2Token');
    // console.log(`L2Token deployed to: ${token.address.toLowerCase()}`);
    // console.log(`npx hardhat verify --network rinkeby ${token.address.toLowerCase()}`);

}

deployContracts()
.then(() => console.log("Ok"))
.catch(error => {
    console.error(error);
    process.exit(1);
});


