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
    
    return { SsdlabToken, teacher, student1, student2 };
}

describe("NFTのtransfer", function () {
    it("should set and get the token name correctly", async function () {
        const { SsdlabToken, teacher, student1, student2 } = await loadFixture(deployFixture);
        const tokenName: any = "Frends Lost Token";

        // student1がアドレスを登録
        await SsdlabToken.setUserAddress("student1",student1.address);
        // student2がアドレスを登録
        await SsdlabToken.setUserAddress("student2",student2.address);
        
        // アドレスが登録されているか確認
        // 登録したアドレスと取得したアドレスが一致しているか確認
        expect(await SsdlabToken.getUserAddress("student1")).to.equal(student1.address);
        expect(await SsdlabToken.getUserAddress("student2")).to.equal(student2.address);
        
        // student1がNFTを発行数
        const tokenId = await SsdlabToken.connect(student1).safeMint(student1.address, tokenName);
        
        // tokenIdが1になっているか確認
        expect(await SsdlabToken.balanceOf(student1.address)).to.equal(1);
        
        expect(await SsdlabToken.getTokenName(tokenId.value)).to.equal(tokenName);

        // student1がstudent2にNFTを送る
        await SsdlabToken.connect(student1).safeTransferFrom(student1.address, student2.address, tokenId.value);

        // student2がNFTを受け取ったか確認
        expect(await SsdlabToken.balanceOf(student2.address)).to.equal(1);
    });

});
