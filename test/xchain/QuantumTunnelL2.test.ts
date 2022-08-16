import { ethers } from 'hardhat';
import { BigNumber, Contract, Signer } from 'ethers';
import * as accounts from '../../helpers/accounts';
import { expect } from 'chai';
import { QuantumTunnelL2, LzMock, RewardsManagerMock, AltWizards, SoulGems,GlobalRandom} from '../../typechain';
import * as chain from '../../helpers/chain';
import * as deploy from '../../helpers/deploy';
import { AbiCoder } from 'ethers/lib/utils';

describe('QuantumTunnelL2', function () {

    let user: Signer;
    let user2: Signer;
    let userAddress: string;
    let user2Address: string;

    let tunnel: QuantumTunnelL2;
    let endpoint: LzMock;
    let altToken: AltWizards;
    let gems: SoulGems;
    let random: GlobalRandom;
    let rewardsManager: RewardsManagerMock;
    let snapshotId: any;
    
    let originToken = "0x0000000000000000000000000000000000000001"
    let sender = "0x0000000000000000000000000000000000000002"
    let originDomain = 1
    let destinationDomain = 2
    let relayerFee = 10000;


    const ifaceRewards = new ethers.utils.Interface([
        "function lzReceive(uint16, bytes, uint64, bytes ) "
    ]);
    
    before(async function () {

        user = (await ethers.getSigners())[0]
        userAddress = await user.getAddress()
        user2 = (await ethers.getSigners())[1]
        user2Address = await user2.getAddress()


        endpoint = (await deploy.deployContract('LzMock')) as unknown as LzMock;
        tunnel = (await deploy.deployContract('QuantumTunnelL2', [endpoint.address, originDomain])) as unknown as QuantumTunnelL2;
        altToken = (await deploy.deployContract('AltWizards', ["",chain.testAddress, originDomain]))as unknown as AltWizards;
        rewardsManager = (await deploy.deployContract('RewardsManagerMock'))as unknown as RewardsManagerMock;
        
        random = (await deploy.deployContract('GlobalRandom')) as unknown as GlobalRandom;
        gems = (await deploy.deployContract('SoulGems', ['', random.address])) as unknown as SoulGems;
    

        await tunnel.mapContract(originToken, altToken.address);
        await tunnel.setTrustedRemote(originDomain, tunnel.address);
        await tunnel.setL1QuantumTunnel(sender);
        await tunnel.setRewardsManager(rewardsManager.address);
        await altToken.setMinter(tunnel.address, true)
        await altToken.setBridge(tunnel.address,true);
        await gems.setMinter(userAddress, true);
        await rewardsManager.addRewardToken(gems.address,gems.address)
        await gems.mint(userAddress, 93)
        
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
    

    describe('Spawn AltWizards', function () {
        it('let endpoint trigger Spawn', async function () {

            let data ="0x000000000000000000000000"+userAddress.replace("0x","")+"0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000005d"
           
            let callData = ifaceRewards.encodeFunctionData("lzReceive", [
                originDomain,
                tunnel.address,
                1,
                data
                ]);
            
            await endpoint.execute(tunnel.address, callData, {gasLimit:5000000});

            expect(await altToken.ownerOf(93)).to.eq(userAddress)
        });

        it('let endpoint trigger force transfer', async function () {

            let data ="0x000000000000000000000000"+userAddress.replace("0x","")+"0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000005d"
           
            let callData = ifaceRewards.encodeFunctionData("lzReceive", [
                originDomain,
                tunnel.address,
                1,
                data
                ]);
            
            await endpoint.execute(tunnel.address, callData, {gasLimit:5000000});

            expect(await altToken.ownerOf(93)).to.eq(userAddress)

            // transfer token out

            await altToken['safeTransferFrom(address,address,uint256)'](userAddress,user2Address,93)
            expect(await altToken.ownerOf(93)).to.eq(user2Address)

            
            callData = ifaceRewards.encodeFunctionData("lzReceive", [
                originDomain,
                tunnel.address,
                2,
                data
                ]);
        
            await endpoint.execute(tunnel.address, callData, {gasLimit:5000000});

            expect(await altToken.ownerOf(93)).to.eq(userAddress)
        });

        it('reverts if non-executer triggers Mint', async function () {
            
            let data ="0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266000000000000000000000000cf7ed3acca5a467e9e704c703e8d87f634fb0fc9000000000000000000000000000000000000000000000000000000000000005d"
           
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
    describe('Mint Rewards on Origin Chain', function () {
        beforeEach( async function() {
            let data ="0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266000000000000000000000000cf7ed3acca5a467e9e704c703e8d87f634fb0fc9000000000000000000000000000000000000000000000000000000000000005d"
           
            let callData = ifaceRewards.encodeFunctionData("lzReceive", [
                originDomain,
                tunnel.address,
                1,
                data
                ]);
            
            await endpoint.execute(tunnel.address, callData, {gasLimit:5000000});
        })
        it('lets user estimate gas', async function () {        
            expect(await tunnel.estimateMessageFee(userAddress)).to.be.gt(0);
        });

        it('Can trigger rewards mint', async function () {

            let fee =await tunnel.estimateMessageFee(userAddress)

            await expect( tunnel.mintRewardsOriginChain({value:fee})).to.not.be.reverted;

            let data = "0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000"+userAddress.replace("0x","")+"000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000001000000000000000000000000"+gems.address.replace("0x","")+ "0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001"

            expect((await endpoint.getData()).toLowerCase()).to.eq(data.toLowerCase());
        
        });

        it('Can rewards mint twice', async function () {

            let fee =await tunnel.estimateMessageFee(userAddress)

            await expect( tunnel.mintRewardsOriginChain({value:fee})).to.not.be.reverted;

            await expect( tunnel.mintRewardsOriginChain({value:fee})).to.be.revertedWith("QTL2: no rewards to mint");;
        
        });

        it('does not let trigger rewards if no reciever is set', async function () {
            await tunnel.setL1QuantumTunnel(chain.zeroAddress);
            await expect(
                tunnel.mintRewardsOriginChain()
            ).to.be.revertedWith("QTL2: origin contract not set");
        });

        it('requires fee to be paid', async function () {
            await expect(
                tunnel.mintRewardsOriginChain( {value:0} )
            ).to.be.revertedWith("XChainUtils: provided message fee to low");
        });

    });

    
});