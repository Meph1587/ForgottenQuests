import { ethers } from 'hardhat';
import { BigNumber, Contract, Signer } from 'ethers';
import * as accounts from '../../helpers/accounts';
import { expect } from 'chai';
import { QuantumTunnelL1, NFTMock, L1SoulGems, LzMock} from '../../typechain';
import * as chain from '../../helpers/chain';
import * as deploy from '../../helpers/deploy';
import { AbiCoder } from 'ethers/lib/utils';

describe('QuantumTunnelSender', function () {

    let user: Signer ;
    let user2: Signer ;
    let userAddress: string ;

    let endpoint: LzMock;
    let tunnel: QuantumTunnelL1;
    let rewardToken: L1SoulGems;
    let l1Token: NFTMock;
    let snapshotId: any;
    
    let receiver = "0x0000000000000000000000000000000000000001"
    let sender = "0x0000000000000000000000000000000000000002"
    let originDomain = 1
    let destinationDomain = 2
    let relayerFee = 10000

    const ifaceRewards = new ethers.utils.Interface([
                "function lzReceive(uint16, bytes, uint64, bytes ) "
            ]);
    

    before(async function () {
        endpoint = (await deploy.deployContract('LzMock')) as unknown as LzMock;
        tunnel = (await deploy.deployContract('QuantumTunnelL1', [endpoint.address])) as unknown as QuantumTunnelL1;
        rewardToken = (await deploy.deployContract('L1SoulGems', [""])) as unknown as L1SoulGems;
        l1Token = (await deploy.deployContract('NFTMock', [""])) as unknown as NFTMock;

        user = (await ethers.getSigners())[0]
        user2 = (await ethers.getSigners())[1]
        userAddress = await user.getAddress();
    
        await l1Token.connect(user).mint(93);
        await tunnel.setTrustedRemote(originDomain, tunnel.address);
        await tunnel.setDestinationReceiver(originDomain, tunnel.address);
        await tunnel.enableToken(l1Token.address);
        await tunnel.setBridgeMintableNFT(0, rewardToken.address);
        await rewardToken.setMinter(tunnel.address)
        
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
            expect(tunnel.address).to.not.equal(0);
        });
    });
    

    describe('Spawn Alt Token', function () {
        it('lets user estimate gas', async function () {        
            expect(await tunnel.estimateMessageFee(l1Token.address, 93, originDomain)).to.be.gt(0);
        });

        it('lets user trigger spawn xcall', async function () {        
            let fee =await tunnel.estimateMessageFee(l1Token.address, 93, originDomain);    
            await tunnel.spawnAltToken(l1Token.address, 93, originDomain, {value:fee})

            let data = (new AbiCoder()).encode(["address","address","uint256"], [userAddress, l1Token.address, 93])

            expect(await endpoint.getData()).to.eq(data);

        });

        it('does not let user deposit inactive token', async function () {
            let fakeL1TokenMock = (await deploy.deployContract('NFTMock', [""])) as unknown as NFTMock;
            await fakeL1TokenMock.connect(user).mint(93);
            await fakeL1TokenMock.setApprovalForAll(tunnel.address, true);
            await expect(
                tunnel.spawnAltToken(fakeL1TokenMock.address, 93, originDomain)
            ).to.be.revertedWith("QTL1: token is not enabled");
            
        });

        it('does not let user deposit to unavailable domain', async function () {
            await l1Token.setApprovalForAll(tunnel.address, true);
            await expect(
                tunnel.spawnAltToken(l1Token.address, 93, 1234)
            ).to.be.revertedWith("QTL1: no receiver contract set for destination");
            
        });

        it('does not let another user call spawn', async function () {
            await expect(
                tunnel.connect(user2).spawnAltToken(l1Token.address, 93, originDomain)
            ).to.be.revertedWith("QTL1: token not owned by sender");
        });
    });


    describe('Mint Rewards', function () {
        it('lets endpoint call mint', async function () { 

            let data = "0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000"+userAddress.replace("0x","")+"000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000001000000000000000000000000"+rewardToken.address.replace("0x","")+ "0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001"

            let callData = ifaceRewards.encodeFunctionData("lzReceive", [
                    originDomain,
                    tunnel.address,
                    1,
                    data
                ]);
            
            await endpoint.execute(tunnel.address, callData, {gasLimit:5000000});

            expect(await rewardToken.ownerOf(1)).to.eq(userAddress);
                
        });

        it('reverts if non-endpoint triggers mint', async function () { 

            let data = "0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000"+userAddress.replace("0x","")+"000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000001000000000000000000000000"+rewardToken.address.replace("0x","")+ "0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001"

            let callData = ifaceRewards.encodeFunctionData("lzReceive", [
                    originDomain,
                    tunnel.address,
                    1,
                    data
                ]);
            let fakeEndpoint = (await deploy.deployContract('LzMock')) as unknown as LzMock;
            await expect(fakeEndpoint.execute(tunnel.address, callData, {gasLimit:5000000})).to.be.revertedWith("LzApp: invalid endpoint caller")
            
                
        });
    });

    
});