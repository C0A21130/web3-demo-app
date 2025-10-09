import { describe, it, expect } from "@jest/globals";
import localStorageMock from "./localStorage";
import getWallet from '../src/components/getWallet';
import { Wallet, formatEther } from 'ethers';
import transferEther from '../src/components/transferEther';

const rpcUrls = ['http://localhost:8545'];
const ownerKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('transferEther', () => {
    it('should transfer ether from teacher to student', async () => {
        const localStorage = localStorageMock;
        const studentWallet = await getWallet(rpcUrls, localStorage);
        if (studentWallet == undefined) { return; }
        const provider = studentWallet.wallet.provider;
        if (provider == undefined) { return; }
        const teacherWallet = new Wallet(ownerKey, provider);

        // Send ether
        await transferEther(teacherWallet, studentWallet.wallet, 0.1);
        await delay(500);
        const studentBalance = await provider.getBalance(studentWallet.wallet.address);
        expect(formatEther(studentBalance)).toEqual("0.1");
    });

    it('should cancel consecutive remittances when student already has sufficient balance', async () => {
        const localStorage = localStorageMock;
        const studentWallet = await getWallet(rpcUrls, localStorage);
        if (studentWallet == undefined) { return; }
        const provider = studentWallet.wallet.provider;
        if (provider == undefined) { return; }
        const teacherWallet = new Wallet(ownerKey, provider);

        // Send ether
        let result = await transferEther(teacherWallet, studentWallet.wallet, 0.1);
        const balance = await provider.getBalance(studentWallet.wallet.address);
        expect(formatEther(balance)).toEqual("0.1");
        await delay(500);
        result = await transferEther(teacherWallet, studentWallet.wallet, 0.1);
        expect(result).toEqual(`残高は十分です`);
    });
});