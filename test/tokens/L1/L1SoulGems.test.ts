import { ethers } from 'hardhat';
import { BigNumber, Contract, Signer } from 'ethers';
import * as accounts from '../../../helpers/accounts';
import { expect } from 'chai';
import { L1SoulGem} from '../../../typechain';
import * as chain from '../../../helpers/chain';
import * as deploy from '../../../helpers/deploy';
import { AbiCoder } from 'ethers/lib/utils';

describe('L1SoulGem', function () {

    let user: Signer ;
    let user2: Signer ;
    let userAddress: string;
    let user2Address: string;

    let token: L1SoulGem;
    let snapshotId: any;
    
    let originToken = "0x0000000000000000000000000000000000000001"
    let originDomain = 1
    let baseURI = "base URI"
    


    before(async function () {
        token = (await deploy.deployContract('L1SoulGem', [baseURI])) as unknown as L1SoulGem;

        user = (await ethers.getSigners())[0]
        user2 = (await ethers.getSigners())[1]
        userAddress = await user.getAddress();
        user2Address = await user2.getAddress();
    
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
        });
    });
    

    describe('Setters', function () {
        it('lets owner set base URI', async function () {
            await token.setBaseURI("another base URI");
            expect(await token.baseURI()).to.equal("another base URI");
            await token.mint(userAddress, 0);
            expect(await token.tokenURI(0)).to.equal("another base URI0");
        });

        it('does not let another user set base URI', async function () {
            await expect(token.connect(user2).setBaseURI("")).to.be.revertedWith("Ownable: caller is not the owner")
        });

    })
    
});