import { ethers } from 'hardhat';
import { BigNumber, Contract, Signer } from 'ethers';
import * as accounts from '../helpers/accounts';
import { expect } from 'chai';
import { QuantumTunnelL1, QuantumTunnelL2, ConnextHandlerMock, ExecutorMock, L2Token} from '../typechain';
import * as chain from '../helpers/chain';
import * as deploy from '../helpers/deploy';

describe('QuantumTunnelL2', function () {

    let user: Signer ;
    let user2: Signer ;

    let executor: ExecutorMock;
    let tunnel: QuantumTunnelL2;
    let handler: ConnextHandlerMock;
    let l2Token: L2Token;
    let snapshotId: any;
    
    let originToken = "0x0000000000000000000000000000000000000001"
    let sender = "0x0000000000000000000000000000000000000002"
    let originDomain = 1
    let destinationDomain = 2
    let relayerFee = 10000;
    


    before(async function () {
        executor = (await deploy.deployContract('ExecutorMock')) as ExecutorMock;
        handler = (await deploy.deployContract('ConnextHandlerMock', [executor.address])) as ConnextHandlerMock;
        tunnel = (await deploy.deployContract('QuantumTunnelL2', [handler.address, originDomain])) as QuantumTunnelL2;
        l2Token = (await deploy.deployContract('L2Token', [""])) as L2Token;

        user = (await ethers.getSigners())[0]
        user2 = (await ethers.getSigners())[1]

        await tunnel.mapContract(originToken,l2Token.address);
        await tunnel.setOrigin(sender);
        await executor.setOrigins(sender, originDomain)
        
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
        it('let executor trigger Mint', async function () {
            
            let iface = new ethers.utils.Interface([
                "function executeXCallMint(address,address,uint256,uint256) "
            ]);
            let callData = iface.encodeFunctionData("executeXCallMint", [
                    await user.getAddress(),
                    originToken,
                    93,
                    await chain.getLatestBlockTimestamp(),
                ]);
            
                await executor.execute(tunnel.address, callData, {gasLimit:5000000});

                expect(await l2Token.ownerOf(93)).to.eq(await user.getAddress());
            
        });

        it('reverts if non-executer triggers Mint', async function () {
            
            let iface = new ethers.utils.Interface([
                "function executeXCallMint(address,address,uint256,uint256) "
            ]);
            let callData = iface.encodeFunctionData("executeXCallMint", [
                    await user.getAddress(),
                    originToken,
                    93,
                    await chain.getLatestBlockTimestamp(),
                ]);
            
            let fakeExecutor = (await deploy.deployContract('ExecutorMock')) as ExecutorMock;
            await expect(fakeExecutor.execute(tunnel.address, callData, {gasLimit:5000000})).to.be.revertedWith("Expected origin contract on origin domain called by Executor")
            
        });
    });
    describe('Withdraw', function () {
        beforeEach( async function() {
            let iface = new ethers.utils.Interface([
                "function executeXCallMint(address,address,uint256,uint256) "
            ]);
            let callData = iface.encodeFunctionData("executeXCallMint", [
                    await user.getAddress(),
                    originToken,
                    93,
                    await chain.getLatestBlockTimestamp() + 10000,
                ]);
            
            await executor.execute(tunnel.address, callData, {gasLimit:5000000});
        })


        it('does not let user withdraw before lock', async function () {
            await expect(
                tunnel.withdraw(originToken, 93, 0, relayerFee, {value:relayerFee} )
            ).to.be.revertedWith("still locked");
        });

        it('let executor triggers withdraw', async function () {

            await chain.moveAtTimestamp(await chain.getLatestBlockTimestamp() + 10000 + 100)
           
            await tunnel.withdraw(originToken, 93, 0, relayerFee, {value:relayerFee} );
            
            //token was burned
            expect(await l2Token.totalSupply()).to.eq(0);

            //payment to relayer
            expect(await ethers.provider.getBalance(handler.address)).to.eq(relayerFee)

            let args = await handler.args();
            expect(args.params.to).to.eq(sender);
            expect(args.params.destinationDomain).to.eq(originDomain);
            
            let iface = new ethers.utils.Interface([
                "function executeXCallWithdraw(address,uint256) "
            ]);
            let callData = iface.encodeFunctionData("executeXCallWithdraw", [
                    originToken,
                    93,
                ]);
            expect(args.params.callData).to.eq(callData);
        
        });

        it('does not let user withdraw if origin is 0', async function () {
            await chain.moveAtTimestamp(await chain.getLatestBlockTimestamp() + 10000 + 100)
            await tunnel.setOrigin(chain.zeroAddress);
            await expect(
                tunnel.withdraw(originToken, 93, 0, relayerFee, {value:relayerFee} )
            ).to.be.revertedWith("Destination domain not allowed");
        });

        it('does not let user withdraw without paying fee', async function () {
            await expect(
                tunnel.withdraw(originToken, 93, 0, relayerFee, {value:0} )
            ).to.be.revertedWith("Payment for relayer fee to low");
        });

        it('does not let user withdraw a non-owned token', async function () {
            l2Token.mint(await user2.getAddress(), 90);
            await expect(
                tunnel.withdraw(originToken, 90, 0, relayerFee, {value:relayerFee} )
            ).to.be.revertedWith("not owner of token");
        });


    });


    describe('Setters', function () {
        it('does let owner set recovery', async function () {
            await tunnel.setRecovery("0x0000000000000000000000000000000000000003");
            expect(await tunnel.recovery()).to.eq("0x0000000000000000000000000000000000000003")
        });

        it('does let owner set callback', async function () {
            await tunnel.setCallback("0x0000000000000000000000000000000000000003");
            expect(await tunnel.callback()).to.eq("0x0000000000000000000000000000000000000003")
        });

        it('does not let non-owner set recovery', async function () {
            await expect(tunnel.connect(user2).setRecovery("0x0000000000000000000000000000000000000003")).to.be.revertedWith("Ownable: caller is not the owner")
        });

        it('does not let non-owner set callback', async function () {
            await expect(tunnel.connect(user2).setCallback("0x0000000000000000000000000000000000000003")).to.be.revertedWith("Ownable: caller is not the owner")
        });
    })
    
});