import { expect } from "chai";
import { network } from "hardhat";
import type { MemberSbtDemo } from "../types/ethers-contracts/index.js";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/types";

const { ethers } = await network.connect();

describe("MemberSbtDemo", function () {
  let demoSbt: MemberSbtDemo;
  let owner: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    const MemberSBTDemoFactory = await ethers.getContractFactory("MemberSbtDemo");
    
    demoSbt = await MemberSBTDemoFactory.deploy(
      "DemoSBT",
      "DSBT",
      true,
      owner.address
    );
  });

  describe("Public Minting", function () {

    it("✅ 誰でも自分自身にSBTを発行できる", async function () {
      const userName = "Test User 1";
      const expectedTokenId = 0;

      await expect(demoSbt.connect(user1).safeMint(user1.address, userName))
        .to.emit(demoSbt, "SBTMinted")
        .withArgs(user1.address, expectedTokenId, userName);

      expect(await demoSbt.ownerOf(expectedTokenId)).to.equal(user1.address);
      expect(await demoSbt.getUserName(expectedTokenId)).to.equal(userName);
    });

    it("❌ 他人にはSBTを発行できない", async function () {
      const userName = "Malicious User";

      await expect(
        demoSbt.connect(user1).safeMint(user2.address, userName)
      ).to.be.revertedWith("MemberSbtDemo: You can only mint an SBT for yourself.");
    });

    it("❌ 同じアドレスは2回SBTを発行できない", async function () {
      await demoSbt.connect(user1).safeMint(user1.address, "First Badge");

      await expect(
        demoSbt.connect(user1).safeMint(user1.address, "Second Badge")
      ).to.be.revertedWith("MemberSbtDemo: SBT already issued for this address.");
    });

    it("🚫 発行されたSBTは譲渡できない", async function () {
      await demoSbt.connect(user1).safeMint(user1.address, "Test User 1");

      await expect(
        demoSbt.connect(user1).transferFrom(user1.address, user2.address, 0)
      ).to.be.revertedWithCustomError(demoSbt, 'ErrLocked');
    });

    it("🚫 既に発行されたSBTの所有者かどうかを検証する", async function () {
      const userName = "Test User 1";
      const expectedTokenId = 0;

      await demoSbt.connect(user1).safeMint(user1.address, userName);

      expect(await demoSbt.verifyCredential(expectedTokenId, user1.address)).to.be.true;
      expect(await demoSbt.verifyCredential(expectedTokenId, user2.address)).to.be.false;
    });

    it("✅ hasCredentialで発行済み状態を確認できる", async function () {
      expect(await demoSbt.hasCredential(user1.address)).to.be.false;
      await demoSbt.connect(user1).safeMint(user1.address, "Test User 1");
      expect(await demoSbt.hasCredential(user1.address)).to.be.true;
      expect(await demoSbt.hasCredential(user2.address)).to.be.false;
    });
  });
});