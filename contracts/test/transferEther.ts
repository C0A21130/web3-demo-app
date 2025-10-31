import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

// Fixtureのデプロイ関数
async function deployFixture() {
    const [agent] = await ethers.getSigners();
    const agentAddress = await agent.getAddress();
    const SsdlabToken = await ethers.deployContract("SsdlabToken", [agentAddress]);
    return { SsdlabToken, agent };
}

describe("TransferEther", function () {

    it("コントラクトへの送金処理", async function () {
        // スマートコントラクトのデプロイ
        const { SsdlabToken, agent } = await loadFixture(deployFixture);

        // コントラクトへ0.3ether送金
        const transactionHash = await agent.sendTransaction({
            to: SsdlabToken.target,
            value: ethers.parseEther("0.3"),
        });
        await transactionHash.wait();
        const contractBalance = await ethers.provider.getBalance(SsdlabToken.target);

        // コントラクトの残高が0.3etherであることを確認
        expect(contractBalance).to.equal(ethers.parseEther("0.3"));
    });

    it("コントラクトからfaucet関数を利用した送金処理", async function () {
        // スマートコントラクトのデプロイ
        const { SsdlabToken, agent } = await loadFixture(deployFixture);

        // コントラクトへ0.3ether送金
        const transactionHash = await agent.sendTransaction({
            to: SsdlabToken.target,
            value: ethers.parseEther("0.4"),
        });
        await transactionHash.wait();

        // ウォレットの作成
        const wallet = ethers.Wallet.createRandom();

        // コントラクトから0.3ether送金
        const balanceBefore = await ethers.provider.getBalance(wallet.address);
        const tx = await SsdlabToken.connect(agent).faucet(wallet.address);
        await tx.wait();
        const balanceAfter = await ethers.provider.getBalance(wallet.address);

        // ウォレットの残高が0.3ether増加していることを確認
        const balanceDiff = balanceAfter - balanceBefore;
        console.log(`Balance difference: ${ethers.formatEther(balanceDiff)} ETH`);
    });
});