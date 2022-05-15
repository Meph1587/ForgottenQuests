import {
    Sender,
} from "../typechain";
import {Contract} from "ethers";
import {getAccount} from "../helpers/accounts";
let SenderABI = require("../abi/Sender.json");


async function update(){

    console.log(`\n --- UPDATE ---`);

    let sender = new Contract(
        "0x80a356966dd35c69778aba56ac14df6eacdda757",
        SenderABI,
        await getAccount(process.env.DEPLOYER_ADDRESS)
    ) 

    console.log(`\n --- CALLING ---`);

    let tx = await sender.update(
        "0xD081B0dBc7c7301238f635c6dA9cfAfb32d1C35C", // Receiver
        "0xB7b1d3cC52E658922b2aF00c5729001ceA98142C", // TestERC20
        1111, // rinkeby
        2221, // kovan
        93, // new Value
        {gasLimit: 30000000}
    )
    console.log(`Tx hash: ${tx.hash}`)

    await tx.wait()
}

update().then(() => console.log("OK"))