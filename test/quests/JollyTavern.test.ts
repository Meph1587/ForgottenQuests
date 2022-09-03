import { ethers } from 'hardhat';
import { BigNumber, Contract, Signer } from 'ethers';
import { expect } from 'chai';
import { JollyTavern, GlobalRandom, SoulGems} from '../../typechain';
import * as chain from '../../helpers/chain';
import * as deploy from '../../helpers/deploy';

describe('JollyTavern', function () {
    let tavern: JollyTavern;
    let random: GlobalRandom;
    let gems: SoulGems;
    let user: Signer, userAddress: string;
    let user2: Signer, user2Address: string;

    let Mephistopheles = 1587;

    let snapshotId: any;

    before(async function () {
        await setupSigners();
        random = (await deploy.deployContract('GlobalRandom')) as unknown as GlobalRandom;

        gems = (await deploy.deployContract('SoulGems', ["", random.address])) as unknown as SoulGems;
      
        tavern = (await deploy.deployContract('JollyTavern', [gems.address]))  as unknown as JollyTavern;
       
        

        await tavern.setQuestLoop(userAddress, true);

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
            expect(tavern.address).to.not.equal(0);
           
        });

    });

    describe('Minting and Claiming Rewards', function () {
        it('can mint', async function () {

            await tavern.mintReward(gems.address, 0, 1);

            expect(await gems.balanceOf(tavern.address)).to.eq(1);
            expect(await gems.ownerOf(1)).to.eq(tavern.address);


            await tavern.mintReward(gems.address, 0, 2);

            expect(await gems.balanceOf(tavern.address)).to.eq(2);
            expect(await gems.ownerOf(2)).to.eq(tavern.address);
            
        });

        it('can not mint if not an allowed address', async function () {

            await expect(tavern.connect(user2).mintReward(gems.address,0,0)).to.be.revertedWith("JollyTavern: can only be called by quest Loop");
            
        });

        it('can claim', async function () {
            await tavern.mintReward(gems.address, 0, 1);
            await tavern.mintReward(gems.address, 0, 2);

            await tavern.claimAllRewards(userAddress, 0, 1);

            expect(await gems.balanceOf(userAddress)).to.eq(2);
            expect(await gems.ownerOf(1)).to.eq(userAddress);


            await tavern.claimAllRewards(userAddress, 0, 2);

            expect(await gems.balanceOf(userAddress)).to.eq(3);
            expect(await gems.ownerOf(2)).to.eq(userAddress);
            
        });

        it('can not claim if not an allowed address', async function () {

            await expect(tavern.connect(user2).claimAllRewards(userAddress,0,0)).to.be.revertedWith("JollyTavern: can only be called by quest Loop");
            
        });
    }); 
    
    describe('Can lock tokens', function () {
        it('can lock tokens', async function () {

            await tavern.lockInQuest(chain.testAddress, Mephistopheles, 0);

            expect(await tavern.getIsLocked(chain.testAddress, Mephistopheles)).to.eq(true);
            let quest =await tavern.getQuest(chain.testAddress, Mephistopheles);
            expect(quest["0"]).to.eq(userAddress);// set user as loop
            expect(quest["1"]).to.eq(0);
            
        });

        it('can unlock lock tokens', async function () {

            await tavern.lockInQuest(chain.testAddress, Mephistopheles, 0);

            await tavern.unlockFromQuest(chain.testAddress, Mephistopheles);

            expect(await tavern.getIsLocked(chain.testAddress, Mephistopheles)).to.eq(false);
            let quest =await tavern.getQuest(chain.testAddress, Mephistopheles);
            expect(quest["0"]).to.eq(chain.zeroAddress);
            expect(quest["1"]).to.eq(ethers.constants.MaxUint256);
        });

        it('can not lock tokens if not allowed', async function () {

            await expect(tavern.connect(user2).lockInQuest(chain.testAddress, Mephistopheles, 0)).to.be.revertedWith("JollyTavern: can only be called by quest Loop");
            
            
        });it('can not unlock tokens if not allowed', async function () {
            await tavern.lockInQuest(chain.testAddress, Mephistopheles, 0);

            await expect(tavern.connect(user2).unlockFromQuest(chain.testAddress, Mephistopheles)).to.be.revertedWith("JollyTavern: can only be called by quest Loop");
            
            
        });
    }); 


    async function setupSigners () {
        const accounts = await ethers.getSigners();
        user = accounts[0];
        user2 = accounts[1];

        userAddress = await user.getAddress();
        user2Address = await user2.getAddress();
    }

});
