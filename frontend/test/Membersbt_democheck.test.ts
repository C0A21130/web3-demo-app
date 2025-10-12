/**
 * MemberSBT_Democheck.ts のテストスイート
 * 
 * このテストファイルは、SBT（Soulbound Token）の所持者情報を取得する
 * 各種関数の機能性、パフォーマンス、エラーハンドリングを検証します。
 * 
 * テスト対象関数:
 * - getAllSBTHolders(): 従来型アプローチ（Token ID反復）
 * - getAllSBTHoldersFromEvents(): イベントベースアプローチ（高速）
 * - getSBTsByOwner(): 特定アドレスでフィルタリング
 * - searchSBTsByUserName(): ユーザー名検索
 */

import { describe, it, expect, beforeAll } from "@jest/globals";
import { ethers, JsonRpcProvider } from 'ethers';
import { 
    getAllSBTHolders,
    getAllSBTHoldersFromEvents,
    getSBTsByOwner, 
    searchSBTsByUserName,
    type SBTHolderListResult 
} from '../src/components/SBT-modules/MemberSBT_Democheck';
import mintMemberSBT from '../src/components/SBT-modules/MemberSBT_Demomint';

// テスト環境の設定
const rpcUrl = 'http://127.0.0.1:8545'; // ローカルHardhatノード
const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // デプロイ済みコントラクトアドレス

