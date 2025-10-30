import { describe, it, expect } from "@jest/globals";
import localStorageMock from "./localStorage";
import getWallet from '../src/components/getWallet';
import { formatEther } from 'ethers';
import transferEther from '../src/components/transferEther';

const rpcUrls = ['http://localhost:8545'];
const scoringEndpointUrl = 'http://localhost:5000';
const ownerKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('TransferEther', () => {
    it('getWallet関数を利用して送金できることを確認する(ownerKeyあり)', async () => {

        // ウォレットの作成
        const localStorage = localStorageMock;
        const wallet = await getWallet(rpcUrls, localStorage);
        if (wallet == null) {
            throw new Error("Failed to create wallet");
        }

        // 送金処理の実行
        const result = await transferEther(ownerKey, wallet.wallet, "");
        await delay(500);
        expect(result).toBe(true);

        // 送金先ウォレットの残高確認
        const provider = wallet.wallet.provider;
        if (provider == null) {
            throw new Error("Provider is not set for the wallet");
        }
        const balance = await provider.getBalance(wallet.wallet.address);
        expect(formatEther(balance)).toEqual("0.1");
    });

    it('getWallet関数を利用して送金できることを確認する(ownerKeyなし)', async () => {
        // ウォレットの作成
        const localStorage = localStorageMock;
        const wallet = await getWallet(rpcUrls, localStorage);
        if (wallet == null) {
            throw new Error("Failed to create wallet");
        }
        if (scoringEndpointUrl === "http://localhost:5000") { 
            console.error("Scoring endpoint URL is not set");
        }

        // 送金処理の実行
        const result = await transferEther('', wallet.wallet, scoringEndpointUrl);
        await delay(500);
        expect(result).toBe(true);

        // 送金先ウォレットの残高確認
        const provider = wallet.wallet.provider;
        if (provider == null) {
            throw new Error("Provider is not set for the wallet");
        }
        const balance = await provider.getBalance(wallet.wallet.address);
        expect(formatEther(balance)).toEqual("0.1");
    });
});