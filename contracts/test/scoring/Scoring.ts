import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { HDNodeWallet } from "ethers";
import { ethers } from "hardhat";

async function deployFixture() {
  const [owner, addr1, addr2, addr3] = await ethers.getSigners();
  const Scoring = await ethers.deployContract("Scoring");
  const Rating = await ethers.deployContract("Rating", [owner.address]);
  const SsdlabToken = await ethers.deployContract("SsdlabToken", [owner.address]);
  return { Scoring, Rating, SsdlabToken, owner, addr1, addr2, addr3 };
}

describe("Scoring Contract", function () {
  describe("Trust Score Agentによるスコア管理", function () {
    it("新しいオペレーターを追加できること", async function () {
      const { Rating, owner, addr1 } = await loadFixture(deployFixture);
      await Rating.connect(owner).setOperator(addr1.address);
    });

    it("スコアを登録・削除・取得できること", async function () {
      const { Rating, owner, addr1 } = await loadFixture(deployFixture);
      
      // スコアの登録
      await Rating.connect(owner).rate(addr1.address, 85);
      const score = await Rating.ratingOf(addr1.address);
      expect(score).to.equal(85);

      // スコアの削除
      await Rating.connect(owner).removeRating(addr1.address);
      const removedScore = await Rating.ratingOf(addr1.address);
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

    it("自身のスコアと相手のスコアを比較できること", async function () {
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

    it("信用スコアに基づくアクセス制御が機能すること", async function () {
      const { SsdlabToken, addr1, addr2, addr3 } = await loadFixture(deployFixture);
      
      // 複数アドレスの作成
      const addrArray: HDNodeWallet[] = [];
      for (let i = 0; i < 15; i++) {
        const wallet = ethers.Wallet.createRandom().connect(ethers.provider);
        addrArray.push(wallet);
      }
      const addressList = Array.from({ length: 50 }, (_, i) => i); // 0から49までの配列

      // トークンの発行と転送
      await Promise.all(addressList.map(async (addr, index) => {
        const tx = await SsdlabToken.safeMint(addr1.address, `tokenName${index + 1}`);
        const receipt = await tx.wait();
        const transferEvent = receipt?.logs.find(log => log.topics[0] === SsdlabToken.interface.getEvent("Transfer").topicHash);
        const tokenId = transferEvent ? parseInt(transferEvent.topics[3], 16) : 0;
        const randomAddr = addrArray[Math.floor(Math.random() * addrArray.length)];
        await SsdlabToken.connect(addr1).transferFrom(addr1.address, randomAddr.address, tokenId);
      }));

      // アクセス制御の確認
      const accessAllowed = await SsdlabToken.accessControl(addr1.address, addr2.address);
      expect(accessAllowed).to.equal(true); // 取引が成立する場合
      const accessDenied = await SsdlabToken.accessControl(addr3.address, addr1.address);
      expect(accessDenied).to.equal(false); // 取引がキャンセルされる場合
    });
  });
});
