import { ethers } from 'hardhat';
import { BigNumber, Contract, Signer } from 'ethers';
import * as accounts from '../helpers/accounts';
import { expect } from 'chai';
import { BridgedERC721} from '../typechain';
import * as chain from '../helpers/chain';
import * as deploy from '../helpers/deploy';
import { AbiCoder } from 'ethers/lib/utils';

describe('BridgedERC721', function () {

    let user: Signer ;
    let user2: Signer ;
    let userAddress: string;

    let token: BridgedERC721;
    let snapshotId: any;
    
    let originToken = "0x0000000000000000000000000000000000000001"
    let originDomain = 1
    let baseURI = "base URI"
    


    before(async function () {
        token = (await deploy.deployContract('BridgedERC721', [baseURI, originToken, originDomain])) as unknown as BridgedERC721;

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
            expect(await token.baseURI()).to.equal(baseURI);
            expect(await token.originalContract()).to.equal(originToken);
            expect(await token.originalDomainId()).to.equal(originDomain);
        });
    });
    

    describe('Mint', function () {
        it('lets minter mint', async function () {
           await token.mint(userAddress, 93);
           expect(await token.ownerOf(93)).to.eq(userAddress);
           expect(await token.tokenURI(93)).to.eq(baseURI + "93");
        });

        it('does not let another user mint', async function () {
            await expect(token.connect(user2).mint(userAddress, 93)).to.be.revertedWith("AlternateWizards: not allowed")
        });

    })

    describe('Burn', function () {
        it('lets minter mint', async function () {
            await token.mint(userAddress, 93);
            expect(await token.ownerOf(93)).to.eq(userAddress);
            await token.burn( 93);
            expect(await token.totalSupply()).to.eq(0);
         });
 
         it('does not let another user burn', async function () {
            await token.mint(userAddress, 93);
            await expect(token.connect(user2).burn(93)).to.be.revertedWith("AlternateWizards: not allowed")
         });

    })

    describe('Setters', function () {
        it('lets owner set base URI', async function () {
           await token.setBaseURI("another base URI");
           expect(await token.baseURI()).to.equal("another base URI");
        });

        it('does not let another user set base URI', async function () {
            await expect(token.connect(user2).setBaseURI("")).to.be.revertedWith("Ownable: caller is not the owner")
        });

        it('lets owner set minter', async function () {
            await token.setMinter(chain.testAddress)
            expect(await token.minter()).to.equal(chain.testAddress);
        });

        it('does not let another user set minter', async function () {
            await expect(token.connect(user2).setMinter(chain.zeroAddress)).to.be.revertedWith("Ownable: caller is not the owner")
        });

    })
    
});