import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

// EtherFaucetのデプロイFixture
async function deployFixture() {
    const [owner, ...otherSigners] = await ethers.getSigners();
    const EtherFaucet = await ethers.deployContract("EtherFaucet", []);
    return { EtherFaucet, owner, otherSigners };
}

describe("EtherFaucet", function () {

    it("コントラクトへのEther送金処理", async function () {
        // EtherFaucetコントラクトのデプロイ
        const { EtherFaucet, owner } = await deployFixture();

        // コントラクトへ0.3 Ether送金
        const transactionHash = await owner.sendTransaction({
            to: EtherFaucet.target,
            value: ethers.parseEther("0.3"),
        });
        await transactionHash.wait();
        const contractBalance = await ethers.provider.getBalance(EtherFaucet.target);

        // コントラクトの残高が0.3 Etherであることを確認
        expect(contractBalance).to.equal(ethers.parseEther("0.3"));
    });

    it("faucet関数を利用した送金処理", async function () {
        // EtherFaucetコントラクトのデプロイ
        const { EtherFaucet, owner, otherSigners } = await deployFixture();

        // コントラクトへ0.4 Ether送金
        const transactionHash = await owner.sendTransaction({
            to: EtherFaucet.target,
            value: ethers.parseEther("0.4"),
        });
        await transactionHash.wait();

        // ウォレットの作成（テスト用）
        const testWallet = ethers.Wallet.createRandom();

        // faucet関数で0.1 Ether送金
        const balanceBefore = await ethers.provider.getBalance(testWallet.address);
        const tx = await EtherFaucet.connect(owner).faucet(testWallet.address);
        await tx.wait();
        const balanceAfter = await ethers.provider.getBalance(testWallet.address);

        // ウォレットの残高が0.1 Ether増加していることを確認
        const balanceDiff = balanceAfter - balanceBefore;
        console.log(`Balance difference: ${ethers.formatEther(balanceDiff)} ETH`);
        expect(balanceDiff).to.equal(ethers.parseEther("0.1"));
    });

    it("receive関数でEther受信イベントが発火される", async function () {
        // EtherFaucetコントラクトのデプロイ
        const { EtherFaucet, owner } = await deployFixture();

        // Ether送信（receive関数が実行される）
        const transactionHash = await owner.sendTransaction({
            to: EtherFaucet.target,
            value: ethers.parseEther("0.1"),
        });

        // イベントが発火されたことを確認
        expect(transactionHash).to.emit(EtherFaucet, "Receive");
    });

    it("アドレス0への送金は失敗する", async function () {
        // EtherFaucetコントラクトのデプロイ
        const { EtherFaucet, owner } = await deployFixture();

        // コントラクトへ0.4 Ether送金
        await owner.sendTransaction({
            to: EtherFaucet.target,
            value: ethers.parseEther("0.4"),
        });

        // アドレス0への送金は失敗することを確認
        await expect(
            EtherFaucet.connect(owner).faucet(ethers.ZeroAddress)
        ).to.be.revertedWith("Invalid address");
    });

    it("十分なEtherを持つアドレスへの送金は失敗する", async function () {
        // EtherFaucetコントラクトのデプロイ
        const { EtherFaucet, owner, otherSigners } = await deployFixture();

        // コントラクトへEther送金
        await owner.sendTransaction({
            to: EtherFaucet.target,
            value: ethers.parseEther("0.4"),
        });

        // otherSigners[0]に0.5 Ether送金（十分な残高を持たせる）
        await owner.sendTransaction({
            to: otherSigners[0].address,
            value: ethers.parseEther("0.5"),
        });

        // 十分なEtherを持つアドレスへの送金は失敗することを確認
        await expect(
            EtherFaucet.connect(owner).faucet(otherSigners[0].address)
        ).to.be.revertedWith("Recipient has sufficient balance");
    });
});