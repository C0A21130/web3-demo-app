import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

async function deployFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const ownerAddress = await owner.getAddress();
    const SsdlabToken = await ethers.deployContract("SsdlabToken", [ownerAddress]);
    return { SsdlabToken, owner, addr1, addr2 };
}

describe("SsdlabToken Contract", function () {
    it("NFTの発行", async function () {
        const { SsdlabToken, addr1, addr2 } = await loadFixture(deployFixture);

        // addr1がNFTを発行
        let tokenName: any = "Test Base Token";
        const tx1 = await SsdlabToken.safeMint(addr1.address, tokenName);
        await tx1.wait();

        // NFTの発行が成功しているか確認
        expect(await SsdlabToken.balanceOf(addr1.address)).to.equal(1);
        expect(await SsdlabToken.getTokenName(0)).to.equal(tokenName);
        
        // addr2がNFTを発行(with IPFS)
        tokenName = "Test IPFS Token";
        const tokenURI = "http://localhost:5001/api/v0/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
        const tokenID= await SsdlabToken.safeMintIPFS(addr2.address, tokenName, tokenURI);
    
        // NFTの発行が成功しているか確認
        expect(await SsdlabToken.balanceOf(addr2.address)).to.equal(1);
        expect(await SsdlabToken.getTokenName(1)).to.equal(tokenName);
        expect(await SsdlabToken.getTokenURI(1)).to.equal(tokenURI);
    });

    it("NFTの発行と転送", async function () {
        const { SsdlabToken, addr1, addr2 } = await loadFixture(deployFixture);
        const tokenName = "Test Transfer Token";

        // addr1がNFTを発行
        await SsdlabToken.connect(addr1).safeMint(addr1.address, tokenName);

        // NFTの発行が成功しているか確認
        expect(await SsdlabToken.balanceOf(addr1.address)).to.equal(1);
        expect(await SsdlabToken.getTokenName(0)).to.equal(tokenName);

        // addr1がaddr2にNFTを送る
        await SsdlabToken.connect(addr1).transferFrom(addr1.address, addr2.address, 0);

        // addr2がNFTを受け取ったか確認
        expect(await SsdlabToken.balanceOf(addr2.address)).to.equal(1);
        expect(await SsdlabToken.balanceOf(addr1.address)).to.equal(0);
        expect(await SsdlabToken.ownerOf(0)).to.equal(addr2.address);
    });
});