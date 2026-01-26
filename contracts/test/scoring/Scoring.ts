import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { SsdlabToken } from "../../typechain-types";

async function deployFixture() {
  const [owner, addr1, addr2, addr3] = await ethers.getSigners();
  const Scoring = await ethers.deployContract("Scoring", [owner.address]);
  const SsdlabToken = await ethers.deployContract("SsdlabToken", [owner.address]);
  return { Scoring, SsdlabToken, owner, addr1, addr2, addr3 };
}

// トークンの発行と転送を行う関数
const mintAndTransferToken = async (SsdlabToken: SsdlabToken, from: any, to: any, tokenName: string) => {
  const tx = await SsdlabToken.connect(from).safeMint(from.address, tokenName);
  const receipt = await tx.wait();
  const transferEvent = receipt?.logs.find((log: any) => log.topics[0] === SsdlabToken.interface.getEvent("Transfer").topicHash);
  const tokenId = transferEvent ? parseInt(transferEvent.topics[3], 16) : 0;
  await SsdlabToken.connect(from).transferFrom(from.address, to.address, tokenId);
}

describe("Scoring Contract", function () {
  describe("基本機能の確認", function () {
    it("スコアが正しく取得できること", async function () {
      const { Scoring, addr1 } = await loadFixture(deployFixture);

      // スコアの取得
      const score = await Scoring.getScore(addr1.address);
      expect(score).to.equal(0); // 初期スコアは0であることを想定
    });

    it("スコアをまとめて取得できること", async function () {
      const { Scoring, addr1, addr2 } = await loadFixture(deployFixture);

      // スコアのまとめて取得
      const scores = await Scoring.getScores([addr1.address, addr2.address]);
      expect(scores.length).to.equal(2);
      expect(scores[0]).to.equal(0); // addr1の初期スコア
      expect(scores[1]).to.equal(0); // addr2の初期スコア
    });

    it("ポリシーが自由に変更可能なこと", async function () {
      const { Scoring, owner } = await loadFixture(deployFixture);

      // ポリシーの変更
      await Scoring.connect(owner).setPolicy(3);
      const policy = await Scoring.getPolicy(owner.address);
      expect(policy).to.equal(3);
    });

    it("自身のスコアと相手のスコアを比較できること", async function () {
      const { Scoring, owner, addr1, addr2, addr3 } = await loadFixture(deployFixture);

      // スコアを設定
      await Scoring.connect(owner).rate(addr1.address, 80); // addr1のスコアを80に設定
      await Scoring.connect(owner).rate(addr2.address, 60); // addr2のスコアを60に設定
      await Scoring.connect(owner).rate(addr3.address, 40); // addr3のスコアを40に設定

      // 自身のスコアが高い場合にアクセスが許可されること
      const comparison = await Scoring.compareScore(addr1.address, addr2.address);
      expect(comparison).to.equal(true); // addr1のスコアがaddr2より高い場合

      // 自身のスコアが低い場合にアクセスが拒否されること
      const comparison2 = await Scoring.compareScore(addr3.address, addr1.address);
      expect(comparison2).to.equal(false); // addr3のスコアがaddr1より低い場合
    });
  });

  describe("NFT取引と紐づくアクセス制御の確認", function () {
    it("ポリシー0（アクセス制御なし）が機能すること", async function () {
      const { SsdlabToken, addr1, addr2 } = await loadFixture(deployFixture);

      // ポリシーの設定
      await SsdlabToken.connect(addr2).setPolicy(0);

      // アクセス制御の確認
      const accessAllowed = await SsdlabToken.accessControl(addr1.address, addr2.address);
      expect(accessAllowed).to.equal(true);

      // トークンの発行と転送
      await mintAndTransferToken(SsdlabToken, addr1, addr2, "Policy0");
    });

    it("ポリシー1（高信頼ユーザー）が機能すること", async function () {
      const { SsdlabToken, owner, addr1, addr2 } = await loadFixture(deployFixture);

      // スコアの設定
      await SsdlabToken.connect(owner).rate(addr1.address, 80);
      await SsdlabToken.connect(owner).rate(addr2.address, 60);

      // ポリシーの設定
      await SsdlabToken.connect(addr1).setPolicy(1);
      await SsdlabToken.connect(addr2).setPolicy(1);

      // アクセス制御の確認
      const accessAllowed = await SsdlabToken.accessControl(addr1.address, addr2.address);
      expect(accessAllowed).to.equal(true); // 取引が成立する場合

      const accessDenied = await SsdlabToken.accessControl(addr2.address, addr1.address);
      expect(accessDenied).to.equal(false); // 取引がキャンセルされる場合

      // トークンの発行と転送
      await mintAndTransferToken(SsdlabToken, addr1, addr2, "Policy1");
      await expect(
        mintAndTransferToken(SsdlabToken, addr2, addr1, "Policy1")
      ).to.be.revertedWith("Transfer not allowed due to scoring rules"); // 取引が拒否されることを確認
    });

    it("ポリシー2（適応的ユーザー）が機能すること", async function () {
      const { SsdlabToken, owner, addr1, addr2 } = await loadFixture(deployFixture);

      // NFT取引の履歴を作成
      await mintAndTransferToken(SsdlabToken, addr1, addr2, "initialToken");

      // スコアの設定
      await SsdlabToken.connect(owner).rate(addr1.address, 60);
      await SsdlabToken.connect(owner).rate(addr2.address, 80);

      // ポリシーの設定
      await SsdlabToken.connect(addr1).setPolicy(2);
      await SsdlabToken.connect(addr2).setPolicy(2);

      // アクセス制御の確認
      const accessAllowed = await SsdlabToken.accessControl(addr1.address, addr2.address);
      expect(accessAllowed).to.equal(true); // 取引が成立する場合(スコアは低いが取引履歴があるため)

      const accessDenied = await SsdlabToken.accessControl(addr2.address, addr1.address);
      expect(accessDenied).to.equal(true); // 取引がキャンセルされる場合(スコアが高いため)

      // トークンの発行と転送
      await mintAndTransferToken(SsdlabToken, addr1, addr2, "Policy2");
      await mintAndTransferToken(SsdlabToken, addr2, addr1, "Policy2");
    });

    it("ポリシー3（フリーライダー）が機能すること", async function () {
      const { SsdlabToken, owner, addr1, addr2, addr3 } = await loadFixture(deployFixture);

      // スコアの設定
      await SsdlabToken.connect(owner).rate(addr1.address, 20);
      await SsdlabToken.connect(owner).rate(addr2.address, 10);
      await SsdlabToken.connect(owner).rate(addr3.address, 100);

      // ポリシーの設定
      await SsdlabToken.connect(addr1).setPolicy(3);
      await SsdlabToken.connect(addr2).setPolicy(3);

      // アクセス制御の確認
      const accessAllowed = await SsdlabToken.accessControl(addr1.address, addr2.address);
      expect(accessAllowed).to.equal(false); // 取引がキャンセルされる場合(スコアは高いが平均未満のため)

      // トークンの発行と転送
      await expect(
        mintAndTransferToken(SsdlabToken, addr1, addr2, "Policy3")
      ).to.be.revertedWith("Transfer not allowed due to scoring rules"); // 取引が拒否されることを確認
    });

    it("ポリシー4（孤立ユーザー）が機能すること", async function () {
      const { SsdlabToken, owner, addr1, addr2 } = await loadFixture(deployFixture);

      // スコアの設定
      await SsdlabToken.connect(owner).rate(addr1.address, 60);
      await SsdlabToken.connect(owner).rate(addr2.address, 40);

      // ポリシーの設定
      await SsdlabToken.connect(addr1).setPolicy(4);
      await SsdlabToken.connect(addr2).setPolicy(4);

      // アクセス制御の確認
      const accessAllowed = await SsdlabToken.accessControl(addr1.address, addr2.address);
      expect(accessAllowed).to.equal(false); // 取引が成立しない場合

      const accessDenied = await SsdlabToken.accessControl(addr2.address, addr1.address);
      expect(accessDenied).to.equal(false); // 取引がキャンセルされる場合

      // トークンの発行と転送
      await expect(
        mintAndTransferToken(SsdlabToken, addr1, addr2, "Policy4")
      ).to.be.revertedWith("Transfer not allowed due to scoring rules"); // 取引が拒否されることを確認
      await expect(
        mintAndTransferToken(SsdlabToken, addr2, addr1, "Policy4")
      ).to.be.revertedWith("Transfer not allowed due to scoring rules"); // 取引が拒否されることを確認
    });
  });
});
