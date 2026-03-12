import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

async function deployFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const GovernanceToken = await ethers.deployContract("GovernanceToken");
    return { GovernanceToken, owner, addr1, addr2 };
}

describe("GovernanceToken Contract", function () {
    it("FTを発行できること", async function () {
        const { GovernanceToken, addr1 } = await deployFixture();
        const mintAmount = ethers.parseEther("100"); // 100 MTK

        // ミント実行
        await GovernanceToken.mint(addr1.address, mintAmount);

        // 残高確認
        const balance = await GovernanceToken.balanceOf(addr1.address);
        expect(balance).to.equal(mintAmount);

        // 総供給量確認
        const totalSupply = await GovernanceToken.totalSupply();
        expect(totalSupply).to.equal(mintAmount);
    });

    it("FTをあるユーザーから別のユーザーへ送金できること", async function () {
        const { GovernanceToken, addr1, addr2 } = await deployFixture();
        const mintAmount = ethers.parseEther("100"); // 100 MTK
        const transferAmount = ethers.parseEther("30"); // 30 MTK

        // addr1にトークンをミント
        await GovernanceToken.mint(addr1.address, mintAmount);

        // 送金前の残高確認
        const addr1BalanceBefore = await GovernanceToken.balanceOf(addr1.address);
        const addr2BalanceBefore = await GovernanceToken.balanceOf(addr2.address);
        expect(addr1BalanceBefore).to.equal(mintAmount);
        expect(addr2BalanceBefore).to.equal(0);

        // addr1からaddr2へ送金
        await GovernanceToken.connect(addr1).transfer(addr2.address, transferAmount);

        // 送金後の残高確認
        const addr1BalanceAfter = await GovernanceToken.balanceOf(addr1.address);
        const addr2BalanceAfter = await GovernanceToken.balanceOf(addr2.address);
        expect(addr1BalanceAfter).to.equal(mintAmount - transferAmount);
        expect(addr2BalanceAfter).to.equal(transferAmount);

        // 総供給量は変更されないことを確認
        const totalSupply = await GovernanceToken.totalSupply();
        expect(totalSupply).to.equal(mintAmount);
    });
});
