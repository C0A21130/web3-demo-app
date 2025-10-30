import { describe, it, expect, beforeAll } from "@jest/globals";
import { ethers, JsonRpcProvider } from 'ethers';
import fetchCredential from '../src/components/credential/fetchCredential';
import issueCredential from '../src/components/credential/issueCredential';
import verifyCredential from '../src/components/credential/verifyCredential';

const rpcUrl = 'http://127.0.0.1:8545';
const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

describe('Credential API - SBT認証情報テスト', () => {
    let provider: JsonRpcProvider;
    let wallet1: ethers.Wallet;
    let wallet2: ethers.Wallet;

    beforeAll(async () => {
        provider = new JsonRpcProvider(rpcUrl);
        
        wallet1 = new ethers.Wallet(
            "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
            provider
        );
        wallet2 = new ethers.Wallet(
            "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
            provider
        );

        try {
            await issueCredential(wallet1, contractAddress, "テストユーザー1");
            await delay(500);
            await issueCredential(wallet1, contractAddress, "山田太郎");
            await delay(500);
            await issueCredential(wallet2, contractAddress, "テストユーザー2");
            await delay(500);
        } catch (error) {
            console.log('SBT発行済み、またはエラー:', error);
        }
    }, 60000);

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    describe('issueCredential (SBT発行)', () => {
        it('SBTを発行してUserCredentialを返す', async () => {
            const testUserName = `発行テスト_${Date.now()}`;
            
            const credential = await issueCredential(wallet1, contractAddress, testUserName);
            await delay(500);

            expect(credential).toHaveProperty('tokenId');
            expect(credential).toHaveProperty('userName');
            expect(credential).toHaveProperty('address');
            expect(credential).toHaveProperty('trustScore');
            
            expect(typeof credential.tokenId).toBe('number');
            expect(credential.tokenId).toBeGreaterThanOrEqual(0);
            expect(credential.userName).toBe(testUserName);
            expect(credential.address.toLowerCase()).toBe(wallet1.address.toLowerCase());
            expect(credential.trustScore).toBe(0);

            console.log(`✅ 発行されたSBT: Token ID ${credential.tokenId}, ${credential.userName}`);
        }, 30000);

        it('複数のSBTを連続で発行できる', async () => {
            const userName1 = `連続発行1_${Date.now()}`;
            const userName2 = `連続発行2_${Date.now()}`;
            
            const cred1 = await issueCredential(wallet2, contractAddress, userName1);
            await delay(500);
            const cred2 = await issueCredential(wallet2, contractAddress, userName2);
            await delay(500);

            expect(cred1.tokenId).not.toBe(cred2.tokenId);
            expect(cred1.userName).toBe(userName1);
            expect(cred2.userName).toBe(userName2);
            expect(cred1.address).toBe(cred2.address);
            
            console.log(`✅ 連続発行成功: Token ID ${cred1.tokenId} と ${cred2.tokenId}`);
        }, 30000);

        it('無効なコントラクトアドレスでエラーをthrowする', async () => {
            const invalidAddress = "invalid_address";
            
            await expect(
                issueCredential(wallet1, invalidAddress, "テスト")
            ).rejects.toThrow('Invalid contract address');
        }, 10000);

        it('空のユーザー名でエラーをthrowする', async () => {
            await expect(
                issueCredential(wallet1, contractAddress, "")
            ).rejects.toThrow('User name is required');

            await expect(
                issueCredential(wallet1, contractAddress, "   ")
            ).rejects.toThrow('User name is required');
        }, 10000);
    });

    describe('fetchCredential (認証情報取得)', () => {
        it('全SBT認証情報を配列で取得できる', async () => {
            const credentials = await fetchCredential(wallet1, contractAddress);

            expect(Array.isArray(credentials)).toBe(true);
            expect(credentials.length).toBeGreaterThan(0);

            console.log(`📊 取得した認証情報: ${credentials.length} 件`);

            credentials.forEach(cred => {
                expect(cred).toHaveProperty('tokenId');
                expect(cred).toHaveProperty('userName');
                expect(cred).toHaveProperty('address');
                expect(cred).toHaveProperty('trustScore');
                expect(typeof cred.tokenId).toBe('number');
                expect(typeof cred.userName).toBe('string');
                expect(typeof cred.address).toBe('string');
                expect(typeof cred.trustScore).toBe('number');
                expect(cred.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
            });
        }, 30000);

        it('UserCredential型の構造が正しい', async () => {
            const credentials = await fetchCredential(wallet1, contractAddress);
            
            if (credentials.length > 0) {
                const firstCred = credentials[0];
                expect(Object.keys(firstCred)).toEqual(
                    expect.arrayContaining(['tokenId', 'userName', 'address', 'trustScore'])
                );
                expect(Object.keys(firstCred).length).toBe(4);
            }
        }, 30000);

        it('無効なコントラクトアドレスでエラーをthrowする', async () => {
            const invalidAddress = "invalid_address";
            
            await expect(
                fetchCredential(wallet1, invalidAddress)
            ).rejects.toThrow('Invalid contract address');
        }, 10000);

        it('プロバイダーがない場合にエラーをthrowする', async () => {
            const walletWithoutProvider = new ethers.Wallet(
                "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
            );
            
            await expect(
                fetchCredential(walletWithoutProvider as any, contractAddress)
            ).rejects.toThrow('Wallet provider is not available');
        }, 10000);
    });

    describe('issueCredential & fetchCredential 統合テスト', () => {
        it('発行したSBTが即座に取得できる', async () => {
            const testUserName = `統合テスト_${Date.now()}`;
            
            const issuedCred = await issueCredential(wallet1, contractAddress, testUserName);
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const allCredentials = await fetchCredential(wallet1, contractAddress);
            
            const foundCred = allCredentials.find(c => c.tokenId === issuedCred.tokenId);
            expect(foundCred).toBeDefined();
            
            if (foundCred) {
                expect(foundCred.tokenId).toBe(issuedCred.tokenId);
                expect(foundCred.userName).toBe(issuedCred.userName);
                expect(foundCred.address.toLowerCase()).toBe(issuedCred.address.toLowerCase());
                expect(foundCred.trustScore).toBe(issuedCred.trustScore);
                
                console.log(`✅ 発行→取得 成功: "${testUserName}" (Token ID: ${foundCred.tokenId})`);
            }
        }, 30000);

        it('特定のユーザー名で検索できる', async () => {
            const credentials = await fetchCredential(wallet1, contractAddress);
            
            const searchName = "テストユーザー1";
            const found = credentials.find(c => c.userName === searchName);
            
            expect(found).toBeDefined();
            if (found) {
                expect(found.userName).toBe(searchName);
                console.log(`✅ "${searchName}" を検索できました (Token ID: ${found.tokenId})`);
            }
        }, 30000);

        it('特定のアドレスでフィルタできる', async () => {
            const credentials = await fetchCredential(wallet1, contractAddress);
            
            const wallet1Creds = credentials.filter(
                c => c.address.toLowerCase() === wallet1.address.toLowerCase()
            );
            
            expect(wallet1Creds.length).toBeGreaterThan(0);
            console.log(`✅ wallet1のSBT: ${wallet1Creds.length} 件`);
            
            wallet1Creds.forEach(cred => {
                expect(cred.address.toLowerCase()).toBe(wallet1.address.toLowerCase());
            });
        }, 30000);

        it('有効なSBT認証情報を正しく検証できる', async () => {
            const issuedCred = await issueCredential(wallet1, contractAddress, `検証用ユーザー_${Date.now()}`);
            await delay(500);

            const isValid1 = await verifyCredential(
                wallet1,
                contractAddress,
                issuedCred.tokenId,
                issuedCred.address
            );
            
            const isValid2 = await verifyCredential(
                wallet2,
                contractAddress,
                issuedCred.tokenId,
                "0x0000000000000000000000000000000000000000" // 存在しないアドレス
            );

            expect(isValid1).toBe(true);
            expect(isValid2).toBe(false);
        });
    });
});
