// import { ethers } from 'hardhat';
// import { BigNumber, Contract, Signer } from 'ethers';
// import * as accounts from '../helpers/accounts';
// import { expect } from 'chai';
// import { QuantumTunnelSender, QuantumTunnelReceiver, ConnextHandlerMock, ExecutorMock,  RewardsCollector, AltToken} from '../typechain';
// import * as chain from '../helpers/chain';
// import * as deploy from '../helpers/deploy';

// describe('QuantumTunnelReceiver', function () {

//     let user: Signer;
//     let user2: Signer;
//     let userAddress: string;
//     let user2Address: string;

//     let executor: ExecutorMock;
//     let tunnel: QuantumTunnelReceiver;
//     let handler: ConnextHandlerMock;
//     let altToken: AltToken;
//     let rewardsCollector: RewardsCollector;
//     let snapshotId: any;
    
//     let originToken = "0x0000000000000000000000000000000000000001"
//     let sender = "0x0000000000000000000000000000000000000002"
//     let unusedAsset ="0x0000000000000000000000000000000000000003"
//     let originDomain = 1
//     let destinationDomain = 2
//     let relayerFee = 10000;

//     const ifaceSpawn = new ethers.utils.Interface([
//         "function executeXCallMintAltToken(address,address,uint256) "
//     ]);

//     const ifaceRewards = new ethers.utils.Interface([
//         "function executeXCallMintRewards(address,uint8[],uint256[]) "
//     ]);
    


//     before(async function () {
//         executor = (await deploy.deployContract('ExecutorMock')) as unknown as ExecutorMock;
//         handler = (await deploy.deployContract('ConnextHandlerMock', [executor.address])) as unknown as ConnextHandlerMock;
//         tunnel = (await deploy.deployContract('QuantumTunnelReceiver', [handler.address, destinationDomain, originDomain, unusedAsset])) as unknown as QuantumTunnelReceiver;
//         altToken = (await deploy.deployContract('AltToken', ["", chain.zeroAddress, 0]))as unknown as AltToken;
//         rewardsCollector = (await deploy.deployContract('RewardsCollector'))as unknown as RewardsCollector;

//         user = (await ethers.getSigners())[0]
//         userAddress = await user.getAddress()
//         user2 = (await ethers.getSigners())[1]
//         user2Address = await user2.getAddress()

//         await tunnel.mapContract(originToken, altToken.address);
//         await tunnel.setOriginContract(sender);
//         await tunnel.setRewardsCollector(rewardsCollector.address);
//         await executor.setOrigins(sender, originDomain)
//         await altToken.setMinter(tunnel.address)
//         await rewardsCollector.addRewards(userAddress,0,1)
        
//         await chain.setTime(await chain.getCurrentUnix());

//     });

//     beforeEach(async function () {
//         snapshotId = await ethers.provider.send('evm_snapshot', []);
//     });

//     afterEach(async function () {
//         const ts = await chain.getLatestBlockTimestamp();

//         await ethers.provider.send('evm_revert', [snapshotId]);

//         await chain.moveAtTimestamp(ts + 5);
//     });

//     describe('General tests', function () {
//         it('should be deployed', async function () {
//             expect(tunnel.address).to.not.equal(0);
//         });
//     });
    

//     describe('Spawn AltToken', function () {
//         it('let executor trigger Spawn', async function () {
           
//             let callData = ifaceSpawn.encodeFunctionData("executeXCallMintAltToken", [
//                     userAddress,
//                     originToken,
//                     93
//                 ]);
            
//             await executor.execute(tunnel.address, callData, {gasLimit:5000000});

//             expect(await altToken.ownerOf(93)).to.eq(userAddress)
//         });

//         it('let executor trigger force transfer', async function () {
            
//             let callData = ifaceSpawn.encodeFunctionData("executeXCallMintAltToken", [
//                     userAddress,
//                     originToken,
//                     93
//                 ]);
            
//             await executor.execute(tunnel.address, callData, {gasLimit:5000000});

//             expect(await altToken.ownerOf(93)).to.eq(userAddress)

//             // transfer token out

//             await altToken['safeTransferFrom(address,address,uint256)'](userAddress,user2Address,93)
//             expect(await altToken.ownerOf(93)).to.eq(user2Address)

//             // force transfer token back 
//             callData = ifaceSpawn.encodeFunctionData("executeXCallMintAltToken", [
//                 userAddress,
//                 originToken,
//                 93
//             ]);
        
//             await executor.execute(tunnel.address, callData, {gasLimit:5000000});

//             expect(await altToken.ownerOf(93)).to.eq(userAddress)
//         });

//         it('reverts if non-executer triggers Mint', async function () {
            
//             let callData = ifaceSpawn.encodeFunctionData("executeXCallMintAltToken", [
//                     userAddress,
//                     originToken,
//                     93
//                 ]);
            
//             let fakeExecutor = (await deploy.deployContract('ExecutorMock')) as unknown as ExecutorMock;
//             await expect(fakeExecutor.execute(tunnel.address, callData, {gasLimit:5000000})).to.be.revertedWith("QuantumTunnel: sender invalid")
            
//         });
//     });
//     describe('Mint Rewards on Origin Chain', function () {
//         beforeEach( async function() {
           
//             let callData = ifaceSpawn.encodeFunctionData("executeXCallMintAltToken", [
//                     userAddress,
//                     originToken,
//                     93
//                 ]);
            
//             await executor.execute(tunnel.address, callData, {gasLimit:5000000});
//         })

//         it('Can trigger rewards mint', async function () {

//             await tunnel.mintRewardsOriginChain(relayerFee, {value:relayerFee} );

//             //payment to relayer
//             expect(await ethers.provider.getBalance(handler.address)).to.eq(relayerFee)

//             let args = await handler.args();
//             expect(args.params.to).to.eq(sender);
//             expect(args.params.destinationDomain).to.eq(originDomain);
            
//             let callData = ifaceRewards.encodeFunctionData("executeXCallMintRewards", [
//                     userAddress,
//                     [0],
//                     [1],
//                 ]);
//             expect(args.params.callData).to.eq(callData);
        
//         });

//         it('Does not let trigger rewards', async function () {
//             await chain.moveAtTimestamp(await chain.getLatestBlockTimestamp() + 10000 + 100)
//             await tunnel.setOriginContract(chain.zeroAddress);
//             await expect(
//                 tunnel.mintRewardsOriginChain(relayerFee, {value:relayerFee} )
//             ).to.be.revertedWith("QTReceiver: origin contract not set");
//         });

//         it('does not let user withdraw without paying fee', async function () {
//             await expect(
//                 tunnel.mintRewardsOriginChain(relayerFee, {value:0} )
//             ).to.be.revertedWith("QTReceiver: value to low to cover relayer fee");
//         });

//     });

    
// });