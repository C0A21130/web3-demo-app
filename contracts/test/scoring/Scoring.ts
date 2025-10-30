import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

async function deployFixture() {
  const [owner, addr1, addr2, addr3] = await ethers.getSigners();
  const Scoring = await ethers.deployContract("Scoring", [owner.address]);
  const SsdlabToken = await ethers.deployContract("SsdlabToken", [owner.address, addr1.address]);
  return { Scoring, SsdlabToken, owner, addr1, addr2, addr3 };
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

    it("自身のスコアと相手のスコアを比較してアクセス制御できること", async function () {
      const { SsdlabToken, addr1, addr2, addr3 } = await loadFixture(deployFixture);
      
      // トークンの発行と転送
      let tx1 = await SsdlabToken.connect(addr1).safeMint(addr1.address, "tokenName1");
      let receipt1 = await tx1.wait();
      const transferEvent1 = receipt1?.logs.find(log => log.topics[0] === SsdlabToken.interface.getEvent("Transfer").topicHash);
      const tokenId1 = transferEvent1 ? parseInt(transferEvent1.topics[3], 16) : 0;
      await SsdlabToken.connect(addr1).transferFrom(addr1.address, addr2.address, tokenId1);

      let tx2 = await SsdlabToken.connect(addr1).safeMint(addr1.address, "tokenName2");
      let receipt2 = await tx2.wait();
      const transferEvent2 = receipt2?.logs.find(log => log.topics[0] === SsdlabToken.interface.getEvent("Transfer").topicHash);
      const tokenId2 = transferEvent2 ? parseInt(transferEvent2.topics[3], 16) : 0;
      await SsdlabToken.connect(addr1).transferFrom(addr1.address, addr3.address, tokenId2);

      // 自身のスコアが高い場合にアクセスが許可されること
      const comparison = await SsdlabToken.verifyScore(addr1.address, addr2.address);
      expect(comparison).to.equal(true); // addr1のスコアがaddr2より高い場合

      // 自身のスコアが低い場合にアクセスが拒否されること
      const comparison2 = await SsdlabToken.verifyScore(addr3.address, addr1.address);
      expect(comparison2).to.equal(false); // addr3のスコアがaddr1より低い場合
    });
  });
});
