import { ethers } from 'hardhat';
import { BigNumber, Contract, Signer } from 'ethers';
import { expect } from 'chai';
import { BaseQuest, ERC20Mock, WizardsMock,QuestTools, QuestAchievements,StorageMock} from '../typechain';
import * as chain from '../helpers/chain';
import * as deploy from '../helpers/deploy';

describe('BaseQuest', function () {

    let quests: BaseQuest, weth: ERC20Mock, wizards:WizardsMock, rewardsNFT: QuestAchievements;
    let tools:QuestTools, storage: StorageMock;
    let user: Signer, userAddress: string;
    let happyPirate: Signer, happyPirateAddress: string;
    let feeReceiver: Signer, feeReceiverAddress: string;

    let Mephistopheles = 1587;

    let startBalance = chain.tenPow18.mul(200)

    let snapshotId: any;

    before(async function () {
        await setupSigners();
        weth = (await deploy.deployContract('ERC20Mock')) as ERC20Mock;
        wizards = (await deploy.deployContract('WizardsMock')) as WizardsMock;
        storage = (await deploy.deployContract('StorageMock')) as StorageMock;
        rewardsNFT = (await deploy.deployContract('QuestAchievements')) as QuestAchievements;

        await wizards.mint(userAddress, Mephistopheles);
        await storage.setStored(Mephistopheles);
        await prepareAccount(user, startBalance)


        quests = await deploy.deployContract('BaseQuest') as BaseQuest;
        
        tools = await deploy.deployContract('QuestTools') as QuestTools;

        await quests.initialize(tools.address, feeReceiverAddress, rewardsNFT.address);
        
        await tools.initialize(weth.address, storage.address, wizards.address, chain.testAddress);

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
            expect(await quests.feeAddress()).to.be.equal(feeReceiverAddress);
            expect(await quests.questAchievements()).to.be.equal(rewardsNFT.address);
            expect(await quests.getNrOfQuests()).to.be.equal(0);
            await expect(
                quests.initialize(chain.testAddress, chain.testAddress, chain.testAddress)
            ).to.be.revertedWith("Already Initialized")
        });

    });

    describe('Create Quest', function () {
        it('can creat a quest', async function () {

            await chain.setTime(await chain.getLatestBlockTimestamp());

            await quests.newQuest();
            expect(await quests.getNrOfQuests()).to.be.equal(1);

            let quest = await quests.getQuest(0);

            expect(quest.negative_affinities.length).to.eq(2);
            expect(quest.positive_affinities.length).to.eq(2);
            expect(quest.expires_at).to.not.eq(0);
            expect(quest.randSeed).to.not.eq(0);
        });

        it('can not creat a quest during cooldown', async function () {
            await quests.newQuest();
            expect(await quests.getNrOfQuests()).to.be.equal(1);

            await expect(quests.newQuest()).to.be.revertedWith("Quest Cooldown not elapsed");
        });

    });

    describe('Accept Quest', function () {

        beforeEach(async function () {
            await quests.newQuest();
        })

        it('can accept a quest', async function () {
            await wizards.approve(quests.address, Mephistopheles);
            await quests.acceptQuest(0, Mephistopheles)

            let quest = await quests.getQuest(0);

            expect(quest.wizardId).to.eq(Mephistopheles);
            expect(quest.accepted_by).to.eq(userAddress);
            expect(quest.ends_at.sub(quest.accepted_at)).to.eq(
                await tools.getQuestDuration(Mephistopheles, quest.positive_affinities, quest.negative_affinities) 
            );
        });

        it('can not accept a quest if traits not stored', async function () {
            await wizards.mint(userAddress, 1875);
            await wizards.approve(quests.address, 1875);
            await expect(quests.acceptQuest(0, 1875)).to.be.revertedWith("Wizard does not have traits stored")
        });

        it('can not accept an already accepted quest', async function () {
            await wizards.approve(quests.address, Mephistopheles);
            await quests.acceptQuest(0, Mephistopheles)

            await wizards.mint(userAddress, 1875);
            await wizards.approve(quests.address, 1875);
            await expect(quests.acceptQuest(0, 1875)).to.be.revertedWith("Quest accepted already")
        });

        it('can not accept quest after expiry', async function () {
            let quest = await quests.getQuest(0);

            await chain.increaseBlockTime(quest.expires_at.toNumber() + 1000);

            await wizards.approve(quests.address, Mephistopheles);
            await expect(quests.acceptQuest(0, Mephistopheles)).to.be.revertedWith("Quest expired")

        });

    });

    describe('Complete Quest', function () {


        beforeEach(async function () {
            await quests.newQuest();
            await wizards.approve(quests.address, Mephistopheles);
            await quests.acceptQuest(0, Mephistopheles) 
            await rewardsNFT.setMintingAllowance(quests.address, true);
            await storage.storeOccurrence(200,108)
            await storage.storeOccurrence(150,122)

        })

        it('can complete a quest after it ends', async function () {
            let quest = await quests.getQuest(0);
            await chain.moveAtTimestamp(quest.ends_at.toNumber() + 1000);
            await quests.completeQuest(0);

            //returns wizard
            expect(await wizards.ownerOf(Mephistopheles)).to.eq(userAddress)

            //sends reward
            expect(await rewardsNFT.ownerOf(0)).to.eq(userAddress)
        });

        it('can not complete quest before it ends', async function () {
            let quest = await quests.getQuest(0);
            await chain.moveAtTimestamp(quest.ends_at.toNumber() - 1000);

            await expect(quests.completeQuest(0)).to.be.revertedWith("Quest not ended yet")
        });

        it('can not complete quest for other user', async function () {
            let quest = await quests.getQuest(0);
            await chain.moveAtTimestamp(quest.ends_at.toNumber() - 1000);

            await expect(quests.connect(happyPirate).completeQuest(0)).to.be.revertedWith("Only wizard owner can complete")
        });

    });



    describe('Abandon Quest', function () {


        beforeEach(async function () {
            await quests.newQuest();
            await wizards.approve(quests.address, Mephistopheles);
            await quests.acceptQuest(0, Mephistopheles) 
        })

        it('can abandon a quest before it ends', async function () {
            let quest = await quests.getQuest(0);

            await weth.approve(quests.address, chain.tenPow18.mul(10));
            await quests.abandonQuest(0);

            //returns wizard
            expect(await wizards.ownerOf(Mephistopheles)).to.eq(userAddress)


            // fee was transferred
            expect(await weth.balanceOf(feeReceiverAddress)).to.be.eq(
                startBalance.sub(await weth.balanceOf(userAddress))
            )
        });

        it('can not abandon quest after it ends', async function () {
            let quest = await quests.getQuest(0);
            await chain.moveAtTimestamp(quest.ends_at.toNumber() + 1000);

            await expect(quests.abandonQuest(0)).to.be.revertedWith("Quest ended")
        });

        it('can not abandon quest for other user', async function () {
            let quest = await quests.getQuest(0);
            await chain.moveAtTimestamp(quest.ends_at.toNumber() - 1000);

            await expect(quests.connect(happyPirate).abandonQuest(0)).to.be.revertedWith("Only wizard owner can abandon")
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

    async function prepareAccount (account: Signer, balance: BigNumber) {
        await weth.mint(await account.getAddress(), balance);
    }
});