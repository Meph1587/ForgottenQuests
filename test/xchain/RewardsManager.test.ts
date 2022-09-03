import { ethers } from 'hardhat';
import { BigNumber, Contract, Signer } from 'ethers';
import * as accounts from '../../helpers/accounts';
import { expect } from 'chai';
import { RewardsManager, SoulGems,GlobalRandom} from '../../typechain';
import * as chain from '../../helpers/chain';
import * as deploy from '../../helpers/deploy';

describe('RewardsManager', function () {

    let user: Signer;
    let user2: Signer;
    let userAddress: string;
    let user2Address: string;

    let rewards: RewardsManager;
    let gems: SoulGems;
    let random :GlobalRandom;
    let snapshotId: any;
    

    


    before(async function () {
        user = (await ethers.getSigners())[0]
        userAddress = await user.getAddress()
        user2 = (await ethers.getSigners())[1]
        user2Address = await user2.getAddress()


        rewards = (await deploy.deployContract('RewardsManager', [userAddress])) as unknown as RewardsManager;

        random = (await deploy.deployContract('GlobalRandom')) as unknown as GlobalRandom;
        gems = (await deploy.deployContract('SoulGems', ["", random.address])) as unknown as SoulGems;

        await gems.setMinter(userAddress, true)
        await gems.mint(userAddress, 1)
        await rewards.addRewardToken(chain.testAddress, gems.address)
        
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
        it('should be deployed', async function () {
            expect(rewards.address).to.not.equal(0);
            expect(await rewards.allL2Tokens(0)).to.eq(gems.address);
        });
    });
    

    describe('Gets unclaimed Tokens', function () {
        it('returns correct token and ids', async function () {
            let resp = await rewards.getUnclaimedRewards(userAddress);
            expect(resp[0][0]).to.eq(chain.testAddress)
            expect(resp[1][0][0]).to.eq(0)

            await gems.mint(userAddress, 37)
            await gems.mint(userAddress, 93)

            resp = await rewards.getUnclaimedRewards(userAddress);
            expect(resp[0][0]).to.eq(chain.testAddress)
            expect(resp[1][0][1]).to.eq(1)
            expect(resp[1][0][2]).to.eq(37)
            expect(resp[1][0][3]).to.eq(93)

            let gems2 = (await deploy.deployContract('SoulGems', ["", random.address])) as unknown as SoulGems;

            await gems2.setMinter(userAddress, true)
            await gems2.mint(userAddress, 1)
            await gems2.mint(userAddress, 11)
            await rewards.addRewardToken(chain.deadAddress, gems2.address)

            resp = await rewards.getUnclaimedRewards(userAddress);
            expect(resp[0][1]).to.eq(chain.deadAddress)
            expect(resp[1][1][1]).to.eq(1)
            expect(resp[1][1][2]).to.eq(11)
        });

        it('returns correct token and ids', async function () {
            await rewards.setAsClaimed([gems.address], [[0]])

            let resp = await rewards.getUnclaimedRewards(userAddress);
            expect(resp[0][0]).to.eq(chain.testAddress)
            expect(resp[1][0][0]).to.eq(ethers.constants.MaxUint256)

            await gems.mint(userAddress, 37)
            await gems.mint(userAddress, 93)


            await rewards.setAsClaimed([gems.address], [[93]])

            resp = await rewards.getUnclaimedRewards(userAddress);
            expect(resp[0][0]).to.eq(chain.testAddress)
            expect(resp[1][0][1]).to.eq(1)
            expect(resp[1][0][2]).to.eq(37)
            expect(resp[1][0][3]).to.eq(ethers.constants.MaxUint256)
        });
    });


    describe('Access', function () {
        it('reverts if non-bridge marks claimed', async function () {
            await expect(rewards.connect(user2).setAsClaimed([gems.address], [[0]])).to.be.revertedWith("RewardsManager: not allowed set as claimed")
        });
        it('allows owner to set bridge', async function () {
            await rewards.setBridge(user2Address)
            expect(await rewards.bridge()).to.eq(user2Address)
        });
        it('reverts if non-owner sets bridge', async function () {
            await expect(rewards.connect(user2).setBridge(user2Address)).to.be.revertedWith("Ownable: caller is not the owner")
        });
    });
});