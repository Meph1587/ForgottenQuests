import { ethers } from 'hardhat';
import { BigNumber, Contract, Signer } from 'ethers';
import * as accounts from '../helpers/accounts';
import { expect } from 'chai';
import { QuantumTunnelL1, QuantumTunnelL2, ConnextHandlerMock, ExecutorMock, L2Token} from '../typechain';
import * as chain from '../helpers/chain';
import * as deploy from '../helpers/deploy';

describe('QuantumTunnelL2', function () {

    let user: Signer ;

    let executor: ExecutorMock;
    let tunnel: QuantumTunnelL2;
    let handler: ConnextHandlerMock;
    let l2Token: L2Token;
    let snapshotId: any;
    
    let originToken = "0x0000000000000000000000000000000000000001"
    let sender = "0x0000000000000000000000000000000000000002"
    let originDomain = 1
    let destinationDomain = 2
    


    before(async function () {
        executor = (await deploy.deployContract('ExecutorMock')) as ExecutorMock;
        handler = (await deploy.deployContract('ConnextHandlerMock', [executor.address])) as ConnextHandlerMock;
        tunnel = (await deploy.deployContract('QuantumTunnelL2', [handler.address, originDomain])) as QuantumTunnelL2;
        l2Token = (await deploy.deployContract('L2Token', [""])) as L2Token;

        user = (await ethers.getSigners())[0]

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
        it('let executor trigger xCall', async function () {
            
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
    });
    describe('Withdraw', function () {
        it('let executor triggers withdraw', async function () {
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
            
            await tunnel.withdraw(originToken, 93, 0, 0);
            
            expect(await l2Token.totalSupply()).to.eq(0);

            let args = await handler.args();
            expect(args.params.to).to.eq(sender);
            expect(args.params.destinationDomain).to.eq(originDomain);
            
            iface = new ethers.utils.Interface([
                "function executeXCallWithdraw(address,uint256) "
            ]);
            callData = iface.encodeFunctionData("executeXCallWithdraw", [
                    originToken,
                    93,
                ]);
            expect(args.params.callData).to.eq(callData);
        
        });
    });
    
});