// import { ethers } from 'hardhat';
// import { BigNumber, Contract, Signer } from 'ethers';
// import * as accounts from '../../helpers/accounts';
// import { expect } from 'chai';
// import { QuantumTunnelSender,QuantumTunnelReceiver, ConnextHandlerMock, ExecutorMock, L1TokenMock, RewardToken} from '../../typechain';
// import * as chain from '../../helpers/chain';
// import * as deploy from '../../helpers/deploy';
// import { AbiCoder } from 'ethers/lib/utils';

// describe('QuantumTunnelSender', function () {

//     let user: Signer ;
//     let user2: Signer ;
//     let userAddress: string ;

//     let executor: ExecutorMock;
//     let tunnel: QuantumTunnelSender;
//     let handler: ConnextHandlerMock;
//     let rewardToken: RewardToken;
//     let l1Token: L1TokenMock;
//     let snapshotId: any;
    
//     let receiver = "0x0000000000000000000000000000000000000001"
//     let sender = "0x0000000000000000000000000000000000000002"
//     let originDomain = 1
//     let destinationDomain = 2
//     let relayerFee = 10000
    
//     const ifaceSpawn = new ethers.utils.Interface([
//         "function executeXCallMintAltToken(address,address,uint256) "
//     ]);

//     const ifaceRewards = new ethers.utils.Interface([
//         "function executeXCallMintRewards(address,uint8[],uint256[])"
//     ]);

//     before(async function () {
//         executor = (await deploy.deployContract('ExecutorMock')) as unknown as ExecutorMock;
//         handler = (await deploy.deployContract('ConnextHandlerMock', [executor.address])) as unknown as ConnextHandlerMock;
//         tunnel = (await deploy.deployContract('QuantumTunnelSender', [handler.address, originDomain, chain.zeroAddress])) as unknown as QuantumTunnelSender;
//         rewardToken = (await deploy.deployContract('RewardToken', [""])) as unknown as RewardToken;
//         l1Token = (await deploy.deployContract('L1TokenMock', [""])) as unknown as L1TokenMock;

//         user = (await ethers.getSigners())[0]
//         user2 = (await ethers.getSigners())[1]
//         userAddress = await user.getAddress();
    
//         await l1Token.connect(user).mint(93);
//         await tunnel.enableToken(l1Token.address);
//         await tunnel.setDestinationReceiver(destinationDomain, receiver);
//         await tunnel.setRewardToken(0, rewardToken.address);
//         await executor.setOrigins(receiver, destinationDomain)
//         await rewardToken.setMinter(tunnel.address)
        
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
    

//     describe('Spawn Alt Token', function () {
//         it('lets user trigger spawn xcall', async function () {
            
//             await tunnel.spawnAltToken(l1Token.address, 93, destinationDomain, relayerFee, {value:relayerFee} );
            
//             // payment to relayers
//             expect(await ethers.provider.getBalance(handler.address)).to.eq(relayerFee)

//             // correct calldata sent
//             let args = await handler.args();
//             expect(args.params.to).to.eq(receiver);
//             expect(args.params.destinationDomain).to.eq(destinationDomain);
            
            
//             let callData = ifaceSpawn.encodeFunctionData("executeXCallMintAltToken", [
//                     userAddress,
//                     l1Token.address,
//                     93
//                 ]);
//             expect(args.params.callData).to.eq(callData);
            
//         });

//         it('does not let user deposit inactive token', async function () {
//             let fakeL1TokenMock = (await deploy.deployContract('L1TokenMock', [""])) as unknown as L1TokenMock;
//             await fakeL1TokenMock.connect(user).mint(93);
//             await fakeL1TokenMock.setApprovalForAll(tunnel.address, true);
//             await expect(
//                 tunnel.spawnAltToken(fakeL1TokenMock.address, 93, destinationDomain, relayerFee, {value:relayerFee})
//             ).to.be.revertedWith("QTSender: token is not enabled");
            
//         });

//         it('does not let user deposit to unavailable domain', async function () {
//             await l1Token.setApprovalForAll(tunnel.address, true);
//             await expect(
//                 tunnel.spawnAltToken(l1Token.address, 93, 1234, relayerFee, {value:relayerFee})
//             ).to.be.revertedWith("QTSender: no receiver contract set for destination");
            
//         });

//         it('does not let user deposit without paying fee', async function () {
//             await l1Token.setApprovalForAll(tunnel.address, true);
//             await expect(
//                 tunnel.spawnAltToken(l1Token.address, 93, destinationDomain, relayerFee, {value:0})
//             ).to.be.revertedWith("QTSender: value to low to cover relayer fee");
//         });

//         it('does not let another user call spawn', async function () {

//             await expect(
//                 tunnel.connect(user2).spawnAltToken(l1Token.address, 93, destinationDomain, relayerFee, {value:relayerFee})
//             ).to.be.revertedWith("QTSender: token not owned by sender");
//         });
//     });


//     describe('Mint Rewards', function () {
//         it('let executor triggers rewards mint', async function () {
//             let callData = ifaceRewards.encodeFunctionData("executeXCallMintRewards", [
//                     userAddress,
//                     [0],
//                     [1]
//                 ]);
            
//             await executor.execute(tunnel.address, callData, {gasLimit:5000000});

//             expect(await rewardToken.ownerOf(1)).to.eq(userAddress);
            
            
//         });

//         it('reverts if non-executer triggers withdraw', async function () {
//             let callData = ifaceRewards.encodeFunctionData("executeXCallMintRewards", [
//                 userAddress,
//                 [0],
//                 [1]
//             ]);
            
//             let fakeExecutor = (await deploy.deployContract('ExecutorMock')) as unknown as ExecutorMock;
//             await expect(fakeExecutor.execute(tunnel.address, callData, {gasLimit:5000000})).to.be.revertedWith("QuantumTunnel: sender invalid")
            
//         });


//     });

    
// });