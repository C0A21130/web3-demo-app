import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

// スマートコントラクトのデプロイ
async function deployFixture() {
  const [owner, account1, account2] = await ethers.getSigners();
  const ownerAddress = await owner.getAddress();
  const contract = await ethers.deployContract("MyToken", [ownerAddress]);
  return { contract, owner, account1, account2 };
}

describe("課題1", function () {
  it("問題1", async function () {
    // オーナー（owner）がNFTを発行するテスト
    // const { contract, account1} = await deployFixture();

    // let tokenName: any = 0;
    // const tx1 = await contract.safeMint(account1.address, tokenName);
    // await tx1.wait();
    
    // スマートコントラクトをデプロイするためのTypeScriptコード
  })

  it("問題2", async function () {
    // オーナーが発行したNFTを Aさん に送信するテスト
    const { contract, owner, account1 } = await deployFixture();
    const tokenName: any = 0;

    // オーナーがNFTを発行
    const tx1 = await contract.safeMint(owner.address, tokenName);
    await tx1.wait();

    // オーナーがAさんにNFTを送信
    const tx2 = await contract.transferFrom(owner.address, account1.address, 0);
    await tx2.wait();

    // AさんがNFTを受け取ったか確認
    expect(await contract.balanceOf(account1.address)).to.equal(1);
    expect(await contract.balanceOf(owner.address)).to.equal(0);
    expect(await contract.ownerOf(0)).to.equal(account1.address);
  })

  it("問題3", async function () {
    // Aさん が受け取ったNFTを Bさん に送信するテスト
    const { contract, owner, account1, account2 } = await deployFixture();
    const tokenName: any = 0;

    // オーナーがNFTを発行
    const tx1 = await contract.safeMint(owner.address, tokenName);
    await tx1.wait();

    // オーナーがAさんにNFTを送信
    const tx2 = await contract.transferFrom(owner.address, account1.address, 0);
    await tx2.wait();

    // AさんがNFTを受け取ったか確認
    expect(await contract.balanceOf(account1.address)).to.equal(1);
    expect(await contract.balanceOf(owner.address)).to.equal(0);
    expect(await contract.ownerOf(0)).to.equal(account1.address);

    // AさんがBさんにNFTを送信
    const tx3 = await contract.connect(account1).transferFrom(account1.address, account2.address, 0);
    await tx3.wait();   

    // BさんがNFTを受け取ったか確認
    expect(await contract.balanceOf(account2.address)).to.equal(1);
    expect(await contract.balanceOf(account1.address)).to.equal(0);
    expect(await contract.ownerOf(0)).to.equal(account2.address);
  })
});

describe("課題2", function () {
  it("問題1", async function () {
    // オーナー（owner）がAさんのアドレスにNFTを発行するテスト
    const { contract, account1, account2} = await deployFixture();
    let tokenName: any = 0;
  })

  it("問題2", async function () {
    // オーナー（owner）がAさんのアドレスにNFTを発行するテスト
    const { contract, account1, account2} = await deployFixture();
    let tokenName: any = 0;


    // NFTの発行 オーナー（owner）がAさんのアドレスにNFTを発行する。
    const tx1 = await contract.safeMint(account1.address, tokenName);
    await tx1.wait();

    // NFTの送信 AさんのNFTを Bさん に送信する。
    const tx2 = await contract.connect(account1).transferFrom(account1.address, account2.address, 0);
    await tx2.wait();   

    // BさんがNFTを受け取ったか確認
    expect(await contract.balanceOf(account2.address)).to.equal(1);
    expect(await contract.balanceOf(account1.address)).to.equal(0);
    expect(await contract.ownerOf(0)).to.equal(account2.address);
    })
})
