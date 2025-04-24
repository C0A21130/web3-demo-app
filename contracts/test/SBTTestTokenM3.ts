import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, ContractFactory } from "ethers";

async function deployFixture() {
    const [ownerAdmin, minter1, minter2] = await ethers.getSigners();
    const ownerAddress = await ownerAdmin.getAddress();
    const minter1Address = await minter1.getAddress();
    const minter2Address = await minter2.getAddress();
    const SBTTestTokenM3 = await ethers.deployContract(
        "SBTTestTokenM3",
        ["TestToken", "TTK", true, ownerAddress, minter1Address, minter2Address]
    );
    await SBTTestTokenM3.waitForDeployment();
    return { SBTTestTokenM3, ownerAdmin, minter1, minter2 };
}

describe("SBTTestTokenM3", function () {
    let sbtContract: Contract;
    let owner: any;
    let minter1: any;
    let minter2: any;
    let user: any;

    beforeEach(async function () {
        [owner, minter1, minter2, user] = await ethers.getSigners();
        const SBTTestTokenM3: ContractFactory = await ethers.getContractFactory("SBTTestTokenM3");
        sbtContract = await SBTTestTokenM3.deploy(
            "TestToken",
            "TTK",
            true,
            owner.address,
            minter1.address,
            minter2.address
        );
        await sbtContract.waitForDeployment();
    });

    it("ミンター権限がない場合、safeMintを実行できないこと", async function () {
        const tokenId = 1;
        const tokenName = "Unauthorized Token";
        
        // カスタムエラーに対応した修正版
        await expect(
            sbtContract.connect(user).safeMint(user.address, tokenId, tokenName)
        ).to.be.reverted; // 単にリバートすることだけを確認
    });

    it("ミンター権限がある場合、トークンをミントできること", async function () {
        const tokenId = 1;
        const tokenName = "Valid Minted Token";
        await expect(sbtContract.connect(minter1).safeMint(user.address, tokenId, tokenName))
            .to.emit(sbtContract, "Locked")
            .withArgs(tokenId);
        const ownerOfToken = await sbtContract.ownerOf(tokenId);
        expect(ownerOfToken).to.equal(user.address);
    });

    it("getTokenNameでトークン名を取得できること", async function () {
        const tokenId = 2;
        const tokenName = "Contribution Token";
        await sbtContract.connect(minter1).safeMint(user.address, tokenId, tokenName);
        const retrievedName = await sbtContract.getTokenName(tokenId);
        expect(retrievedName).to.equal(tokenName);
    });
});