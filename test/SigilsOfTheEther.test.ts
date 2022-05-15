import { ethers } from 'hardhat';
import { BigNumber, Contract, Signer } from 'ethers';
import * as accounts from '../helpers/accounts';
import { expect } from 'chai';
import { SigilsOfTheEther} from '../typechain';
import * as chain from '../helpers/chain';
import * as deploy from '../helpers/deploy';

describe('SigilsOfTheEther', function () {

    let factory: SigilsOfTheEther;
    let user: Signer, userAddress: string;
    let img = "data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJ4TWluWU1pbiBtZWV0IiB2aWV3Qm94PSIwIDAgNTAwIDUwMCI+PHN0eWxlPi5iYXNle2ZpbGw6cmVkO2ZvbnQtc2l6ZTo2MHB4O30gLnNoYXBle2ZpbGw6bm9uZTtzdHJva2U6cmVkO3N0cm9rZS13aWR0aDo0fTwvc3R5bGU+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iYmxhY2siIC8+PGNpcmNsZSBzdHlsZT0ic3Ryb2tlLXdpZHRoOjkiIGN4PSIyNTAiIGN5PSIyNTAiIHI9IjIzMCIgY2xhc3M9InNoYXBlIi8+PHBvbHlsaW5lIGNsYXNzPSJzaGFwZSIgcG9pbnRzPSIzOTIsMjc4LjA2IDE2NC42OCwzOTIgMjIxLjM3LDIyMS4zNyAzMzUuMDMsMTY0LjY4IDI3OC4zNCwzMzUuMDMgMTA3LjcsMjIxLjM3IDE2NC42OCwyNzguMDYgMjc4LjM0LDIyMS4zNyAiLz48Y2lyY2xlIGN4PSIzOTIiIGN5PSIyNzguMDYiIHI9IjE1IiBjbGFzcz0ic2hhcGUiLz48dGV4dCB4PSIyNzguMzQiIHk9IjIyMS4zNyIgY2xhc3M9ImJhc2UiIGR4PSItMTYuOTUiIGR5PSIxNS4yIj4rPC90ZXh0Pjwvc3ZnPg=="
    let uri = "data:application/json;base64,eyJuYW1lIjogIlRhbGlzbWFuICMwIiwgImRlc2NyaXB0aW9uIjogIlRoaXMgaW50ZW50aW9uIGhhcyBiZWVuIENhc3QgaW50byB0aGUgRXRoZXIiLCAiYXR0cmlidXRlcyI6IFtdLCAiaW1hZ2UiOiAiZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxQSE4yWnlBZ2VHMXNibk05SW1oMGRIQTZMeTkzZDNjdWR6TXViM0puTHpJd01EQXZjM1puSWlCd2NtVnpaWEoyWlVGemNHVmpkRkpoZEdsdlBTSjRUV2x1V1UxcGJpQnRaV1YwSWlCMmFXVjNRbTk0UFNJd0lEQWdOVEF3SURVd01DSStQSE4wZVd4bFBpNWlZWE5sZTJacGJHdzZjbVZrTzJadmJuUXRjMmw2WlRvMk1IQjRPMzBnTG5Ob1lYQmxlMlpwYkd3NmJtOXVaVHR6ZEhKdmEyVTZjbVZrTzNOMGNtOXJaUzEzYVdSMGFEbzBmVHd2YzNSNWJHVStQSEpsWTNRZ2QybGtkR2c5SWpFd01DVWlJR2hsYVdkb2REMGlNVEF3SlNJZ1ptbHNiRDBpWW14aFkyc2lJQzgrUEdOcGNtTnNaU0J6ZEhsc1pUMGljM1J5YjJ0bExYZHBaSFJvT2praUlHTjRQU0l5TlRBaUlHTjVQU0l5TlRBaUlISTlJakl6TUNJZ1kyeGhjM005SW5Ob1lYQmxJaTgrUEhCdmJIbHNhVzVsSUdOc1lYTnpQU0p6YUdGd1pTSWdjRzlwYm5SelBTSXpPVElzTWpjNExqQTJJREUyTkM0Mk9Dd3pPVElnTWpJeExqTTNMREl5TVM0ek55QXpNelV1TURNc01UWTBMalk0SURJM09DNHpOQ3d6TXpVdU1ETWdNVEEzTGpjc01qSXhMak0zSURFMk5DNDJPQ3d5TnpndU1EWWdNamM0TGpNMExESXlNUzR6TnlBaUx6NDhZMmx5WTJ4bElHTjRQU0l6T1RJaUlHTjVQU0l5TnpndU1EWWlJSEk5SWpFMUlpQmpiR0Z6Y3owaWMyaGhjR1VpTHo0OGRHVjRkQ0I0UFNJeU56Z3VNelFpSUhrOUlqSXlNUzR6TnlJZ1kyeGhjM005SW1KaGMyVWlJR1I0UFNJdE1UWXVPVFVpSUdSNVBTSXhOUzR5SWo0clBDOTBaWGgwUGp3dmMzWm5QZz09In0="

    let snapshotId: any;


    before(async function () {
        factory = (await deploy.deployContract('SigilsOfTheEther')) as SigilsOfTheEther;

        await chain.setTime(await chain.getCurrentUnix());

        await setupSigners();
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
            expect(factory.address).to.not.equal(0);
        });
    });

    describe('Generating  SVG', function () {
        it('should generate correct SVG', async function () {
            let svg = await factory.generateSVG("MEPHISTO", "red")
            
            expect(svg).to.be.eq(img)
        });
    });

    describe('Casting Sigil', function () {
        it('should not store sigil if mode = 0', async function () {
            await factory.connect(user).cast("MEPHISTO", "red", 0)
            expect(await factory.nonce()).to.be.eq(0)
            expect(await factory.imgSVG(0)).to.be.eq("")
        });

        it('should store sigil if mode = 1', async function () {
            await factory.connect(user).cast("MEPHISTO", "red", 1)
            expect(await factory.nonce()).to.be.eq(1)
            expect(await factory.imgSVG(0)).to.be.eq(img)
        });

        it('should mint NFT if mode = 2', async function () {
            await factory.connect(user).cast("MEPHISTO", "red", 2)
            expect(await factory.nonce()).to.be.eq(1)
            expect(await factory.imgSVG(0)).to.be.eq(img)
            expect(await factory.ownerOf(0)).to.be.eq(userAddress)
            expect(await factory.balanceOf(userAddress)).to.be.eq(1)
            expect(await factory.tokenURI(0)).to.be.eq(uri)
            
        });
    });

    async function setupSigners () {
        const accounts = await ethers.getSigners();
        user = accounts[0];
     
        userAddress = await user.getAddress();
    }

});