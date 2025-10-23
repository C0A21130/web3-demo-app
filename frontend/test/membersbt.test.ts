import { describe, it } from "@jest/globals";
import { ethers, JsonRpcProvider } from 'ethers';
import mintMemberSBT from './../src/components/MemberSBTmint';

const rpcUrl = 'http://127.0.0.1:8545';
const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';


describe("課題２", () => {
    it("問題１", async () => {
        const provider = new JsonRpcProvider(rpcUrl);
        const wallet = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);

        const tokenName = "testToken";
        const tx = await mintMemberSBT(wallet, contractAddress, tokenName);
        console.log("トークンの中身：", tx);
        console.log("トークンID：", tx.logs[0].args.tokenId.toString());
        // console.log("トークンの中身：", tx);
    }, 30000);
});