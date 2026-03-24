import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

async function deployFixture() {
  const [owner, addr1, addr2, addr3] = await ethers.getSigners();
  const Rating = await ethers.deployContract("TrustRating", [owner.address]);
  return { Rating, owner, addr1, addr2, addr3 };
}

describe("TrustRating Contract", function () {
  it("新しいオペレーターを追加できること", async function () {
    const { Rating, owner, addr1 } = await deployFixture();
    await Rating.connect(owner).setOperator(addr1.address);
  });

  it("スコアを登録・削除・取得できること", async function () {
    const { Rating, owner, addr1 } = await deployFixture();
    
    // スコアの登録
    await Rating.connect(owner).rate(addr1.address, 85);
    const score = await Rating.ratingOf(addr1.address);
    expect(score).to.equal(85);

    // スコアの削除
    await Rating.connect(owner).removeRating(addr1.address);
    const removedScore = await Rating.ratingOf(addr1.address);
    expect(removedScore).to.equal(0);
  });

  it("オペレーター以外がスコアを登録・削除できないこと", async function () {
    const { Rating, addr1, addr2 } = await deployFixture();
    
    // スコアの登録を試みる
    await expect(
      Rating.connect(addr1).rate(addr2.address, 90)
    ).to.be.revertedWith("Caller is not the operator");

    // スコアの削除を試みる
    await expect(
      Rating.connect(addr1).removeRating(addr2.address)
    ).to.be.revertedWith("Caller is not the operator");
  });

  it("-127から127の範囲外のスコアを登録できないこと", async function () {
    const { Rating, owner, addr1 } = await deployFixture();
    
    // 範囲外のスコアの登録を試みる
    await expect(
      Rating.connect(owner).rate(addr1.address, -128)
    ).to.be.revertedWith("Rating must be between -127 and 127");

    // 境界値のスコアが登録可能であることを確認
    await Rating.connect(owner).rate(addr1.address, 127);
    let score = await Rating.ratingOf(addr1.address);
    expect(score).to.equal(127);

    await Rating.connect(owner).rate(addr1.address, -127);
    score = await Rating.ratingOf(addr1.address);
    expect(score).to.equal(-127);
  });
});
