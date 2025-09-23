import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Scoring } from "../../typechain-types";

async function deployFixture() {
  const [owner, addr1, addr2] = await ethers.getSigners();
  const Scoring = await ethers.deployContract("Scoring", [addr1]);
  return { Scoring, owner, addr1, addr2 };
}

describe("Scoring Contract", function () {
  describe("デプロイメント", function () {
    it("コントラクトが正しくデプロイされること", async function () {
      const { Scoring } = await loadFixture(deployFixture);
      expect(Scoring).to.exist;
      expect(await Scoring.getUserCount()).to.equal(0);
    });
  });

  describe("スコア管理", function () {
    it("新しいオペレーターを追加できること", async function () {
      const { Scoring, addr1, addr2 } = await loadFixture(deployFixture);
      await Scoring.connect(addr1).setOperator(addr2.address);
    });

    it("新しいスコアを追加・削除できること", async function () {
      const { Scoring, addr1, addr2 } = await loadFixture(deployFixture);
      await Scoring.connect(addr1).rate(addr2.address, 100);
      expect(await Scoring.ratingOf(addr2.address)).to.equal(100);
      await Scoring.connect(addr1).removeRating(addr2.address);
      expect(await Scoring.ratingOf(addr2.address)).to.equal(0);
    });
  });
});
