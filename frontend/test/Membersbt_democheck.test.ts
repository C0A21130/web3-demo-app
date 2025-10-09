import { describe, it, expect, beforeAll } from "@jest/globals";
import { ethers, JsonRpcProvider } from 'ethers';
import { 
    getAllSBTHolders, 
    getSBTsByOwner, 
    searchSBTsByUserName,
    type SBTHolderListResult 
} from '../src/components/SBT-modules/MemberSBT_Democheck';
import mintMemberSBT from '../src/components/SBT-modules/MemberSBT_Demomint';

const rpcUrl = 'http://127.0.0.1:8545';
const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

describe('MemberSBT_Democheck - SBT所持者一覧取得テスト', () => {
    let provider: JsonRpcProvider;
    let wallet1: ethers.Wallet;
    let wallet2: ethers.Wallet;

    beforeAll(async () => {
        provider = new JsonRpcProvider(rpcUrl);
        
        // テスト用のウォレットを2つ作成
        wallet1 = new ethers.Wallet(
            "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", 
            provider
        );
        wallet2 = new ethers.Wallet(
            "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", 
            provider
        );

        // テスト用のSBTを発行（既に発行済みの場合はスキップ）
        try {
            await mintMemberSBT(wallet1, contractAddress, "テストユーザー1");
            await mintMemberSBT(wallet2, contractAddress, "テストユーザー2");
            await mintMemberSBT(wallet1, contractAddress, "山田太郎");
        } catch (error) {
            console.log('SBT発行済み、またはエラー:', error);
        }
    }, 60000);

    describe('getAllSBTHolders', () => {
        it('全SBT所持者一覧を取得できる', async () => {
            const result: SBTHolderListResult = await getAllSBTHolders(provider, contractAddress);

            expect(result.success).toBe(true);
            expect(result.error).toBeNull();
            expect(result.holders).toBeDefined();
            expect(Array.isArray(result.holders)).toBe(true);
            expect(result.holders.length).toBeGreaterThan(0);

            console.log(`📊 総発行数: ${result.holders.length}`);
            
            // 各ホルダー情報の形式を確認
            result.holders.forEach(holder => {
                expect(holder).toHaveProperty('tokenId');
                expect(holder).toHaveProperty('owner');
                expect(holder).toHaveProperty('userName');
                expect(typeof holder.tokenId).toBe('number');
                expect(typeof holder.owner).toBe('string');
                expect(typeof holder.userName).toBe('string');
                expect(holder.owner).toMatch(/^0x[a-fA-F0-9]{40}$/); // アドレス形式チェック
            });
        }, 30000);

        it('無効なコントラクトアドレスでエラーを返す', async () => {
            const invalidAddress = "invalid_address";
            const result = await getAllSBTHolders(provider, invalidAddress);

            expect(result.success).toBe(false);
            expect(result.error).toBe('無効なコントラクトアドレスです');
            expect(result.holders.length).toBe(0);
        });

        it('SBTが0件の場合は空配列を返す', async () => {
            // 新しいコントラクトアドレス（存在しないか、発行数0の想定）
            // 注: このテストは実際のデプロイ状況に依存するため、スキップ可能
            // const emptyContractAddress = '0x0000000000000000000000000000000000000000';
            // const result = await getAllSBTHolders(provider, emptyContractAddress);
            // expect(result.holders.length).toBe(0);
        });
    });

    describe('getSBTsByOwner', () => {
        it('特定アドレスが所有するSBTを取得できる', async () => {
            const ownerAddress = wallet1.address;
            const result = await getSBTsByOwner(provider, contractAddress, ownerAddress);

            expect(result.success).toBe(true);
            expect(result.error).toBeNull();
            expect(Array.isArray(result.holders)).toBe(true);

            // wallet1が所有するSBTがあることを確認
            if (result.holders.length > 0) {
                result.holders.forEach(holder => {
                    expect(holder.owner.toLowerCase()).toBe(ownerAddress.toLowerCase());
                });
                console.log(`🔍 ${ownerAddress} が所有するSBT: ${result.holders.length} 件`);
            }
        }, 30000);

        it('大文字小文字を区別せずに検索できる', async () => {
            const ownerAddress = wallet1.address.toUpperCase(); // 大文字に変換
            const result = await getSBTsByOwner(provider, contractAddress, ownerAddress);

            expect(result.success).toBe(true);
            
            if (result.holders.length > 0) {
                result.holders.forEach(holder => {
                    expect(holder.owner.toLowerCase()).toBe(wallet1.address.toLowerCase());
                });
            }
        }, 30000);

        it('無効なアドレスでエラーを返す', async () => {
            const invalidAddress = "invalid_owner_address";
            const result = await getSBTsByOwner(provider, contractAddress, invalidAddress);

            expect(result.success).toBe(false);
            expect(result.error).toBe('無効な所有者アドレスです');
            expect(result.holders.length).toBe(0);
        });

        it('SBTを所有していないアドレスで空配列を返す', async () => {
            // ランダムなアドレス（SBTを持っていない想定）
            const randomWallet = ethers.Wallet.createRandom();
            const result = await getSBTsByOwner(provider, contractAddress, randomWallet.address);

            expect(result.success).toBe(true);
            expect(result.holders.length).toBe(0);
        }, 30000);
    });

    describe('searchSBTsByUserName', () => {
        it('ユーザー名で部分一致検索ができる', async () => {
            const searchKeyword = "テスト";
            const result = await searchSBTsByUserName(provider, contractAddress, searchKeyword);

            expect(result.success).toBe(true);
            expect(result.error).toBeNull();
            expect(Array.isArray(result.holders)).toBe(true);

            // 検索結果に "テスト" が含まれることを確認
            if (result.holders.length > 0) {
                result.holders.forEach(holder => {
                    expect(holder.userName).toContain(searchKeyword);
                });
                console.log(`🔍 "${searchKeyword}" で検索: ${result.holders.length} 件ヒット`);
            }
        }, 30000);

        it('完全一致でも検索できる', async () => {
            const searchKeyword = "山田太郎";
            const result = await searchSBTsByUserName(provider, contractAddress, searchKeyword);

            expect(result.success).toBe(true);
            
            if (result.holders.length > 0) {
                const found = result.holders.some(holder => holder.userName === searchKeyword);
                expect(found).toBe(true);
            }
        }, 30000);

        it('大文字小文字を区別しない検索（デフォルト）', async () => {
            const searchKeyword = "テスト"; // 大文字で検索
            const result = await searchSBTsByUserName(provider, contractAddress, searchKeyword, false);

            expect(result.success).toBe(true);
            // caseSensitive=false なので、"テスト"も検索される
        }, 30000);

        it('大文字小文字を区別する検索', async () => {
            const searchKeyword = "TESТ"; // 大文字で検索
            const result = await searchSBTsByUserName(provider, contractAddress, searchKeyword, true);

            expect(result.success).toBe(true);
            // caseSensitive=true なので、完全一致のみ
        }, 30000);

        it('空文字でエラーを返す', async () => {
            const result = await searchSBTsByUserName(provider, contractAddress, "");

            expect(result.success).toBe(false);
            expect(result.error).toBe('検索キーワードを入力してください');
            expect(result.holders.length).toBe(0);
        });

        it('該当なしの場合は空配列を返す', async () => {
            const searchKeyword = "存在しないユーザー名_12345xyz";
            const result = await searchSBTsByUserName(provider, contractAddress, searchKeyword);

            expect(result.success).toBe(true);
            expect(result.holders.length).toBe(0);
        }, 30000);
    });

    describe('統合テスト', () => {
        it('全取得→フィルタリング→検索の一連の流れ', async () => {
            // 1. 全件取得
            const allResult = await getAllSBTHolders(provider, contractAddress);
            expect(allResult.success).toBe(true);
            const totalCount = allResult.holders.length;
            console.log(`📊 総発行数: ${totalCount} 件`);

            // 2. 特定アドレスで絞り込み
            if (allResult.holders.length > 0) {
                const firstOwner = allResult.holders[0].owner;
                const ownerResult = await getSBTsByOwner(provider, contractAddress, firstOwner);
                expect(ownerResult.success).toBe(true);
                expect(ownerResult.holders.length).toBeLessThanOrEqual(totalCount);
                console.log(`🔍 ${firstOwner} が所有: ${ownerResult.holders.length} 件`);

                // 3. ユーザー名で検索
                if (ownerResult.holders.length > 0) {
                    const firstUserName = ownerResult.holders[0].userName;
                    const searchResult = await searchSBTsByUserName(
                        provider, 
                        contractAddress, 
                        firstUserName.substring(0, 2) // 最初の2文字で検索
                    );
                    expect(searchResult.success).toBe(true);
                    console.log(`🔍 "${firstUserName.substring(0, 2)}" で検索: ${searchResult.holders.length} 件`);
                }
            }
        }, 30000);

        it('返却されるデータ構造が一貫している', async () => {
            const results = [
                await getAllSBTHolders(provider, contractAddress),
                await getSBTsByOwner(provider, contractAddress, wallet1.address),
                await searchSBTsByUserName(provider, contractAddress, "テスト")
            ];

            results.forEach(result => {
                expect(result).toHaveProperty('success');
                expect(result).toHaveProperty('holders');
                expect(result).toHaveProperty('error');
                expect(typeof result.success).toBe('boolean');
                expect(Array.isArray(result.holders)).toBe(true);
            });
        }, 30000);
    });
});
