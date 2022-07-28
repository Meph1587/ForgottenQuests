//SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.15;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./AbstractPlugin.sol";

contract LostGrimoire is Ownable {
    mapping(address => address) plugins;
    address[] allPlugins;

    function addPlugin(address token, address plugin) public onlyOwner {
        plugins[token] = plugin;
        allPlugins.push(plugin);
    }

    function removePlugin(address token) public onlyOwner {
        address plugin = plugins[token];
        uint256 index = 0;
        for (uint8 i = 0; i < allPlugins.length; i++) {
            if (allPlugins[i] == plugin) {
                index = i;
                break;
            }
        }
        for (uint256 i = index; i < allPlugins.length - 1; i++) {
            allPlugins[i] = allPlugins[i + 1];
        }
        delete allPlugins[allPlugins.length - 1];
        allPlugins.pop();

        plugins[token] = address(0);
    }

    function getPlugin(address token) public view returns (AbstractPlugin) {
        return AbstractPlugin(plugins[token]);
    }
}
