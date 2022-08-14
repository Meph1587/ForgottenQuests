import { ethers } from 'hardhat';
import { BigNumber, Contract, Signer } from 'ethers';
import * as accounts from '../../../helpers/accounts';
import { expect } from 'chai';
import { SoulGems, AltWizards, GlobalRandom} from '../../../typechain';
import * as chain from '../../../helpers/chain';
import * as deploy from '../../../helpers/deploy';
import { AbiCoder } from 'ethers/lib/utils';

describe('SoulGems', function () {

    let user: Signer ;
    let user2: Signer ;
    let userAddress: string;
    let user2Address: string;

    let gems: SoulGems;
    let token: AltWizards;
    let random: GlobalRandom;
    let snapshotId: any;
    
    let originToken = "0x0000000000000000000000000000000000000001"
    let originDomain = 1
    let imgUri = "base URI"
    


    before(async function () {
        user = (await ethers.getSigners())[0]
        user2 = (await ethers.getSigners())[1]
        userAddress = await user.getAddress();
        user2Address = await user2.getAddress();

        token = (await deploy.deployContract('AltWizards', ["", originToken, originDomain])) as unknown as AltWizards;

        random = (await deploy.deployContract('GlobalRandom')) as unknown as GlobalRandom;

        gems = (await deploy.deployContract('SoulGems', [imgUri, random.address])) as unknown as SoulGems;
    
        await token.setMinter(userAddress, true);
        await gems.setMinter(userAddress, true);
        await gems.setAllowedTokens(token.address, true)
        
        await chain.setTime(await chain.getCurrentUnix());

        await token.mint(userAddress, 0)
        await token.mint(userAddress, 1)
        await token.mint(user2Address, 2)

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
            expect(gems.address).to.not.equal(0);
            expect(await gems.imgUri()).to.equal(imgUri);
        });
    });

    describe('Bind', function () {
        beforeEach(async function () {
            await gems.mint(userAddress, 93);
            expect(await gems.ownerOf(93)).to.eq(userAddress);
        })
        it('lets owner bind', async function () {
           await gems.bindToToken(93, token.address, 0);
           let r = await gems.gemToToken(93);
           expect(r[0]).to.eq(token.address);
           expect(r[1]).to.eq(0);
           expect(await gems.tokenToGem(token.address, 0)).to.eq(93);
        });

        it('does not allow to bind non-allowed token', async function () {
            await expect(gems.bindToToken(93, chain.testAddress, 0)).to.be.revertedWith("SoulGems: token not allowed for binding")
        });

        it('does not allow to bind non-owned gem', async function () {
            await expect(gems.connect(user2).bindToToken(93, token.address, 0)).to.be.revertedWith("SoulGems: gem not owned by caller")
        });

        it('does not allow to bin to non-owned token', async function () {
            await gems.mint(user2Address, 94);
            await expect(gems.connect(user2).bindToToken(94, token.address, 0)).to.be.revertedWith("SoulGems: token not owned by caller")
        });

        it('does not allow to re-bind ', async function () {
            await gems.bindToToken(93, token.address, 0);
            await expect(gems.bindToToken(93, token.address, 1)).to.be.revertedWith("SoulGems: gem already bound")
        });

        it('does not allow to bind twice to token', async function () {
            await gems.bindToToken(93, token.address, 0);
            await gems.mint(userAddress, 94);
            await expect(gems.bindToToken(94, token.address, 0)).to.be.revertedWith("SoulGems: token already has a gem")
        });
    })
    
    describe('Un-Bind', function () {
        beforeEach(async function () {
            await gems.mint(userAddress, 93);
            await gems.bindToToken(93, token.address, 0);
        })
        it('lets owner un-bind ', async function () {
            await gems.unBindFromToken(93, token.address, 0);
            let r = await gems.gemToToken(93);
            expect(r[0]).to.eq(chain.zeroAddress);
            expect(r[1]).to.eq(0);
            expect(await gems.tokenToGem(token.address, 0)).to.eq(0);
        });

        it('does not allow to un-bind non-owned gem', async function () {
            await expect(gems.connect(user2).unBindFromToken(93, token.address, 0)).to.be.revertedWith("SoulGems: gem not owned by caller")
        });

        it('does not allow to un-bind to non-owned token', async function () {
            await gems.mint(user2Address, 94);
            await expect(gems.connect(user2).unBindFromToken(94, token.address, 0)).to.be.revertedWith("SoulGems: token not owned by caller")
        });

        it('does not allow to un-bind gem not bound to token', async function () {
            await expect(gems.unBindFromToken(93, token.address, 1)).to.be.revertedWith("SoulGems: gem not bound to token")
        });
    })

    describe('Stats Generation', function () {
        beforeEach(async function () {
            await gems.mint(userAddress, 93);
            expect(await gems.ownerOf(93)).to.eq(userAddress);
        })


        it('lets mint with stats', async function () {
            await gems.mintNextWithRoll(userAddress);
            let s = await gems.getStats(1);
            expect(s[0]).to.not.eq(0);
            expect(s[1]).to.not.eq(1);
            expect(s[2]).to.not.eq(2);
        })

        it('lets re-roll stats', async function () {
            //roll 0
            let sb = await gems.getStats(93);
            await gems.reRollStats(93);
            let sa = await gems.getStats(93);
            expect(sb[0]).to.not.eq(sa[0]);

            //roll 1
            sb = await gems.getStats(93);
            await gems.reRollStats(93);
            sa = await gems.getStats(93);
            expect(sb[0]).to.not.eq(sa[0]);
        });

        it('lets returns stats for token', async function () {
            await gems.mintNextWithRoll(userAddress);
            await gems.bindToToken(1, token.address, 0);
            let s = await gems.getStatsForToken(token.address, 0);
            expect(s[0]).to.not.eq(0);
        })
    })

    describe('Token Uri', function () {
        it('returns a valid URI', async function () {
            await gems.mintNextWithRoll(userAddress);
            let tokenUri = await gems.tokenURI(0)
            console.log(tokenUri)
            expect(true)
        })
    })

    describe('Setters', function () {
        it('lets owner set base URI', async function () {
           await gems.setImgURI("another base URI");
           expect(await gems.imgUri()).to.equal("another base URI");
        });

        it('does not let another user set base URI', async function () {
            await expect(gems.connect(user2).setImgURI("")).to.be.revertedWith("Ownable: caller is not the owner")
        });

    })
    
});