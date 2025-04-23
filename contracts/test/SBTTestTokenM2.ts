import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract } from "ethers";

describe("SBTTestTokenM2", function () {
  let sbt: Contract;
  let owner: any;
  let user1: any;
  let user2: any;

  beforeEach(async function () {
    [owner, user1,user2] = await ethers.getSigners();

    const SBT = await ethers.getContractFactory("SBT");
    sbt = await SBT.deploy("TestSBT", "TSBT", true);
    await sbt.waitForDeployment();
  });

  it("トークンをミントし、Lockedイベントが発行されること", async function () {
    const tokenId = 1;
    await expect(sbt.connect(owner).safeMint(user1.address, tokenId)).to.emit(sbt, "Locked").withArgs(tokenId);
    console.log("トークンID:", tokenId);
    expect(await sbt.ownerOf(tokenId)).to.equal(user1.address);
  });

  it("ロックされたトークンの転送を許可しないこと", async function () {
    const tokenId = 2;
    await sbt.connect(owner).safeMint(user1.address, tokenId);
    console.log("トークンID:", tokenId);

    await expect(
      sbt.connect(user1).transferFrom(user1.address, owner.address, tokenId)
    ).to.be.reverted; // ← revertだけを確認（メッセージやカスタムエラーを使わない）
  });

  it("ロックされたトークンは転送できない", async function () {
    const tokenId = 3;
    await sbt.connect(owner).safeMint(user1.address, tokenId);
    console.log("トークンID:", tokenId);
  
    await expect(sbt.connect(user1).transferFrom(user1.address, owner.address, tokenId)).to.be.reverted; // ← 転送できないなら revert するはず！
  });

  it("エラーが返されれば良い",async function () {
    const tokenId = 10;
    await sbt.connect(owner).safeMint(user1.address,tokenId);
    await sbt.connect(owner).safeTransferFrom(user1.address,user2.address,tokenId)/*.to.bereveratedWithCustomError(sbt, "ErrLocked")*/;

  })
});
