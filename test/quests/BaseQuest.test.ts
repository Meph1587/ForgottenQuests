import { ethers } from 'hardhat';
import { BigNumber, Contract, Signer } from 'ethers';
import { expect } from 'chai';
import { BaseQuest,LostGrimoireMock, JollyTavern,AltWizards, GlobalRandom, SoulGems} from '../../typechain';
import * as chain from '../../helpers/chain';
import * as deploy from '../../helpers/deploy';

describe('BaseQuest', function () {

    let quests: BaseQuest;
    let storage: LostGrimoireMock;
    let tavern: JollyTavern;
    let token: AltWizards;
    let random: GlobalRandom;
    let gems: SoulGems;
    let user: Signer, userAddress: string;
    let happyPirate: Signer, happyPirateAddress: string;
    let feeReceiver: Signer, feeReceiverAddress: string;

    let Mephistopheles = 1587;
    let Azahl = 3090;
    let AleisterCrowley = 1875;

    let snapshotId: any;

    before(async function () {
        await setupSigners();
        random = (await deploy.deployContract('GlobalRandom')) as unknown as GlobalRandom;

        gems = (await deploy.deployContract('SoulGems', ["", random.address])) as unknown as SoulGems;
        token = (await deploy.deployContract('AltWizards', ["", chain.testAddress, 0])) as unknown as AltWizards;

        storage = (await deploy.deployContract('LostGrimoireMock',[token.address]))  as unknown as LostGrimoireMock;
        tavern = (await deploy.deployContract('JollyTavern', [gems.address]))  as unknown as JollyTavern;
       
        
        quests = await deploy.deployContract('BaseQuest')  as unknown as BaseQuest;

        await quests.initialize(
                1000,
                1000,
                1000,
                3,
                2,
                storage.address,
                tavern.address
        );


        await tavern.setQuestLoop(quests.address, true);
        await token.setMinter(userAddress, true);
        await token.mint(userAddress, Mephistopheles);
        await token.mint(userAddress, Azahl);
        await token.mint(userAddress, AleisterCrowley);
        

        await chain.setTime(await chain.getCurrentUnix());
    });

    beforeEach(async function () {
        snapshotId = await ethers.provider.send('evm_snapshot', []);
    });

    afterEach(async function () {
        const ts = await chain.getLatestBlockTimestamp();

        await ethers.provider.send('evm_revert', [snapshotId]);

        await chain.moveAtTimestamp(ts + 5);
    });

    describe('General tests', function () {
        it('general checks', async function () {
            expect(quests.address).to.not.equal(0);
            await expect(
                quests.initialize( 
                    1000,
                    1000,
                    1000,
                    3,
                    2,
                    storage.address,
                    tavern.address)
            ).to.be.revertedWith("BaseQuest: Already initialized")
        });

    });

    describe('Create Quest', function () {
        it('can creat a quest', async function () {

            await quests.createQuest();
            expect(await quests.getNrQuests()).to.be.equal(1);

            let quest = await quests.getQuest(0);

            expect(quest.slotsFilled).to.eq(0);
            expect(quest.createdAt).to.not.eq(0);
            expect(quest.startedAt).to.eq(0);
            expect(quest.endsAt).to.eq(0);
            expect(quest.expiresAt).to.eq(quest.createdAt.add(1000));
            expect(quest.tokenAddresses.toString()).to.eq(([token.address,token.address,token.address]).toString());
            expect(quest.traitIds.toString()).to.eq("1,2,3");
            expect(quest.tokenIds.toString()).to.eq("99999,99999,99999");
            
        });

        it('can not create a quest during cooldown', async function () {
            await quests.createQuest();
            expect(await quests.getNrQuests()).to.be.equal(1);

            await expect(quests.createQuest()).to.be.revertedWith("BaseQuest: Not enought time passed since last quest");
        });

        it('can create a quest after cooldown', async function () {
            await quests.createQuest();
            expect(await quests.getNrQuests()).to.be.equal(1);

            await chain.increaseBlockTime(1100)

            await quests.createQuest();
            expect(await quests.getNrQuests()).to.be.equal(2);
        });

    });

    describe('Accept Quest', function () {

        beforeEach(async function () {
            await quests.createQuest();
        })

        it('can accept a quest', async function () {
            await quests.acceptQuest(0, Mephistopheles, 0)
            await quests.acceptQuest(0, Azahl, 1)

            let quest = await quests.getQuest(0);

            expect(quest.slotsFilled).to.eq(2);
            expect(quest.tokenIds[0]).to.eq(Mephistopheles);
            expect(quest.tokenIds[1]).to.eq(Azahl);
            expect(quest.startedAt).to.not.eq(0);
            expect(quest.endsAt).to.eq(quest.startedAt.add(1000));
            
        });

        // it('can not accept a quest if traits not stored', async function () {
        //     await wizards.mint(userAddress, 1875);
        //     await wizards.approve(quests.address, 1875);
        //     await expect(quests.acceptQuest(0, 1875)).to.be.revertedWith("Wizard does not have traits stored")
        // });

        // it('can not accept an already accepted quest', async function () {
        //     await wizards.approve(quests.address, Mephistopheles);
        //     await quests.acceptQuest(0, Mephistopheles)

        //     await wizards.mint(userAddress, 1875);
        //     await wizards.approve(quests.address, 1875);
        //     await expect(quests.acceptQuest(0, 1875)).to.be.revertedWith("Quest accepted already")
        // });

        // it('can not accept quest after expiry', async function () {
        //     let quest = await quests.getQuest(0);

        //     await chain.increaseBlockTime(quest.expires_at.toNumber() + 1000);

        //     await wizards.approve(quests.address, Mephistopheles);
        //     await expect(quests.acceptQuest(0, Mephistopheles)).to.be.revertedWith("Quest expired")

        // });

    });

    // describe('Complete Quest', function () {


    //     beforeEach(async function () {
    //         await quests.createQuest();
    //         await wizards.approve(quests.address, Mephistopheles);
    //         await quests.acceptQuest(0, Mephistopheles) 
    //         await rewardsNFT.setMintingAllowance(quests.address, true);
    //         await storage.storeOccurrence(200,108)
    //         await storage.storeOccurrence(150,122)

    //     })

    //     it('can complete a quest after it ends', async function () {
    //         let quest = await quests.getQuest(0);
    //         await chain.moveAtTimestamp(quest.ends_at.toNumber() + 1000);
    //         await quests.completeQuest(0);

    //         //returns wizard
    //         expect(await wizards.ownerOf(Mephistopheles)).to.eq(userAddress)

    //         //sends reward
    //         expect(await rewardsNFT.ownerOf(0)).to.eq(userAddress)
    //     });

    //     it('can not complete quest before it ends', async function () {
    //         let quest = await quests.getQuest(0);
    //         await chain.moveAtTimestamp(quest.ends_at.toNumber() - 1000);

    //         await expect(quests.completeQuest(0)).to.be.revertedWith("Quest not ended yet")
    //     });

    //     it('can not complete quest for other user', async function () {
    //         let quest = await quests.getQuest(0);
    //         await chain.moveAtTimestamp(quest.ends_at.toNumber() - 1000);

    //         await expect(quests.connect(happyPirate).completeQuest(0)).to.be.revertedWith("Only wizard owner can complete")
    //     });

    // });





    async function setupSigners () {
        const accounts = await ethers.getSigners();
        user = accounts[0];
        happyPirate = accounts[3];
        feeReceiver = accounts[4];

        userAddress = await user.getAddress();
        happyPirateAddress = await happyPirate.getAddress();
        feeReceiverAddress = await feeReceiver.getAddress();
    }

});
