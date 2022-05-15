import {deployContract} from "../helpers/deploy"

export async function deployContracts(){
    console.log(`\n --- DEPLOY ---`);

    const contract = await deployContract('Receiver',["0x17964a78056363c940bf08fb25cdb3a9793cf7fd",2221, "0x979588965099F4DEA3CAd850d67ca3356284591e"]);
    console.log(`Receiver deployed to: ${contract.address.toLowerCase()}`);

}

deployContracts()
.then(() => console.log("Ok"))
.catch(error => {
    console.error(error);
    process.exit(1);
});


