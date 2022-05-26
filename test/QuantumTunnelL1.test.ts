import { ethers } from 'hardhat';
import { BigNumber, Contract, Signer } from 'ethers';
import * as accounts from '../helpers/accounts';
import { expect } from 'chai';
import { QuantumTunnelL1,QuantumTunnelL2, ConnextHandlerMock, ExecutorMock, L1Token} from '../typechain';
import * as chain from '../helpers/chain';
import * as deploy from '../helpers/deploy';

describe('QuantumTunnelL1', function () {

    let user: Signer ;

    let executor: ExecutorMock;
    let tunnel: QuantumTunnelL1;
    let handler: ConnextHandlerMock;
    let l1Token: L1Token;
    let snapshotId: any;
    
    let receiver = "0x0000000000000000000000000000000000000001"
    let sender = "0x0000000000000000000000000000000000000002"
    let originDomain = 1
    let destinationDomain = 2
    


    before(async function () {
        executor = (await deploy.deployContract('ExecutorMock')) as ExecutorMock;
        handler = (await deploy.deployContract('ConnextHandlerMock', [executor.address])) as ConnextHandlerMock;
        tunnel = (await deploy.deployContract('QuantumTunnelL1', [handler.address, originDomain, chain.zeroAddress])) as QuantumTunnelL1;
        l1Token = (await deploy.deployContract('L1Token', [""])) as L1Token;

        user = (await ethers.getSigners())[0]
    
        await l1Token.connect(user).mint(93);
        await tunnel.enableToken(l1Token.address);
        await tunnel.setDestinationReceiver(destinationDomain, receiver);
        await tunnel.setOriginContract(destinationDomain, sender);
        await executor.setOrigins(sender, destinationDomain)
        
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
            
            await tunnel.deposit(l1Token.address, 93, destinationDomain, 0, 0, 0);
            
            expect(await l1Token.ownerOf(93)).to.eq(tunnel.address);

            let args = await handler.args();
            expect(args.params.to).to.eq(receiver);
            expect(args.params.destinationDomain).to.eq(destinationDomain);
            
            let iface = new ethers.utils.Interface([
                "function executeXCallMint(address,address,uint256,uint256) "
            ]);
            let callData = iface.encodeFunctionData("executeXCallMint", [
                    await user.getAddress(),
                    l1Token.address,
                    93,
                    await chain.getLatestBlockTimestamp(),
                ]);
            expect(args.params.callData).to.eq(callData);
        });
    });
    describe('Withdraw', function () {
        it('let executor triggers withdraw', async function () {
            await l1Token.setApprovalForAll(tunnel.address, true);
            
            await tunnel.deposit(l1Token.address, 93, destinationDomain, 0, 0, 0);
            
            let iface = new ethers.utils.Interface([
                "function executeXCallWithdraw(address,uint256) "
            ]);
            let callData = iface.encodeFunctionData("executeXCallWithdraw", [
                    l1Token.address,
                    93,
                ]);
            
            await executor.execute(tunnel.address, callData, {gasLimit:5000000});

            expect(await l1Token.ownerOf(93)).to.eq(await user.getAddress());
            
            
        });
    });
    
});