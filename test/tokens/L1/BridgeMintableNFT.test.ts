import { ethers } from 'hardhat';
import {  Signer } from 'ethers';
import { expect } from 'chai';
import { BridgeMintableNFT} from '../../../typechain';
import * as chain from '../../../helpers/chain';
import * as deploy from '../../../helpers/deploy';


describe('BridgeMintableNFT', function () {

    let user: Signer ;
    let user2: Signer ;
    let userAddress: string;

    let token: BridgeMintableNFT;
    let snapshotId: any;

    before(async function () {
        token = (await deploy.deployContract('BridgeMintableNFT', ["",""])) as unknown as BridgeMintableNFT;

        user = (await ethers.getSigners())[0]
        user2 = (await ethers.getSigners())[1]
        userAddress = await user.getAddress();
    
        await token.setMinter(userAddress);
        
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
           await token.mint(userAddress, 93);
           expect(await token.ownerOf(93)).to.eq(userAddress);
        });

        it('does not let another user mint', async function () {
            await expect(token.connect(user2).mint(userAddress, 93)).to.be.revertedWith("BridgeMintableNFT: not allowed to mint")
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

   
    describe('Setters', function () {

        it('lets owner set minter', async function () {
            await token.setMinter(chain.testAddress)
            expect(await token.minter()).to.equal(chain.testAddress);
        });

        it('does not let another user set minter', async function () {
            await expect(token.connect(user2).setMinter(chain.zeroAddress)).to.be.revertedWith("Ownable: caller is not the owner")
        });

    })
    
});