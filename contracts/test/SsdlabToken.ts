import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { SsdlabToken__factory } from "../typechain-types";
import { token } from "../typechain-types/@openzeppelin/contracts";

async function deployFixture() {
    const [teacher, student1, student2] = await ethers.getSigners();
    const teacherAddress = await teacher.getAddress();
    const student1Address = await student1.getAddress();
    const student2Address = await student2.getAddress();
    const SsdlabToken = await ethers.deployContract("SsdlabToken", [teacherAddress, student1Address]);
    const balance = await SsdlabToken.balanceOf(student1Address);
    // console.log(balance);

    
    return { SsdlabToken, teacher, student1, student2 };
}


describe("TokenNameのsetとGet", function () {
    it("should set and get the token name correctly", async function () {
        const { SsdlabToken, teacher, student1 } = await loadFixture(deployFixture);
        const tokenName: any = "Frends Lost Token";
        
        // student1がNFTを発行数
        const tokenId = await SsdlabToken.safeMint(student1.address, tokenName);
        // console.log(ethers.formatEther(tokenId.value));
        // tokenIdが1になっているか確認
        expect(await SsdlabToken.balanceOf(student1.address)).to.equal(1);
        
        expect(await SsdlabToken.getTokenName(tokenId.value)).to.equal(tokenName);
    });
});