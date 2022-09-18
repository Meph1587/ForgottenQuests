import { ethers } from 'hardhat';
import { BigNumber, Contract, Signer } from 'ethers';
import { expect } from 'chai';
import { BaseQuest,LostGrimoireMock, JollyTavern,AltWizards, GlobalRandom, SoulGems, MemoryToken} from '../../typechain';
import * as chain from '../../helpers/chain';
import * as deploy from '../../helpers/deploy';

describe('BaseQuest', function () {

    let quests: BaseQuest;
    let storage: LostGrimoireMock;
    let tavern: JollyTavern;
    let token: AltWizards;
    let random: GlobalRandom;
    let gems: SoulGems;
    let memories: MemoryToken;
    let user: Signer, userAddress: string;
    let happyPirate: Signer, happyPirateAddress: string;
    let feeReceiver: Signer, feeReceiverAddress: string;

    let Mephistopheles = 1587;
    let Azahl = 3090;
    let AleisterCrowley = 1875;

    let frequency = 1000;
    let duration = 2000;
    let queue = 500;

    let snapshotId: any;

    before(async function () {
        await setupSigners();
        random = (await deploy.deployContract('GlobalRandom')) as unknown as GlobalRandom;

        gems = (await deploy.deployContract('SoulGems', ["", random.address])) as unknown as SoulGems;
        token = (await deploy.deployContract('AltWizards', ["", chain.testAddress, 0])) as unknown as AltWizards;

        storage = (await deploy.deployContract('LostGrimoireMock',[token.address]))  as unknown as LostGrimoireMock;
        tavern = (await deploy.deployContract('JollyTavern', [gems.address]))  as unknown as JollyTavern;
       
        
        memories = await deploy.deployContract('MemoryToken', [""])  as unknown as MemoryToken;
        
        quests = await deploy.deployContract('BaseQuest')  as unknown as BaseQuest;

        await quests.initialize(
                frequency,
                duration,
                queue,
                3,
                2,
                storage.address,
                tavern.address,
                memories.address
        );


        await tavern.setQuestLoop(quests.address, true);
        await token.setMinter(userAddress, true);
        await memories.setMinter(quests.address, true);
        await token.mint(userAddress, Mephistopheles);
        await token.mint(userAddress, Azahl);
        await token.mint(userAddress, AleisterCrowley);

        await gems.setMinter(tavern.address, true);
        

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
                    frequency,
                    duration,
                    queue,
                    3,
                    2,
                    storage.address,
                    tavern.address,
                    memories.address)
            ).to.be.revertedWith("BaseQuest: Already initialized")
        });

    });

    describe('Create Quest', function () {
        it('can creat a quest', async function () {

            await quests.createQuest();
            expect(await quests.getNrQuests()).to.be.equal(1);

            let quest = await quests.getQuest(0);
            expect(quest.promptSeed).to.not.eq(0);
            expect(quest.slotsFilled).to.eq(0);
            expect(quest.createdAt).to.not.eq(0);
            expect(quest.startedAt).to.eq(0);
            expect(quest.endsAt).to.eq(0);
            expect(quest.expiresAt).to.eq(quest.createdAt.add(queue));
            expect(quest.tokenAddresses.toString()).to.eq(([token.address,token.address,token.address]).toString());
            expect(quest.traitIds.toString()).to.eq("1,2,3");
            expect(quest.tokenIds.toString()).to.eq("" + ethers.constants.MaxUint256 +"," + ethers.constants.MaxUint256 +","+ ethers.constants.MaxUint256);

            console.log(await quests.getQuestPrompt(0))
            expect(await quests.getQuestPrompt(0)).to.not.eq("");
            
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
            expect(quest.endsAt).to.eq(quest.startedAt.add(duration));
            expect(await memories.balanceOf(quests.address, 0)).to.be.eq(2);
            
        });

        it('can not enter an occupied slot', async function () {
            await quests.acceptQuest(0, Mephistopheles, 0)
            await expect(quests.acceptQuest(0, Azahl, 0)).to.be.revertedWith("BaseQuest: slot filled already")
        });

        it('can not accept a quest after it starts', async function () {
            await quests.acceptQuest(0, Mephistopheles, 0)
            await quests.acceptQuest(0, Azahl, 1)

            //quest is 2/3
            await expect(quests.acceptQuest(0, AleisterCrowley, 2)).to.be.revertedWith("BaseQuest: quest already started")
        });

        it('can not accept quest after expiry', async function () {
            await quests.acceptQuest(0, Mephistopheles, 0)

            await chain.increaseBlockTime(queue + 1)

            await expect(quests.acceptQuest(0, Azahl, 1)).to.be.revertedWith("BaseQuest: quest expired")
         });

        it('can not accept without trait', async function () {
            await storage.setHasTrait(false)
    
            await expect(quests.acceptQuest(0, Azahl, 1)).to.be.revertedWith("BaseQuest: token does not have required trait")
        });

        it('can not accept if token is not owned', async function () {
            await token.transferFrom(userAddress, chain.testAddress, Mephistopheles)
    
            await expect(quests.acceptQuest(0, Mephistopheles, 0)).to.be.revertedWith("BaseQuest: sender does not own token")
        });

        it('can not accept if already in quest', async function () {
            await quests.acceptQuest(0, Mephistopheles, 0)

            await chain.increaseBlockTime(frequency + 1)
            await quests.createQuest();
    
            await expect(quests.acceptQuest(1, Mephistopheles, 0)).to.be.revertedWith("BaseQuest: token already in a quest")
        });

        it('can not purchase before accepting quest', async function () {
            await expect(quests.purchaseQuestMemory(0, Mephistopheles, 0, {value: chain.tenPow18})).to.be.revertedWith("BaseQuest: token did not participate in quest")
        });


        it('can purchase after accepting quest', async function () {
            await quests.acceptQuest(0, Mephistopheles, 0)
            await quests.acceptQuest(0, Azahl, 1)
            await quests.purchaseQuestMemory(0, Mephistopheles, 0, {value: chain.tenPow18})
            
            expect(await memories.balanceOf(quests.address, 0)).to.be.eq(1);
            expect(await memories.balanceOf(userAddress, 0)).to.be.eq(1);

            await quests.purchaseQuestMemory(0, Azahl, 1, {value: chain.tenPow18})
            
            expect(await memories.balanceOf(quests.address, 0)).to.be.eq(0);
            expect(await memories.balanceOf(userAddress, 0)).to.be.eq(2);
        });

    });

    describe('Complete Quest', function () {

        beforeEach(async function () {
            await quests.createQuest();
            await quests.acceptQuest(0, Mephistopheles, 0)
            await quests.acceptQuest(0, Azahl, 1)
        })

        it('can complete a quest after duration', async function () {
            await chain.increaseBlockTime(duration + 1)

            await quests.completeQuest(0, Mephistopheles, 0)

            expect(await tavern.getIsLocked(token.address, Mephistopheles)).to.eq(false);
            expect(await gems.balanceOf(userAddress)).to.eq(2);
            expect(await gems.ownerOf(0)).to.eq(userAddress);


            await quests.completeQuest(0, Azahl, 1)

            expect(await tavern.getIsLocked(token.address, Azahl)).to.eq(false);
            expect(await gems.balanceOf(userAddress)).to.eq(3);
            expect(await gems.ownerOf(1)).to.eq(userAddress);
            
        });

        it("can not complete on slot not participated in", async function () {
            await chain.increaseBlockTime(duration + 1)
            await expect(
                 quests.completeQuest(0, Mephistopheles, 1)).to.be.revertedWith("BaseQuest: token did not participate in quest")
        });

        it("can not complete before duration elapsed", async function () {
            await expect(
                 quests.completeQuest(0, Mephistopheles, 0)).to.be.revertedWith("BaseQuest: quest not over yet")
        });

        it('can not complete before duration elapsed', async function () {
            await chain.increaseBlockTime(duration + 1)
            await token.transferFrom(userAddress, chain.testAddress, Mephistopheles)

            await expect(quests.completeQuest(0, Mephistopheles, 0)).to.be.revertedWith("BaseQuest: sender does not own token")
        });

        it('does not receive reward if exiting expired quest', async function () {
            await chain.increaseBlockTime(duration + 1)
            await quests.createQuest()

            await quests.completeQuest(0, Mephistopheles, 0)
            expect(await gems.balanceOf(userAddress)).to.eq(2);

            await quests.acceptQuest(1, Mephistopheles, 0)

            await chain.increaseBlockTime(queue + 1)

            await quests.completeQuest(1, Mephistopheles, 0)

            expect(await tavern.getIsLocked(token.address, Mephistopheles)).to.eq(false);
            expect(await gems.balanceOf(userAddress)).to.eq(2);

        });
    });   


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
