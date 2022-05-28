import { network } from "hardhat";
const hre = require("hardhat");

export const switchNetwork = async (
  name: string,
): Promise<any> => {
    hre.changeNetwork(name);
};