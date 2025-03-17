import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { SsdlabToken__factory } from "../typechain-types";
import { token } from "../typechain-types/@openzeppelin/contracts";

async function deployFixture() {
    const [teacher, student1, student2] = await ethers.getSigners();
    const teacherAddress = await teacher.getAddress();
    const student1Address = await student1.getAddress();
    // const student2Address = await student2.getAddress(); // Removed as it's unused
    const SsdlabToken = await ethers.deployContract("SsdlabToken", [teacherAddress, student1Address]);
    
    return { SsdlabToken, teacher, student1, student2 };
}

describe("Etherのtransfer", function () {
    it("should set and get the token name correctly", async function () {
        const { teacher, student1 } = await loadFixture(deployFixture);
        const balancet = await ethers.provider.getBalance(teacher.address);
        console.log(balancet);
        // teacherがstudent1にEtherを送る
        await teacher.sendTransaction({
        to: student1.address,
        value: ethers.parseEther("5.0"), 
        });
        const balance = await ethers.provider.getBalance(student1.address);
        console.log(balance);
    });
});