import * as deploy from "../../helpers/deploy";
import * as chain from "../../helpers/chain";
import { expect } from "chai";
import { PromptMaker, LostGrimoire, GlobalRandom} from "../../typechain";

import * as merkle from "../../helpers/merkletree";

import { ethers } from 'hardhat';
import { BigNumber, Contract, Signer } from 'ethers';



describe("PromptMaker", function () {

    let user: Signer ;
    let user2: Signer ;

    let maker: PromptMaker;

    beforeEach(async () => {

        user = (await ethers.getSigners())[0]
        user2 = (await ethers.getSigners())[1]
        maker = (await deploy.deployContract('PromptMaker')) as unknown as PromptMaker;

    });

    describe('General tests', function () {
        it('should be deployed', async function () {
            expect(maker.address).to.not.equal(0);
        });
    });

    describe("Prompt", function () {
        it("creates a prompt", async function () {
            let prompt = await maker.getPrompt(0);
            console.log(prompt)
            expect(prompt).to.eq("The Alchemists Archipelago, beaches, palm trees, tropical, sunrise, anime")


            prompt = await maker.getPrompt(100093);
            console.log(prompt)
            expect(prompt).to.eq("Kobold's Crossroad, beaches, palm trees, tropical, moonlight, pixel art")
        });  

    })
})

