import { ethers } from 'hardhat';
import { BigNumber, Contract, Signer } from 'ethers';
import * as accounts from '../helpers/accounts';
import { expect } from 'chai';
import { QuantumTunnelSender,QuantumTunnelReceiver, ConnextHandlerMock, ExecutorMock, L1TokenMock} from '../typechain';
import * as chain from '../helpers/chain';
import * as deploy from '../helpers/deploy';
import { AbiCoder } from 'ethers/lib/utils';

describe('QuantumTunnelSender', function () {

    let user: Signer ;
    let user2: Signer ;
    let userAddress: string ;

    let executor: ExecutorMock;
    let tunnel: QuantumTunnelSender;
    let handler: ConnextHandlerMock;
    let l1Token: L1TokenMock;
    let snapshotId: any;
    
    let receiver = "0x0000000000000000000000000000000000000001"
    let sender = "0x0000000000000000000000000000000000000002"
    let originDomain = 1
    let destinationDomain = 2
    let relayerFee = 10000
    


    before(async function () {
        executor = (await deploy.deployContract('ExecutorMock')) as unknown as ExecutorMock;
        handler = (await deploy.deployContract('ConnextHandlerMock', [executor.address])) as unknown as ConnextHandlerMock;
        tunnel = (await deploy.deployContract('QuantumTunnelSender', [handler.address, originDomain, chain.zeroAddress])) as unknown as QuantumTunnelSender;
        l1Token = (await deploy.deployContract('L1TokenMock', [""])) as unknown as L1TokenMock;

        user = (await ethers.getSigners())[0]
        user2 = (await ethers.getSigners())[1]
        userAddress = await user.getAddress();
    
        await l1Token.connect(user).mint(93);
        await tunnel.enableToken(l1Token.address);
        await tunnel.setDestinationReceiver(destinationDomain, receiver);
        await executor.setOrigins(receiver, destinationDomain)
        
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
    

    describe('Deposit', function () {
        it('let user deposit and triggers xcall', async function () {
            await l1Token.setApprovalForAll(tunnel.address, true);
            
            await tunnel.deposit(l1Token.address, 93, destinationDomain, 0, 0, relayerFee, {value:relayerFee} );
            
            //token in tunnel
            expect(await l1Token.ownerOf(93)).to.eq(tunnel.address);

            // payment to relayers
            expect(await ethers.provider.getBalance(handler.address)).to.eq(relayerFee)

            // correct calldata sent
            let args = await handler.args();
            expect(args.params.to).to.eq(receiver);
            expect(args.params.destinationDomain).to.eq(destinationDomain);
            
            let iface = new ethers.utils.Interface([
                "function executeXCallMint(address,address,uint256,uint256) "
            ]);
            let callData = iface.encodeFunctionData("executeXCallMint", [
                    userAddress,
                    l1Token.address,
                    93,
                    await chain.getLatestBlockTimestamp(),
                ]);
            expect(args.params.callData).to.eq(callData);
            
        });

        it('does not let user deposit inactive token', async function () {
            let fakeL1TokenMock = (await deploy.deployContract('L1TokenMock', [""])) as unknown as L1TokenMock;
            await fakeL1TokenMock.connect(user).mint(93);
            await fakeL1TokenMock.setApprovalForAll(tunnel.address, true);
            await expect(
                tunnel.deposit(fakeL1TokenMock.address, 93, destinationDomain, 0, 0, relayerFee, {value:relayerFee})
            ).to.be.revertedWith("QTSender: token is not enabled");
            
        });

        it('does not let user deposit to unavailable domain', async function () {
            await l1Token.setApprovalForAll(tunnel.address, true);
            await expect(
                tunnel.deposit(l1Token.address, 93, 1234, 0, 0, relayerFee, {value:relayerFee})
            ).to.be.revertedWith("QTSender: no receiver contract set for destination");
            
        });

        it('does not let user deposit without paying fee', async function () {
            await l1Token.setApprovalForAll(tunnel.address, true);
            await expect(
                tunnel.deposit(l1Token.address, 93, 1234, 0, 0, relayerFee, {value:0})
            ).to.be.revertedWith("QTSender: value to low to cover relayer and callback fee");
        });

        it('does not let user deposit without lock', async function () {
            await tunnel.setLockDuration(2)
            await l1Token.setApprovalForAll(tunnel.address, true);
            await expect(
                tunnel.deposit(l1Token.address, 93, 1234, 0, 0, relayerFee, {value:relayerFee})
            ).to.be.revertedWith("QTSender: lock duration is below min duration");
        });

        it('does not let user tunnel token again', async function () {
    
            await l1Token.setApprovalForAll(tunnel.address, true);
            await tunnel.deposit(l1Token.address, 93, destinationDomain, 0, 0, relayerFee, {value:relayerFee})
           
            await expect(
                tunnel.deposit(l1Token.address, 93, destinationDomain, 0, 0, relayerFee, {value:relayerFee})
            ).to.be.revertedWith("QTSender: token is already tunneled somewhere");
        });
    });
    describe('Withdraw', function () {
        it('let executor triggers withdraw', async function () {
            await l1Token.setApprovalForAll(tunnel.address, true);
            
            await tunnel.deposit(l1Token.address, 93, destinationDomain, 0, relayerFee, 0, {value:relayerFee} );
            
            let iface = new ethers.utils.Interface([
                "function executeXCallWithdraw(address,uint256) "
            ]);
            let callData = iface.encodeFunctionData("executeXCallWithdraw", [
                    l1Token.address,
                    93,
                ]);
            
            await executor.execute(tunnel.address, callData, {gasLimit:5000000});

            expect(await l1Token.ownerOf(93)).to.eq(userAddress);
            
            
        });

        it('reverts if non-executer triggers withdraw', async function () {
            await l1Token.setApprovalForAll(tunnel.address, true);
            await tunnel.deposit(l1Token.address, 93, destinationDomain, 0, relayerFee, 0, {value:relayerFee} );
            
            let iface = new ethers.utils.Interface([
                "function executeXCallWithdraw(address,uint256) "
            ]);
            let callData = iface.encodeFunctionData("executeXCallWithdraw", [
                    l1Token.address,
                    93,
                ]);
            
            let fakeExecutor = (await deploy.deployContract('ExecutorMock')) as unknown as ExecutorMock;
            await expect(fakeExecutor.execute(tunnel.address, callData, {gasLimit:5000000})).to.be.revertedWith("QTSender: invalid msg.sender on onlyExecutor check")
            
        });


    });

    describe('Emergency Withdraw', function () {
        beforeEach(async function () {
            await l1Token.setApprovalForAll(tunnel.address, true);
            await tunnel.deposit(l1Token.address, 93, destinationDomain, 0, 0, relayerFee, {value:relayerFee} );  
        })
        it('lets owner enable emergency withdraw', async function () {
            expect(await tunnel.emergencyWithdrawEnabled()).to.eq(false);
            await tunnel.enableEmergencyWithdraw();
            expect(await tunnel.emergencyWithdrawEnabled()).to.eq(true);
        });
        it('does not let non-owner enable emergency withdraw', async function () {
            await expect(tunnel.connect(user2).enableEmergencyWithdraw()).to.be.revertedWith("Ownable: caller is not the owner")
        });
        it('let user withdraw if emergency withdraw is enabled', async function () {
            await tunnel.enableEmergencyWithdraw();
            await tunnel.emergencyWithdraw(l1Token.address, 93)
            expect(await l1Token.ownerOf(93)).to.eq(userAddress);
        });

        it('does not let user withdraw before emergency period elapses', async function () {
            await expect(tunnel.emergencyWithdraw(l1Token.address, 93)).to.be.revertedWith("QTSender: emergency withdraw not allowed")
        });

        it('let user withdraw if emergency period elapses', async function () {
            await chain.moveAtTimestamp(await chain.getLatestBlockTimestamp() + 4838400 + 100)
            await tunnel.emergencyWithdraw(l1Token.address, 93)
            expect(await l1Token.ownerOf(93)).to.eq(userAddress);
        });

        it('does not let user withdraw before bridge fault period elapses', async function () {
            await chain.moveAtTimestamp(await chain.getLatestBlockTimestamp() - 4838400 - 100)
            await expect(tunnel.emergencyWithdraw(l1Token.address, 93)).to.be.revertedWith("QTSender: emergency withdraw not allowed")
        });

        it('does not trigger bridge fault if callback is successful', async function () {
            let iface = new ethers.utils.Interface([
                "function callback(bytes32,bool, bytes) "
            ]);
            let callData = iface.encodeFunctionData("callback", [
                "0xc6ae86a53302ffd492ff1a298d5d95653eba0671e89f314744af0720d0c41a58",
                true,
                (new AbiCoder).encode(["address","address","uint256"], [userAddress, l1Token.address, 93])
            ]);
        
            await executor.execute(tunnel.address, callData, {gasLimit:5000000})
            
            await chain.moveAtTimestamp(await chain.getLatestBlockTimestamp() + 260000 + 100)
            await expect(tunnel.emergencyWithdraw(l1Token.address, 93)).to.be.revertedWith("QTSender: emergency withdraw not allowed")
        });

        it('let user withdraw if bridge fault period elapses', async function () {
            let iface = new ethers.utils.Interface([
                "function callback(bytes32,bool, bytes) "
            ]);
            let callData = iface.encodeFunctionData("callback", [
                "0xc6ae86a53302ffd492ff1a298d5d95653eba0671e89f314744af0720d0c41a58",
                false,
                (new AbiCoder).encode(["address","address","uint256"], [userAddress, l1Token.address, 93])
            ]);
        
            await executor.execute(tunnel.address, callData, {gasLimit:5000000})
            
            await chain.moveAtTimestamp(await chain.getLatestBlockTimestamp() + 260000 + 100)
            await tunnel.emergencyWithdraw(l1Token.address, 93)
            expect(await l1Token.ownerOf(93)).to.eq(userAddress);
        });

        it('does not let user withdraw another token', async function () {
            await tunnel.enableEmergencyWithdraw();
            await expect(tunnel.emergencyWithdraw(l1Token.address, 78)).to.be.revertedWith("QTSender: not called by the owner of this token")
        });
    });


    describe('Setters', function () {
        it('does let owner set recovery', async function () {
            await tunnel.setRecovery("0x0000000000000000000000000000000000000003");
            expect(await tunnel.recovery()).to.eq("0x0000000000000000000000000000000000000003")
        });
        it('does let owner set min weeks lock', async function () {
            await tunnel.setLockDuration(3);
            expect(await tunnel.minWeeksLocked()).to.eq(3)
        });

        it('does not let non-owner set recovery', async function () {
            await expect(tunnel.connect(user2).setRecovery("0x0000000000000000000000000000000000000003")).to.be.revertedWith("Ownable: caller is not the owner")
        });

        it('does not let non-owner set min weeks lock', async function () {
            await expect(tunnel.connect(user2).setLockDuration(3)).to.be.revertedWith("Ownable: caller is not the owner")
        });
    })
    
});