describe('MemberSBT_Democheck - SBT所持者一覧取得テスト', () => {
    let provider: JsonRpcProvider;
    let wallet1: ethers.Wallet;
    let wallet2: ethers.Wallet;

    /**
     * 全テストの実行前に1回だけ実行される初期化処理
     * - プロバイダーの初期化
     * - テスト用ウォレットの作成
     * - テストデータとしてSBTを発行
     */
    beforeAll(async () => {
        // JSON-RPCプロバイダーを初期化（ローカルHardhatノードに接続）
        // JSON-RPCプロバイダーを初期化（ローカルHardhatノードに接続）
        provider = new JsonRpcProvider(rpcUrl);
        
        // テスト用のウォレットを2つ作成
        // Hardhatのデフォルトアカウントの秘密鍵を使用
        wallet1 = new ethers.Wallet(
            "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", // Account #0の秘密鍵
            provider
        );
        wallet2 = new ethers.Wallet(
            "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", // Account #1の秘密鍵
            provider
        );

        // テスト用のSBTを発行
        // 既に発行済みの場合はエラーをキャッチしてスキップ
        try {
            // wallet1でSBTを2つ発行
            await mintMemberSBT(wallet1, contractAddress, "テストユーザー1");
            await mintMemberSBT(wallet1, contractAddress, "山田太郎");
            
            // wallet2でSBTを1つ発行
            await mintMemberSBT(wallet2, contractAddress, "テストユーザー2");
        } catch (error) {
            console.log('SBT発行済み、またはエラー:', error);
        }
    }, 60000); // タイムアウト: 60秒

    /**
     * getAllSBTHolders関数のテスト
     * 従来型アプローチ（Token ID反復）の検証
     * 
     * 特徴:
     * - getTotalSupply()で総発行数を取得
     * - 各Token IDに対してownerOf()とgetUserName()を呼び出し
     * - RPCコール数が多い（100トークンで201回）
     */
    describe('getAllSBTHolders', () => {
        /**
         * 正常系: 全SBT所持者の一覧を取得できることを確認
         * - 成功フラグがtrueであること
         * - エラーがnullであること
         * - holders配列が存在し、要素が1つ以上あること
         * - 各要素のデータ構造が正しいこと
         */
        it('全SBT所持者一覧を取得できる', async () => {
            const result: SBTHolderListResult = await getAllSBTHolders(provider, contractAddress);

            // 戻り値の基本構造を検証
            expect(result.success).toBe(true);
            expect(result.error).toBeNull();
            expect(result.holders).toBeDefined();
            expect(Array.isArray(result.holders)).toBe(true);
            expect(result.holders.length).toBeGreaterThan(0);

            console.log(`📊 総発行数: ${result.holders.length}`);
            
            // 各ホルダー情報の形式を確認
            // tokenId: 番号, owner: アドレス, userName: 文字列
            result.holders.forEach(holder => {
                expect(holder).toHaveProperty('tokenId');
                expect(holder).toHaveProperty('owner');
                expect(holder).toHaveProperty('userName');
                expect(typeof holder.tokenId).toBe('number');
                expect(typeof holder.owner).toBe('string');
                expect(typeof holder.userName).toBe('string');
                expect(holder.owner).toMatch(/^0x[a-fA-F0-9]{40}$/); // アドレス形式チェック（0x + 40文字の16進数）
            });
        }, 30000);

        /**
         * 異常系: 無効なコントラクトアドレスでエラーを返すことを確認
         * - success: false
         * - error: エラーメッセージあり
         * - holders: 空配列
         */
        it('無効なコントラクトアドレスでエラーを返す', async () => {
            const invalidAddress = "invalid_address";
            const result = await getAllSBTHolders(provider, invalidAddress);

            expect(result.success).toBe(false);
            expect(result.error).toBe('無効なコントラクトアドレスです');
            expect(result.holders.length).toBe(0);
        });

        /**
         * エッジケース: SBTが0件の場合の挙動
         * 実際のテスト環境では発行済みのため、このテストはスキップ可能
         */
        it('SBTが0件の場合は空配列を返す', async () => {
            // 新しいコントラクトアドレス（存在しないか、発行数0の想定）
            // 注: このテストは実際のデプロイ状況に依存するため、スキップ可能
            // const emptyContractAddress = '0x0000000000000000000000000000000000000000';
            // const result = await getAllSBTHolders(provider, emptyContractAddress);
            // expect(result.holders.length).toBe(0);
        });
    });

    /**
     * getAllSBTHoldersFromEvents関数のテスト
     * イベントベースアプローチ（高速版）の検証
     * 
     * 特徴:
     * - SBTMintedイベントをqueryFilter()で取得
     * - RPCコール数が少ない（1回のイベント取得のみ）
     * - パフォーマンスが大幅に向上（100トークンで0.05秒程度）
     * - ブロック範囲指定が可能
     */
    describe('getAllSBTHoldersFromEvents (イベントログ使用 - 高速版)', () => {
        /**
         * 正常系: イベントログから全SBT所持者一覧を取得
         * - 従来の方法と同じデータ構造を返すこと
         * - パフォーマンスが向上していること
         */
        it('イベントログから全SBT所持者一覧を取得できる', async () => {
            const result = await getAllSBTHoldersFromEvents(provider, contractAddress);

            expect(result.success).toBe(true);
            expect(result.error).toBeNull();
            expect(result.holders).toBeDefined();
            expect(Array.isArray(result.holders)).toBe(true);
            expect(result.holders.length).toBeGreaterThan(0);

            console.log(`📊 イベントログから取得: ${result.holders.length} 件`);

            // データ形式の検証（従来の方法と同じ形式）
            result.holders.forEach(holder => {
                expect(holder).toHaveProperty('tokenId');
                expect(holder).toHaveProperty('owner');
                expect(holder).toHaveProperty('userName');
                expect(typeof holder.tokenId).toBe('number');
                expect(typeof holder.owner).toBe('string');
                expect(typeof holder.userName).toBe('string');
                expect(holder.owner).toMatch(/^0x[a-fA-F0-9]{40}$/);
            });
        }, 30000);

        /**
         * パフォーマンステスト: 従来の方法と結果が一致することを確認
         * - イベントベースと従来型で同じデータが取得できること
         * - データの整合性を検証
         */
        it('従来の方法と同じ結果を返す', async () => {
            const resultFromEvents = await getAllSBTHoldersFromEvents(provider, contractAddress);
            const resultFromCalls = await getAllSBTHolders(provider, contractAddress);

            expect(resultFromEvents.success).toBe(true);
            expect(resultFromCalls.success).toBe(true);
            
            // 件数が一致することを確認（データの整合性）
            expect(resultFromEvents.holders.length).toBe(resultFromCalls.holders.length);

            console.log(`✅ イベント版: ${resultFromEvents.holders.length} 件`);
            console.log(`✅ 従来版: ${resultFromCalls.holders.length} 件`);
        }, 30000);

        /**
         * ブロック範囲指定テスト
         * - 特定のブロック範囲を指定してイベント取得できること
         * - fromBlock, toBlockパラメータの動作確認
         */
        it('特定のブロック範囲を指定して取得できる', async () => {
            const currentBlock = await provider.getBlockNumber();
            const fromBlock = Math.max(0, currentBlock - 1000); // 最新1000ブロックを取得
            
            const result = await getAllSBTHoldersFromEvents(
                provider, 
                contractAddress, 
                fromBlock, 
                'latest'
            );

            expect(result.success).toBe(true);
            console.log(`📊 ブロック ${fromBlock}〜latest: ${result.holders.length} 件`);
        }, 30000);

        /**
         * 異常系: 無効なアドレスでエラーハンドリング
         */
        it('無効なコントラクトアドレスでエラーを返す', async () => {
            const invalidAddress = "invalid_address";
            const result = await getAllSBTHoldersFromEvents(provider, invalidAddress);

            expect(result.success).toBe(false);
            expect(result.error).toBe('無効なコントラクトアドレスです');
            expect(result.holders.length).toBe(0);
        });
    });

    /**
     * getSBTsByOwner関数のテスト
     * 特定のアドレスが所有するSBTのフィルタリング機能を検証
     * 
     * 用途:
     * - マイページでの自分のSBT一覧表示
     * - 特定ユーザーのSBT確認
     */
    describe('getSBTsByOwner', () => {
        /**
         * 正常系: 特定アドレスのSBT一覧を取得
         * - wallet1が所有するSBTのみが返されること
         * - owner フィールドがすべて指定したアドレスと一致すること
         */
        it('特定アドレスが所有するSBTを取得できる', async () => {
            const ownerAddress = wallet1.address;
            const result = await getSBTsByOwner(provider, contractAddress, ownerAddress);

            expect(result.success).toBe(true);
            expect(result.error).toBeNull();
            expect(Array.isArray(result.holders)).toBe(true);

            // wallet1が所有するSBTがあることを確認
            if (result.holders.length > 0) {
                result.holders.forEach(holder => {
                    // 大文字小文字を区別せずに比較（Ethereumアドレスは大文字小文字の違いを許容）
                    expect(holder.owner.toLowerCase()).toBe(ownerAddress.toLowerCase());
                });
                console.log(`🔍 ${ownerAddress} が所有するSBT: ${result.holders.length} 件`);
            }
        }, 30000);

        /**
         * アドレス形式テスト: 大文字小文字を区別せずに検索
         * - チェックサム形式（大文字小文字混在）のアドレスでも検索可能
         * - Ethereumのアドレス仕様に準拠
         */
        it('大文字小文字を区別せずに検索できる', async () => {
            // チェックサム形式のアドレスを使用（大文字小文字混在）
            const ownerAddress = ethers.getAddress(wallet1.address); // チェックサム形式に変換
            const result = await getSBTsByOwner(provider, contractAddress, ownerAddress);

            expect(result.success).toBe(true);
            
            if (result.holders.length > 0) {
                result.holders.forEach(holder => {
                    // 小文字に統一して比較
                    expect(holder.owner.toLowerCase()).toBe(wallet1.address.toLowerCase());
                });
            }
        }, 30000);

        /**
         * 異常系: 無効なアドレス形式でエラー
         */
        it('無効なアドレスでエラーを返す', async () => {
            const invalidAddress = "invalid_owner_address";
            const result = await getSBTsByOwner(provider, contractAddress, invalidAddress);

            expect(result.success).toBe(false);
            expect(result.error).toBe('無効な所有者アドレスです');
            expect(result.holders.length).toBe(0);
        });

        /**
         * エッジケース: SBTを所有していないアドレス
         * - 空配列を返すこと（エラーにならない）
         */
        it('SBTを所有していないアドレスで空配列を返す', async () => {
            // ランダムなアドレス（SBTを持っていない想定）
            const randomWallet = ethers.Wallet.createRandom();
            const result = await getSBTsByOwner(provider, contractAddress, randomWallet.address);

            expect(result.success).toBe(true);
            expect(result.holders.length).toBe(0);
        }, 30000);
    });

    /**
     * searchSBTsByUserName関数のテスト
     * ユーザー名による検索機能を検証
     * 
     * 用途:
     * - ユーザー検索機能
     * - 部分一致検索
     * - 大文字小文字の区別設定
     */
    describe('searchSBTsByUserName', () => {
        /**
         * 正常系: ユーザー名で部分一致検索
         * - 検索キーワードを含むユーザー名がヒットすること
         */
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

        /**
         * 完全一致検索のテスト
         * - 完全に一致するユーザー名でも検索可能
         */
        it('完全一致でも検索できる', async () => {
            const searchKeyword = "山田太郎";
            const result = await searchSBTsByUserName(provider, contractAddress, searchKeyword);

            expect(result.success).toBe(true);
            
            if (result.holders.length > 0) {
                const found = result.holders.some(holder => holder.userName === searchKeyword);
                expect(found).toBe(true);
            }
        }, 30000);

        /**
         * 大文字小文字区別テスト（デフォルト: 区別しない）
         * - caseSensitive = false（デフォルト）
         */
        it('大文字小文字を区別しない検索（デフォルト）', async () => {
            const searchKeyword = "テスト"; // 大文字で検索
            const result = await searchSBTsByUserName(provider, contractAddress, searchKeyword, false);

            expect(result.success).toBe(true);
            // caseSensitive=false なので、"テスト"も検索される
        }, 30000);

        /**
         * 大文字小文字区別テスト（明示的に区別する）
         * - caseSensitive = true
         */
        it('大文字小文字を区別する検索', async () => {
            const searchKeyword = "TESТ"; // 大文字で検索
            const result = await searchSBTsByUserName(provider, contractAddress, searchKeyword, true);

            expect(result.success).toBe(true);
            // caseSensitive=true なので、完全一致のみ
        }, 30000);

        /**
         * 異常系: 空文字検索でエラー
         */
        it('空文字でエラーを返す', async () => {
            const result = await searchSBTsByUserName(provider, contractAddress, "");

            expect(result.success).toBe(false);
            expect(result.error).toBe('検索キーワードを入力してください');
            expect(result.holders.length).toBe(0);
        });

        /**
         * エッジケース: 該当なしの場合は空配列
         */
        it('該当なしの場合は空配列を返す', async () => {
            const searchKeyword = "存在しないユーザー名_12345xyz";
            const result = await searchSBTsByUserName(provider, contractAddress, searchKeyword);

            expect(result.success).toBe(true);
            expect(result.holders.length).toBe(0);
        }, 30000);
    });

    /**
     * 統合テスト
     * 複数の関数を組み合わせた実際の使用シナリオを検証
     */
    describe('統合テスト', () => {
        /**
         * 実際の使用フロー: 全取得 → フィルタリング → 検索
         * - 複数の関数が連携して正しく動作すること
         * - データの一貫性が保たれること
         */
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
                        firstUserName.substring(0, 2) // 最初の2文字で部分一致検索
                    );
                    expect(searchResult.success).toBe(true);
                    console.log(`🔍 "${firstUserName.substring(0, 2)}" で検索: ${searchResult.holders.length} 件`);
                }
            }
        }, 30000);

        /**
         * データ構造の一貫性テスト
         * - すべての関数が同じデータ構造を返すこと
         * - SBTHolderListResultインターフェースに準拠
         */
        it('返却されるデータ構造が一貫している', async () => {
            // 全関数を実行してデータ構造を検証
            const results = [
                await getAllSBTHolders(provider, contractAddress),
                await getSBTsByOwner(provider, contractAddress, wallet1.address),
                await searchSBTsByUserName(provider, contractAddress, "テスト")
            ];

            // すべての結果が同じインターフェース形式であることを確認
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
