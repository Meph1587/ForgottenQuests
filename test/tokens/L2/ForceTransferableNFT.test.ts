import { ethers } from 'hardhat';
import { BigNumber, Contract, Signer } from 'ethers';
import * as accounts from '../../../helpers/accounts';
import { expect } from 'chai';
import { ForceTransferableNFT} from '../../../typechain';
import * as chain from '../../../helpers/chain';
import * as deploy from '../../../helpers/deploy';
import { AbiCoder } from 'ethers/lib/utils';

describe('ForceTransferableNFT', function () {

    let user: Signer ;
    let user2: Signer ;
    let userAddress: string;
    let user2Address: string;

    let token: ForceTransferableNFT;
    let snapshotId: any;

    


    before(async function () {
        token = (await deploy.deployContract('ForceTransferableNFT', ["",""])) as unknown as ForceTransferableNFT;

        user = (await ethers.getSigners())[0]
        user2 = (await ethers.getSigners())[1]
        userAddress = await user.getAddress();
        user2Address = await user2.getAddress();
    
        await token.setMinter(userAddress,true);
        await token.setBridge(user2Address,true);
        
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
            expect(token.address).to.not.equal(0);
        });
    });
    

    describe('Mint', function () {
        it('lets minter mint', async function () {
            expect(await token.exists(93)).to.eq(false);
           await token.mint(userAddress, 93);
           expect(await token.ownerOf(93)).to.eq(userAddress);
        });

        it('does not let another user mint', async function () {
            await expect(token.connect(user2).mint(userAddress, 93)).to.be.revertedWith("ForceTransferableNFT: not allowed")
        });

    })

    describe('Burn', function () {
        it('lets minter burn', async function () {
            await token.mint(userAddress, 93);
            expect(await token.ownerOf(93)).to.eq(userAddress);
            await token.burn( 93);
            expect(await token.totalSupply()).to.eq(0);
         });
 
         it('does not let another user burn', async function () {
            await token.mint(userAddress, 93);
            await expect(token.connect(user2).burn(93)).to.be.revertedWith("ForceTransferableNFT: not allowed")
         });
    })

    describe('Get Tokens of Owner', function () {
        it('does return correct amount', async function () {
            expect((await token.tokensOfOwner(userAddress)).length).to.eq(0);
            await token.mint(userAddress, 93);
            expect((await token.tokensOfOwner(userAddress))[0]).to.eq(93);
            await token.mint(userAddress, 9393);
            expect((await token.tokensOfOwner(userAddress))[1]).to.eq(9393);
        });
    })

    describe('Force Transfer', function () {
        it('lets minter force transfer token', async function () {
            await token.mint(user2Address, 93);
            await token.connect(user2).forceTransferFrom(user2Address,chain.testAddress, 93)
            expect(await token.ownerOf(93)).to.eq(chain.testAddress);
         });
 
         it('does not let another user force transfer token', async function () {
            await token.mint(user2Address, 93);
            await expect(token.connect(user).forceTransferFrom(user2Address,chain.testAddress, 93)).to.be.revertedWith("ForceTransferableNFT: not allowed to force-transfer")
         });

    })


    describe('Setters', function () {

        it('lets owner set minter', async function () {
            await token.setMinter(chain.testAddress, true)
            expect(await token.minters(chain.testAddress)).to.equal(true);
        });

        it('does not let another user set minter', async function () {
            await expect(token.connect(user2).setMinter(chain.zeroAddress, true)).to.be.revertedWith("Ownable: caller is not the owner")
        });

        it('lets owner set bridge', async function () {
            await token.setBridge(chain.testAddress, true)
            expect(await token.bridges(chain.testAddress)).to.equal(true);
        });

        it('does not let another user set bridge', async function () {
            await expect(token.connect(user2).setBridge(chain.zeroAddress, true)).to.be.revertedWith("Ownable: caller is not the owner")
        });

    })
    
});