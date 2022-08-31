import * as deploy from "../../helpers/deploy";
import * as chain from "../../helpers/chain";
import { expect } from "chai";
import { WizardStoragePlugin, AltWizards, LostGrimoireStorage, LostGrimoire, GlobalRandom} from "../../typechain";

import * as merkle from "../../helpers/merkletree";

import { ethers } from 'hardhat';
import { BigNumber, Contract, Signer } from 'ethers';

const wizardsToTraits = require("../../data/wizards.json");


describe("LostGrimoire", function () {

    let user: Signer ;
    let user2: Signer ;
    let userAddress: string;
    let user2Address: string;

    let plugin: WizardStoragePlugin;
    let plugin2: WizardStoragePlugin;
    let token: AltWizards;
    let token2: AltWizards;
    let storage: LostGrimoireStorage;
    let grimoire : LostGrimoire;
    let random : GlobalRandom;
    let traitsForWizards: number[][];
    let treeTraits: any;
    let treeNames: any;
    let snapshotId: any;

    let nrTraits = 627;

    beforeEach(async () => {

        user = (await ethers.getSigners())[0]
        user2 = (await ethers.getSigners())[1]
        userAddress = await user.getAddress();
        user2Address = await user2.getAddress();

        token = (await deploy.deployContract('AltWizards', ["", chain.testAddress, 0])) as unknown as AltWizards;
        token2 = (await deploy.deployContract('AltWizards', ["", chain.testAddress, 0])) as unknown as AltWizards;
        storage = (await deploy.deployContract('LostGrimoireStorage')) as unknown as LostGrimoireStorage;
        random = (await deploy.deployContract('GlobalRandom')) as unknown as GlobalRandom;
        grimoire = (await deploy.deployContract('LostGrimoire',[random.address])) as unknown as LostGrimoire;

        traitsForWizards = wizardsToTraits.traits;
        treeTraits = await merkle.makeTreeFromTraits(traitsForWizards);
        treeNames = await merkle.makeTreeFromNames( wizardsToTraits.names);
        plugin = (await deploy.deployContract('WizardStoragePlugin', [treeTraits.getHexRoot(), treeNames.getHexRoot(),nrTraits, token.address, storage.address]))  as unknown as WizardStoragePlugin;

        plugin2 = (await deploy.deployContract('WizardStoragePlugin', [treeTraits.getHexRoot(), treeNames.getHexRoot(),nrTraits, token2.address, storage.address]))  as unknown as WizardStoragePlugin;

        await storage.setAllowedWriter(plugin.address,true)

        await grimoire.setLocations(await grimoire.locations(), 53);

        let wizardId = 6725;
        let wizardTraits = [6725,0,28,110,190,332,288,341];
        let wizardName = ["6725", "Ghost Eater Bathsheba of the Toadstools"];

        let validProofTraits =  merkle.getProofForTraits(wizardTraits)
        let validProofName =   merkle.getProofForName(wizardName)

        await plugin.storeTokenData(
            wizardId, 
            wizardName[1], 
            wizardTraits, 
            validProofName, 
            validProofTraits
        )
        
    });

    describe('General tests', function () {
        it('should be deployed', async function () {
            expect(plugin.address).to.not.equal(0);
        });
    });

    describe("Plugins", function () {
        it("let's owner add a new plugin", async function () {
            await grimoire.addPlugin(token.address, plugin.address)
            expect(await grimoire.getPlugin(token.address)).to.equal(plugin.address);
            expect(await grimoire.allPlugins(0)).to.equal(plugin.address);
        });  

        it("does not let non-owner add a new plugin", async function () {
            await expect(
                grimoire.connect(user2).addPlugin(token.address, plugin.address)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });  

        it("let's owner remove a plugin", async function () {
            await grimoire.addPlugin(token.address, plugin.address)
            expect(await grimoire.getPlugin(token.address)).to.equal(plugin.address);
            expect(await grimoire.allPlugins(0)).to.equal(plugin.address);


            await grimoire.removePlugin(token.address)
            expect(await grimoire.getPlugin(token.address)).to.equal(chain.zeroAddress);
            await expect(grimoire.allPlugins(0)).to.be.reverted
        });
        
        it("does not let non-owner remove a plugin", async function () {
            await grimoire.addPlugin(token.address, plugin.address)

            await expect(
                grimoire.connect(user2).removePlugin(token.address)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("removes a plugin correctly from array", async function () {
            await grimoire.addPlugin(token.address, plugin.address)
            await grimoire.addPlugin(token2.address, plugin2.address)

            await grimoire.removePlugin(token.address)
            expect(await grimoire.getPlugin(token.address)).to.equal(chain.zeroAddress);
            //second plugin now at position 0
            expect(await grimoire.allPlugins(0)).to.equal(plugin2.address);
            await expect(grimoire.allPlugins(1)).to.be.reverted

            await grimoire.addPlugin(token.address, plugin.address)
            await grimoire.removePlugin(token.address)

            // plugin now at position 0
            expect(await grimoire.allPlugins(0)).to.equal(plugin2.address);

        });

        it("does not duplicate plugin in array", async function () {
            await grimoire.addPlugin(token.address, plugin.address)
            await grimoire.addPlugin(token.address, plugin2.address)

            expect(await grimoire.getPlugin(token.address)).to.equal(plugin2.address);
            // plugin now still position 0
            expect(await grimoire.allPlugins(0)).to.equal(plugin2.address);
            await expect(grimoire.allPlugins(1)).to.be.reverted
        });
    });

    describe("Token Weight", function () {

        beforeEach(async function () {
            await grimoire.addPlugin(token.address, plugin.address)

        })
        it("let's owner set token weights", async function () {
            await grimoire.setTokenWeights([token.address], [100])
            expect(await grimoire.totalWeight()).to.equal(100);
            expect(await grimoire.tokenWeights(token.address)).to.equal(100);

            await grimoire.addPlugin(token2.address, plugin2.address)

            await grimoire.setTokenWeights([token.address,token2.address], [100,100])
            expect(await grimoire.totalWeight()).to.equal(200);
            expect(await grimoire.tokenWeights(token2.address)).to.equal(100);
        });  

        it("does not let non-owner set token weights", async function () {
            await expect(
                grimoire.connect(user2).setTokenWeights([token.address], [100])
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });  

        it("does not allow wrong number of argument", async function () {
            await expect(
                grimoire.setTokenWeights([token.address], [100, 100])
            ).to.be.revertedWith("LostGrimoire: token-weights length mismatch");

            await grimoire.addPlugin(token2.address, chain.testAddress)
            // two plugins now need to give 2 params
            await expect(
                grimoire.setTokenWeights([token.address], [100])
            ).to.be.revertedWith("LostGrimoire: token-plugins length mismatch");
        }); 
    });  

    describe("Getter", function () {

        beforeEach(async function () {
            await grimoire.addPlugin(token.address, plugin.address)
        })

        it("gets traits check for token", async function () {
            await expect( 
                grimoire.getHasTrait(token.address,666, 28)
            ).to.be.revertedWith("LostGrimoire: Token does not have data stored yet");
            expect(await grimoire.getHasTrait(token.address,6725, 28)).to.equal(true);
            expect(await grimoire.getHasTrait(token.address,6725, 29)).to.equal(false);
        })

        it("gets random trait for token", async function () {
            expect(await grimoire.callStatic.getRandomTraitIdForToken(token.address)).to.lte(nrTraits);
        })

        it("gets random trait for token", async function () {
            console.log(await grimoire.callStatic.getRandomLocation())
            expect(await grimoire.callStatic.getRandomLocation()).to.not.eq("");
        })

        it("gets random token based on weights", async function () {

            await expect(
                grimoire.callStatic.getRandomToken()
            ).to.be.revertedWith("LostGrimoire: weights not set");

            await grimoire.addPlugin(token2.address, plugin2.address)
            await grimoire.setTokenWeights([token.address,token2.address], [100, 0])
                
            expect(await grimoire.callStatic.getRandomToken()).to.eq(token.address);

            await grimoire.setTokenWeights([token.address,token2.address], [0, 100])
                
            expect(await grimoire.callStatic.getRandomToken()).to.eq(token2.address);
        })

    })
})
