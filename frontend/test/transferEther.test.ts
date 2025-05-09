import { describe, it, expect } from "@jest/globals";
import localStorageMock from "./localStorage";
import getWallet from '../src/components/getWallet';
import { ethers, formatEther } from 'ethers';
import transferEther  from '../src/components/transferEther';

const rpcUrl = 'http://localhost:8545';
const ownerKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

describe('transferEther', () => {
    it('TransferEther from Teacher to Student', async () => {
        const localStorage = localStorageMock;
        const studentWallet = await getWallet(rpcUrl, localStorage);
        if (studentWallet == undefined) { return; }
        const provider = studentWallet.provider;
        if (provider == undefined) { return; }
        const teacherWallet = new ethers.Wallet(ownerKey, provider);

        // Send ether
        const studentAddress = await studentWallet.getAddress();
        try{
            await transferEther(teacherWallet, studentAddress, "0.1");
            const studentBalance = await provider.getBalance(studentAddress);
            expect(formatEther(studentBalance)).toEqual("0.1");
        } catch (error) {
            console.error(error);
        }   
    });
});