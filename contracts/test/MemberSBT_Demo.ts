// ----------------------------------------------------------------
// ■ 概要とインポート
// ----------------------------------------------------------------
// MemberSBT_Demo.sol スマートコントラクトをテストするためのスクリプトです。
// ----------------------------------------------------------------
import { expect } from "chai";
import { ethers } from "hardhat";
import { MemberSBT_Demo } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

// ----------------------------------------------------------------
// ■ テストスイートの定義
// ----------------------------------------------------------------
describe("MemberSBT_Demo", function () {
  let demoSbt: MemberSBT_Demo;
  let owner: HardhatEthersSigner; // 管理者
  let user1: HardhatEthersSigner;  // 一般ユーザー1
  let user2: HardhatEthersSigner;  // 一般ユーザー2

  // ----------------------------------------------------------------
  // ■ `beforeEach`フック (事前準備)
  // ----------------------------------------------------------------
  // 各テストの直前に、新しいコントラクトをデプロイします。
  // ----------------------------------------------------------------
  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    // "MemberSBT_Demo" という名前のコントラクトをデプロイ
    const MemberSBTDemoFactory = await ethers.getContractFactory("MemberSBT_Demo");
    
    demoSbt = await MemberSBTDemoFactory.deploy(
      "DemoSBT",
      "DSBT",
      true, // isLocked = true
      owner.address
    );
  });

  // ----------------------------------------------------------------
  // ■ テストグループ: Public Minting (誰でも発行できる機能)
  // ----------------------------------------------------------------
  describe("Public Minting", function () {

    it("✅ 誰でも自分自身にSBTを発行できる", async function () {
      const userName = "Test User 1";
      const expectedTokenId = 0;

      // user1が、自分自身(user1.address)にSBTを発行する
      // このトランザクションが成功し、SBTMintedイベントが正しく発行されることを検証します
      await expect(demoSbt.connect(user1).safeMint(user1.address, userName))
        .to.emit(demoSbt, "SBTMinted")
        .withArgs(user1.address, expectedTokenId, userName);

      // 発行されたSBTの所有者がuser1であることを確認
      expect(await demoSbt.ownerOf(expectedTokenId)).to.equal(user1.address);
      // ユーザー名が正しく記録されていることを確認
      expect(await demoSbt.getUserName(expectedTokenId)).to.equal(userName);
    });

    it("❌ 他人にはSBTを発行できない", async function () {
      const userName = "Malicious User";

      // user1が、他人であるuser2のアドレスを指定してSBTを発行しようとする
      // このトランザクションが、コントラクトの `require` 文で設定したエラーメッセージで
      // 失敗すること(revert)を検証します
      await expect(
        demoSbt.connect(user1).safeMint(user2.address, userName)
      ).to.be.revertedWith("MemberSBT_Demo: You can only mint an SBT for yourself.");
    });

    it("🚫 発行されたSBTは譲渡できない", async function () {
        // まず、user1が自分用にSBTを発行する
        await demoSbt.connect(user1).safeMint(user1.address, "Test User 1");
  
        // その後、user1がuser2にSBTを転送しようとする
        // このトランザクションが `ErrLocked` エラーで失敗することを検証します
        await expect(
          demoSbt.connect(user1).transferFrom(user1.address, user2.address, 0)
        ).to.be.revertedWithCustomError(demoSbt, 'ErrLocked');
      });
  });
});