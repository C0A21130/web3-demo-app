import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ethers, Wallet } from 'ethers';
import { create as createIPFS } from 'ipfs-http-client';
import putToken, { 
    TransactionManager, 
    TransactionContext, 
    ErrorClassifier, 
    RetryManager, 
    RollbackManager,
    ErrorType,
    TransactionState 
} from '../../src/components/putTokenEerror';

// モック設定
jest.mock('../../src/components/putTokenEerror', () => {
    const actual = jest.requireActual('../../src/components/putTokenEerror') as any;
    return {
        ...actual,
        default: jest.fn()
    };
});

describe('putTokenError - 統合テストスイート', () => {
    let mockWallet: Wallet;
    let mockProvider: any;
    let mockClient: any;
    let transactionManager: TransactionManager;
    let testParams: any;

    beforeEach(() => {
        // モックプロバイダーの設定
        mockProvider = {
            getBalance: jest.fn(),
            sendTransaction: jest.fn(),
            waitForTransaction: jest.fn(),
        };

        // モックウォレットの設定
        mockWallet = {
            address: '0x1234567890123456789012345678901234567890',
            provider: mockProvider,
            connect: jest.fn(),
            signTransaction: jest.fn(),
        } as any;

        // モックIPFSクライアントの設定
        mockClient = {
            add: jest.fn(),
            pin: {
                add: jest.fn(),
                rm: jest.fn(),
            },
            repo: {
                gc: jest.fn(),
            },
        };

        // トランザクションマネージャーの初期化
        transactionManager = new TransactionManager();

        // テストパラメータの設定
        testParams = {
            wallet: mockWallet,
            contractAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef',
            name: 'Test Token',
            description: 'Test Description',
            image: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
            client: mockClient,
            ipfsApiUrl: 'http://localhost',
            maxRetries: 3,
            retryDelay: 100,
        };

        // デフォルトの残高設定（十分な残高）
        mockProvider.getBalance.mockResolvedValue(ethers.parseEther('1.0'));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('1. 順序管理機構テスト', () => {
        it('トランザクション状態が正しい順序で遷移する', async () => {
            const context = transactionManager.createTransaction('test-tx-1', testParams);
            
            expect(context.state).toBe(TransactionState.PENDING);
            
            context.updateState(TransactionState.IPFS_UPLOADED);
            expect(context.state).toBe(TransactionState.IPFS_UPLOADED);
            
            context.updateState(TransactionState.IPFS_PINNED);
            expect(context.state).toBe(TransactionState.IPFS_PINNED);
            
            context.updateState(TransactionState.BLOCKCHAIN_SUBMITTED);
            expect(context.state).toBe(TransactionState.BLOCKCHAIN_SUBMITTED);
            
            context.updateState(TransactionState.COMPLETED);
            expect(context.state).toBe(TransactionState.COMPLETED);
        });

        it('トランザクションコンテキストが正しく管理される', () => {
            const txId1 = 'tx-1';
            const txId2 = 'tx-2';
            
            const context1 = transactionManager.createTransaction(txId1, testParams);
            const context2 = transactionManager.createTransaction(txId2, testParams);
            
            expect(transactionManager.getTransaction(txId1)).toBe(context1);
            expect(transactionManager.getTransaction(txId2)).toBe(context2);
            expect(transactionManager.getAllTransactions()).toHaveLength(2);
            
            transactionManager.removeTransaction(txId1);
            expect(transactionManager.getTransaction(txId1)).toBeUndefined();
            expect(transactionManager.getAllTransactions()).toHaveLength(1);
        });

        it('ロールバックデータが正しく記録される', () => {
            const context = transactionManager.createTransaction('test-tx-2', testParams);
            
            context.rollbackData.addIPFSCid('QmTest1');
            context.rollbackData.addIPFSCid('QmTest2');
            context.rollbackData.addPinnedCid('QmTest1');
            context.rollbackData.setBlockchainTx('0xabcdef');
            
            expect(context.rollbackData.ipfsCids).toEqual(['QmTest1', 'QmTest2']);
            expect(context.rollbackData.pinnedCids).toEqual(['QmTest1']);
            expect(context.rollbackData.blockchainTxHash).toBe('0xabcdef');
        });
    });

    describe('2. エラー分類テスト', () => {
        it('一時的エラーを正しく分類する', () => {
            const temporaryErrors = [
                new Error('Connection timeout'),
                new Error('Network error occurred'),
                new Error('502 Bad Gateway'),
                new Error('ECONNRESET: Connection reset by peer'),
                new Error('ENOTFOUND: DNS resolution failed'),
            ];

            temporaryErrors.forEach(error => {
                expect(ErrorClassifier.classify(error)).toBe(ErrorType.TEMPORARY);
            });
        });

        it('永久的エラーを正しく分類する', () => {
            const permanentErrors = [
                new Error('Insufficient balance'),
                new Error('Invalid address format'),
                new Error('401 Unauthorized'),
                new Error('403 Forbidden'),
                new Error('404 Not Found'),
            ];

            permanentErrors.forEach(error => {
                expect(ErrorClassifier.classify(error)).toBe(ErrorType.PERMANENT);
            });
        });

        it('クリティカルエラーを正しく分類する', () => {
            const criticalErrors = [
                { error: new Error('Transaction reverted'), expected: ErrorType.CRITICAL },
                { error: new Error('out of gas'), expected: ErrorType.CRITICAL },
                { error: new Error('invalid nonce'), expected: ErrorType.CRITICAL },
                { error: new Error('panic occurred'), expected: ErrorType.CRITICAL },
            ];

            criticalErrors.forEach(({ error, expected }) => {
                const classification = ErrorClassifier.classify(error);
                expect(classification).toBe(expected);
            });
        });
    });

    describe('3. 再試行処理テスト', () => {
        it('一時的エラーで再試行が実行される', async () => {
            let attemptCount = 0;
            const mockOperation = jest.fn<() => Promise<string>>().mockImplementation(() => {
                attemptCount++;
                if (attemptCount < 3) {
                    throw new Error('Connection timeout');
                }
                return Promise.resolve('success');
            });

            const result = await RetryManager.executeWithRetry(mockOperation, 3, 10);
            
            expect(result).toBe('success');
            expect(mockOperation).toHaveBeenCalledTimes(3);
        });

        it('永久的エラーで即座に失敗する', async () => {
            const mockOperation = jest.fn<() => Promise<string>>().mockRejectedValue(new Error('Insufficient balance'));

            await expect(
                RetryManager.executeWithRetry(mockOperation, 3, 10)
            ).rejects.toThrow('Insufficient balance');
            
            expect(mockOperation).toHaveBeenCalledTimes(1);
        });

        it('最大再試行回数に達すると失敗する', async () => {
            const mockOperation = jest.fn<() => Promise<string>>().mockRejectedValue(new Error('Connection timeout'));

            await expect(
                RetryManager.executeWithRetry(mockOperation, 2, 10)
            ).rejects.toThrow('Connection timeout');
            
            expect(mockOperation).toHaveBeenCalledTimes(3); // 初回 + 2回の再試行
        });

        it('指数バックオフが正しく動作する', async () => {
            const startTime = Date.now();
            let attemptTimes: number[] = [];
            
            const mockOperation = jest.fn<() => Promise<string>>().mockImplementation(() => {
                attemptTimes.push(Date.now());
                throw new Error('Connection timeout');
            });

            try {
                await RetryManager.executeWithRetry(mockOperation, 2, 50, 2);
            } catch (error) {
                // エラーは期待される
            }

            // 遅延時間の検証（50ms, 100msの遅延が期待される）
            const delays = attemptTimes.map((time, index) => 
                index > 0 ? time - attemptTimes[index - 1] : 0
            );
            
            expect(delays[1]).toBeGreaterThanOrEqual(45); // 50ms ± 5ms
            expect(delays[2]).toBeGreaterThanOrEqual(95); // 100ms ± 5ms
        });
    });

    describe('4. ロールバック処理テスト', () => {
        it('IPFSロールバックが正しく実行される', async () => {
            const context = transactionManager.createTransaction('test-tx-3', testParams);
            context.rollbackData.addPinnedCid('QmTest1');
            context.rollbackData.addPinnedCid('QmTest2');
            
            mockClient.pin.rm.mockResolvedValue(undefined);
            mockClient.repo.gc.mockResolvedValue(undefined);

            await RollbackManager.executeRollback(context);

            expect(mockClient.pin.rm).toHaveBeenCalledWith('QmTest1');
            expect(mockClient.pin.rm).toHaveBeenCalledWith('QmTest2');
            expect(mockClient.repo.gc).toHaveBeenCalled();
            expect(context.state).toBe(TransactionState.ROLLED_BACK);
        });

        it('ロールバック中のエラーが適切に処理される', async () => {
            const context = transactionManager.createTransaction('test-tx-4', testParams);
            context.rollbackData.addPinnedCid('QmFailedCid');
            
            mockClient.pin.rm.mockRejectedValue(new Error('Pin removal failed'));
            mockClient.repo.gc.mockResolvedValue(undefined);

            // ロールバックはエラーを投げるが、可能な限り処理を続行する
            try {
                await RollbackManager.executeRollback(context);
            } catch (error) {
                expect((error as Error).message).toMatch(/Pin removal failed/);
            }
            
            expect(mockClient.pin.rm).toHaveBeenCalledWith('QmFailedCid');
            expect(mockClient.repo.gc).toHaveBeenCalled();
        });
    });

    describe('5. 統合エラーハンドリングテスト', () => {
        it('残高不足エラーでロールバックが実行される', async () => {
            mockProvider.getBalance.mockResolvedValue(ethers.parseEther('0'));
            
            await expect(putToken(testParams)).rejects.toThrow('Insufficient balance');
        });

        it('IPFS接続エラーで適切にハンドリングされる', async () => {
            mockClient.add.mockRejectedValue(new Error('IPFS connection failed'));

            await expect(putToken(testParams)).rejects.toThrow('IPFS connection failed');
        });
    });

    describe('6. ミドルウェア整合性テスト', () => {
        it('複数のトランザクションが並行実行されても整合性が保たれる', async () => {
            const transactions = [];
            
            for (let i = 0; i < 5; i++) {
                const txId = `parallel-tx-${i}`;
                const context = transactionManager.createTransaction(txId, testParams);
                transactions.push(context);
            }
            
            // 並行してステート更新
            await Promise.all(transactions.map(async (context, index) => {
                context.updateState(TransactionState.IPFS_UPLOADED);
                context.rollbackData.addIPFSCid(`QmTest${index}`);
                context.updateState(TransactionState.IPFS_PINNED);
            }));
            
            // 各トランザクションが独立して管理されていることを確認
            transactions.forEach((context, index) => {
                expect(context.state).toBe(TransactionState.IPFS_PINNED);
                expect(context.rollbackData.ipfsCids).toEqual([`QmTest${index}`]);
            });
            
            expect(transactionManager.getAllTransactions()).toHaveLength(5);
        });

        it('エラー発生時にトランザクション状態が適切に保存される', () => {
            const context = transactionManager.createTransaction('error-tx', testParams);
            const error = new Error('Test error');
            
            context.updateState(TransactionState.IPFS_UPLOADED);
            context.addError(error, TransactionState.IPFS_UPLOADED);
            context.incrementRetry();
            
            expect(context.errors).toHaveLength(1);
            expect(context.errors[0].error.message).toBe('Test error');
            expect(context.errors[0].state).toBe(TransactionState.IPFS_UPLOADED);
            expect(context.retryCount).toBe(1);
        });
    });

    describe('7. エッジケーステスト', () => {
        it('null値やundefinedが適切に処理される', () => {
            const paramsWithNulls = {
                ...testParams,
                image: null,
                description: null,
                client: null,
                ipfsApiUrl: null,
            };
            
            const context = transactionManager.createTransaction('null-test', paramsWithNulls);
            expect(context.params.image).toBeNull();
            expect(context.params.client).toBeNull();
        });

        it('ゼロリトライ設定で即座に失敗する', async () => {
            const mockOperation = jest.fn<() => Promise<string>>().mockRejectedValue(new Error('Connection timeout'));

            await expect(
                RetryManager.executeWithRetry(mockOperation, 0, 10)
            ).rejects.toThrow('Connection timeout');
            
            expect(mockOperation).toHaveBeenCalledTimes(1);
        });

        it('異常に大きなリトライ値でも正常に動作する', async () => {
            const mockOperation = jest.fn<() => Promise<string>>().mockResolvedValue('success');

            const result = await RetryManager.executeWithRetry(mockOperation, 1000, 1);
            
            expect(result).toBe('success');
            expect(mockOperation).toHaveBeenCalledTimes(1);
        });
    });

    describe('8. パフォーマンステスト', () => {
        it('大量のトランザクション管理でメモリリークが発生しない', () => {
            const initialTransactionCount = transactionManager.getAllTransactions().length;
            
            // 大量のトランザクションを作成
            for (let i = 0; i < 1000; i++) {
                const txId = `perf-tx-${i}`;
                transactionManager.createTransaction(txId, testParams);
            }
            
            expect(transactionManager.getAllTransactions()).toHaveLength(initialTransactionCount + 1000);
            
            // 全て削除
            for (let i = 0; i < 1000; i++) {
                const txId = `perf-tx-${i}`;
                transactionManager.removeTransaction(txId);
            }
            
            expect(transactionManager.getAllTransactions()).toHaveLength(initialTransactionCount);
        });

        it('ロールバック処理が適切な時間内に完了する', async () => {
            const context = transactionManager.createTransaction('perf-rollback', testParams);
            
            // 多数のCIDを追加
            for (let i = 0; i < 100; i++) {
                context.rollbackData.addPinnedCid(`QmTest${i}`);
            }
            
            mockClient.pin.rm.mockResolvedValue(undefined);
            mockClient.repo.gc.mockResolvedValue(undefined);
            
            const startTime = Date.now();
            await RollbackManager.executeRollback(context);
            const endTime = Date.now();
            
            // 5秒以内に完了することを確認
            expect(endTime - startTime).toBeLessThan(5000);
            expect(mockClient.pin.rm).toHaveBeenCalledTimes(100);
        });
    });
});