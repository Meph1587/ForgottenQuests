import {deployContract} from "../helpers/deploy"

export async function deployContracts(){
    console.log(`\n --- DEPLOY ---`);

    const contract = await deployContract('Sender');//,["0x979588965099F4DEA3CAd850d67ca3356284591e"]);
    console.log(`Sender deployed to: ${contract.address.toLowerCase()}`);

}

deployContracts()
.then(() => console.log("Ok"))
.catch(error => {
    console.error(error);
    process.exit(1);
});


