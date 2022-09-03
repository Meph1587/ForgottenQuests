import * as deploy from "../../helpers/deploy";
import * as chain from "../../helpers/chain";
import { expect } from "chai";
import { WizardStoragePlugin, AltWizards, LostGrimoireStorage} from "../../typechain";

import * as merkle from "../../helpers/merkletree";

import { ethers } from 'hardhat';

const wizardsToTraits = require("../../data/wizardsNew.json");


describe("WizardStoragePlugin", function () {
    let plugin: WizardStoragePlugin;
    let token: AltWizards;
    let storage: LostGrimoireStorage;
    let traitsForWizards: number[][];
    let treeTraits: any;
    let treeNames: any;
    let snapshotId: any;

    let nrTraits = 627;

    beforeEach(async () => {
        token = (await deploy.deployContract('AltWizards', ["", chain.testAddress, 0])) as unknown as AltWizards;
        storage = (await deploy.deployContract('LostGrimoireStorage')) as unknown as LostGrimoireStorage;

        traitsForWizards = wizardsToTraits.traits;
        treeTraits = await merkle.makeTreeFromTraits(traitsForWizards);
        treeNames = await merkle.makeTreeFromNames( wizardsToTraits.names);
        plugin = (await deploy.deployContract('WizardStoragePlugin', [treeTraits.getHexRoot(), treeNames.getHexRoot(),nrTraits, token.address, storage.address])) as unknown as WizardStoragePlugin;

        await storage.setAllowedWriter(plugin.address,true)
        
    });

    describe('General tests', function () {
        it('should be deployed', async function () {
            expect(plugin.address).to.not.equal(0);
            expect(await plugin.getUnderlyingToken()).to.equal(token.address);
            expect(await plugin.getNrTraits()).to.equal(nrTraits);
        });
    });

    describe("when reading constants =>", function () {
        it("returns correct trait names", async function () {
            expect(await plugin.getTraitName(0)).to.be.eq("3D Frog")
            expect(await plugin.getTraitName(4)).to.be.eq("Ace in the Hole")
        });  
    });


    describe("when storing traits =>", function () {
        it("can store with valid proofs", async function () {
            let wizardId = 6725;
            let wizardTraits = [6725,421,178,65,36,39,249,29];
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
        
            let returnedTraits = await plugin.getTokenTraits(wizardId)
            
            expect(returnedTraits[0]).to.be.eq(wizardTraits[1])
            expect(returnedTraits[1]).to.be.eq(wizardTraits[2])
            expect(returnedTraits[2]).to.be.eq(wizardTraits[3])
            expect(returnedTraits[3]).to.be.eq(wizardTraits[4])
            expect(returnedTraits[4]).to.be.eq(wizardTraits[5])
            expect(returnedTraits[5]).to.be.eq(wizardTraits[6])
            expect(returnedTraits[6]).to.be.eq(wizardTraits[7])

            expect(await plugin.getTokenName(wizardId)).to.be.eq(wizardName[1])

            expect(await plugin.getTokenHasOneOfTraits(wizardId, [36])).to.be.true;
            expect(await plugin.getTokenHasOneOfTraits(wizardId, [37])).to.be.false;
        });

        it("can not store if not allowed in Storage", async function () {
            let wizardId = 6725;
            let wizardTraits = [6725,421,178,65,36,39,249,29];
            let wizardName = ["6725", "Ghost Eater Bathsheba of the Toadstools"];
            let validProofTraits =  merkle.getProofForTraits(wizardTraits)
            let validProofName =   merkle.getProofForName(wizardName)


            storage.setAllowedWriter(plugin.address,false)

            await expect(
                plugin.storeTokenData(wizardId, wizardName[1], wizardTraits, validProofName, validProofTraits)
            ).to.be.revertedWith("LostGrimoireStorage: not allowed to write to storage");
            
            
        });

        it("can not store with invalid trait proof", async function () {
            let wizardId = 6725;
            let wizardTraits = [6725,1,2,3,4,5,6,7]; // invalid traits for wizard
            let wizardName = ["6725", "Ghost Eater Bathsheba of the Toadstools"];
            let invalidProofTraits =  merkle.proofTraits(treeTraits, wizardTraits)
            let validProofName =  merkle.getProofForName(wizardName)

            await expect(
                plugin.storeTokenData(wizardId, wizardName[1], wizardTraits, validProofName, invalidProofTraits)
            ).to.be.revertedWith("Merkle Proof for traits is invalid!");
            
            expect(await plugin.getTokenHasData(wizardId)).to.be.false;
            
        });


        it("can not store with invalid name proof", async function () {
            let wizardId = 6725;
            let wizardTraits = [6725,421,178,65,36,39,249,29];
            let wizardName = ["6725", "Mephistopheles"]; //invalid name
            let validProofTraits =  merkle.getProofForTraits(wizardTraits)
            let invalidProofName =  merkle.proofName(treeNames, wizardName)

            await expect(
                plugin.storeTokenData(wizardId, wizardName[1], wizardTraits, invalidProofName, validProofTraits)
            ).to.be.revertedWith("Merkle Proof for name is invalid!");
            
            expect(await plugin.getTokenHasData(wizardId)).to.be.false;
            
        });

        it("can not store twice", async function () {
            let wizardId = 6725;
            let wizardTraits = [6725,421,178,65,36,39,249,29];
            let wizardName = ["6725", "Ghost Eater Bathsheba of the Toadstools"];
            let validProofTraits =  merkle.getProofForTraits(wizardTraits)
            let validProofName =  merkle.getProofForName(wizardName)

            //ok
            await plugin.storeTokenData(wizardId, wizardName[1], wizardTraits, validProofName, validProofTraits)

            //second time nope
            await expect(
                plugin.storeTokenData(wizardId, wizardName[1], wizardTraits, validProofName, validProofTraits)
            ).to.be.revertedWith("WizardStoragePlugin: traits are already stored for wizard");
            
        }); 

        it("can not store if submitted data is invalid", async function () {
            let wizardId = 6725;
            let wizardTraits = [6725,0,28,110,190,332,288];//last one missing
            let wizardName = ["6725", "Ghost Eater Bathsheba of the Toadstools"];
            let validProofTraits =  merkle.getProofForTraits(wizardTraits)
            let validProofName =  merkle.getProofForName(wizardName)

            //invalid trait length
            await expect(
                plugin.storeTokenData(wizardId, wizardName[1], wizardTraits, validProofName, validProofTraits)
            ).to.be.revertedWith("WizardStoragePlugin: provided trait list has invalid length");

            wizardTraits = [7777,0,28,110,190,332,288,341];

             //invalid wizard id in traits
             await expect(
                plugin.storeTokenData(wizardId, wizardName[1], wizardTraits, validProofName, validProofTraits)
            ).to.be.revertedWith("WizardStoragePlugin: incoherent wizardId");
            
        }); 

    })

});
