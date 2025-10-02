import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

async function deployFixture() {
  const [owner, addr1, addr2] = await ethers.getSigners();
  const Scoring = await ethers.deployContract("Scoring", [owner.address]);
  const SsdlabToken = await ethers.deployContract("SsdlabToken", [owner.address, addr1.address]);
  return { Scoring, SsdlabToken, owner, addr1, addr2 };
}

describe("Scoring Contract", function () {
  describe("デプロイメント", function () {
    it("コントラクトが正しくデプロイされること", async function () {
      const { Scoring } = await loadFixture(deployFixture);
      expect(Scoring).to.exist;
      expect(await Scoring.getUserCount()).to.equal(0);
    });
  });

  describe("Trust Score Agentによるスコア管理", function () {
    it("新しいオペレーターを追加できること", async function () {
      const { Scoring, owner, addr1 } = await loadFixture(deployFixture);
      await Scoring.connect(owner).setOperator(addr1.address);
    });

    it("スコアを登録・削除・取得できること", async function () {
      const { Scoring, owner, addr1 } = await loadFixture(deployFixture);
      
      // スコアの登録
      await Scoring.connect(owner).rate(addr1.address, 85);
      const score = await Scoring.ratingOf(addr1.address);
      expect(score).to.equal(85);

      // スコアの削除
      await Scoring.connect(owner).removeRating(addr1.address);
      const removedScore = await Scoring.ratingOf(addr1.address);
      expect(removedScore).to.equal(0);
    });
  });

  describe("スマートコントラクトによるスコアの算出", function () {
    it("トークン発行に紐づけて取引履歴管理とスコア算出可能なこと", async function () {
      const { SsdlabToken, addr1, addr2 } = await loadFixture(deployFixture);
      
      // トークンの発行と転送
      let tx = await SsdlabToken.connect(addr1).safeMint(addr1.address, "tokenName1");
      let receipt = await tx.wait();
      const transferEvent = receipt?.logs.find(log => log.topics[0] === SsdlabToken.interface.getEvent("Transfer").topicHash);
      const tokenId = transferEvent ? parseInt(transferEvent.topics[3], 16) : 0;
      await SsdlabToken.connect(addr1).transferFrom(addr1.address, addr2.address, tokenId);

      // スコアの取得
      const score = await SsdlabToken.getScore(addr1.address);
      expect(score).to.equal(100);
    });
  });
});
