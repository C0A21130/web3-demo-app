import { ethers, Wallet, HDNodeWallet, formatEther } from "ethers";
import { IPFSHTTPClient } from "ipfs-http-client";
import SsdlabAbi from './../../abi/SsdlabToken.json';
import { 
    FailoverManager, 
    FailoverIPFSClient, 
    FailoverBlockchainProvider,
    DEFAULT_FAILOVER_CONFIG,
    type FailoverConfig 
} from './failoverManager';

// エラー分類
enum ErrorType {
    TEMPORARY = 'temporary',
    PERMANENT = 'permanent',
    CRITICAL = 'critical'
}

// トランザクション状態
enum TransactionState {
    PENDING = 'pending',
    IPFS_UPLOADED = 'ipfs_uploaded',
    IPFS_PINNED = 'ipfs_pinned',
    BLOCKCHAIN_SUBMITTED = 'blockchain_submitted',
    COMPLETED = 'completed',
    FAILED = 'failed',
    ROLLED_BACK = 'rolled_back'
}

interface Params {
    wallet: Wallet | HDNodeWallet;
    contractAddress: string;
    name: string;
    description: string | null;
    image: File | null;
    client: IPFSHTTPClient | null;
    ipfsApiUrl: string | null;
    maxRetries?: number;
    retryDelay?: number;
    failoverConfig?: FailoverConfig;
    enableFailover?: boolean;
}

// トランザクション管理
class TransactionManager {
    private transactions: Map<string, TransactionContext> = new Map();

    createTransaction(id: string, params: Params): TransactionContext {
        const context = new TransactionContext(id, params);
        this.transactions.set(id, context);
        return context;
    }

    getTransaction(id: string): TransactionContext | undefined {
        return this.transactions.get(id);
    }

    removeTransaction(id: string): void {
        this.transactions.delete(id);
    }

    getAllTransactions(): TransactionContext[] {
        return Array.from(this.transactions.values());
    }
}

// トランザクションコンテキスト
class TransactionContext {
    public id: string;
    public state: TransactionState;
    public params: Params;
    public rollbackData: RollbackData;
    public retryCount: number;
    public errors: Array<{ error: Error; timestamp: Date; state: TransactionState }>;
    public createdAt: Date;
    public updatedAt: Date;

    constructor(id: string, params: Params) {
        this.id = id;
        this.state = TransactionState.PENDING;
        this.params = params;
        this.rollbackData = new RollbackData();
        this.retryCount = 0;
        this.errors = [];
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    updateState(newState: TransactionState): void {
        this.state = newState;
        this.updatedAt = new Date();
    }

    addError(error: Error, state: TransactionState): void {
        this.errors.push({ error, timestamp: new Date(), state });
        this.updatedAt = new Date();
    }

    incrementRetry(): void {
        this.retryCount++;
        this.updatedAt = new Date();
    }
}

// ロールバックデータ
class RollbackData {
    public ipfsCids: string[] = [];
    public pinnedCids: string[] = [];
    public blockchainTxHash: string | null = null;

    addIPFSCid(cid: string): void {
        this.ipfsCids.push(cid);
    }

    addPinnedCid(cid: string): void {
        this.pinnedCids.push(cid);
    }

    setBlockchainTx(txHash: string): void {
        this.blockchainTxHash = txHash;
    }
}

// エラー分類器
class ErrorClassifier {
    static classify(error: Error): ErrorType {
        const message = error.message.toLowerCase();
        
        // クリティカルエラー（最優先で判定）
        if (message.includes('panic') ||
            message.includes('revert') ||
            message.includes('out of gas') ||
            message.includes('nonce')) {
            return ErrorType.CRITICAL;
        }

        // 一時的なエラー
        if (message.includes('timeout') || 
            message.includes('network') ||
            message.includes('connection') ||
            message.includes('502') ||
            message.includes('503') ||
            message.includes('504') ||
            message.includes('econnreset') ||
            message.includes('enotfound')) {
            return ErrorType.TEMPORARY;
        }

        // 永久的なエラー
        if (message.includes('insufficient') ||
            message.includes('invalid') ||
            message.includes('unauthorized') ||
            message.includes('forbidden') ||
            message.includes('not found') ||
            message.includes('400') ||
            message.includes('401') ||
            message.includes('403') ||
            message.includes('404')) {
            return ErrorType.PERMANENT;
        }

        // デフォルトは一時的エラーとして扱う
        return ErrorType.TEMPORARY;
    }
}

// 再試行マネージャー
class RetryManager {
    static async executeWithRetry<T>(
        operation: () => Promise<T>,
        maxRetries: number = 3,
        delay: number = 1000,
        backoffMultiplier: number = 2
    ): Promise<T> {
        let currentDelay = delay;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                const errorType = ErrorClassifier.classify(error as Error);
                
                // 永久的エラーまたはクリティカルエラーの場合は即座に失敗
                if (errorType === ErrorType.PERMANENT || errorType === ErrorType.CRITICAL) {
                    throw error;
                }
                
                // 最後の試行の場合
                if (attempt === maxRetries) {
                    throw error;
                }
                
                // 一時的エラーの場合は再試行
                console.warn(`Attempt ${attempt + 1} failed, retrying in ${currentDelay}ms:`, error);
                await new Promise(resolve => setTimeout(resolve, currentDelay));
                currentDelay *= backoffMultiplier;
            }
        }
        
        throw new Error('Max retry attempts exceeded');
    }
}

/**
 * Mint a basic NFT token without IPFS metadata
 */
const mintToken = async (context: TransactionContext, tokenName: string, metadataURI: string | null) => {
    try {
        context.updateState(TransactionState.BLOCKCHAIN_SUBMITTED);
        
        const contract = new ethers.Contract(context.params.contractAddress, SsdlabAbi.abi, context.params.wallet);
        let tx;
        
        if (metadataURI != null) {
            tx = await contract.safeMintIPFS(context.params.wallet.address, tokenName, metadataURI);
        } else {
            tx = await contract.safeMint(context.params.wallet.address, tokenName);
        }
        
        // トランザクションハッシュを保存
        context.rollbackData.setBlockchainTx(tx.hash);
        
        // トランザクションの完了を待つ
        const txReceipt = await tx.wait();
        context.updateState(TransactionState.COMPLETED);
        
        return txReceipt;
    } catch (error) {
        const err = error as Error;
        context.addError(err, context.state);
        console.error('Base minting failed:', err);
        throw new Error(`Failed to mint base NFT: ${err.message}`);
    }
};

// ロールバック処理
class RollbackManager {
    static async executeRollback(context: TransactionContext): Promise<void> {
        console.log(`Starting rollback for transaction ${context.id}`);
        const rollbackData = context.rollbackData;
        
        try {
            // IPFSロールバック
            if (context.params.client && rollbackData.pinnedCids.length > 0) {
                await this.rollbackIPFS(context.params.client, rollbackData);
            }
            
            // ブロックチェーンロールバック（実際には取り消し不可のため警告のみ）
            if (rollbackData.blockchainTxHash) {
                console.warn(`Blockchain transaction ${rollbackData.blockchainTxHash} cannot be rolled back`);
            }
            
            context.updateState(TransactionState.ROLLED_BACK);
            console.log(`Rollback completed for transaction ${context.id}`);
        } catch (error) {
            console.error(`Rollback failed for transaction ${context.id}:`, error);
            throw error;
        }
    }
    
    private static async rollbackIPFS(client: IPFSHTTPClient, rollbackData: RollbackData): Promise<void> {
        try {
            // ピンされたCIDを削除
            for (const cid of rollbackData.pinnedCids) {
                try {
                    await client.pin.rm(cid);
                    console.log(`Unpinned CID: ${cid}`);
                } catch (error) {
                    console.warn(`Failed to unpin CID ${cid}:`, error);
                }
            }
            
            // ガベージコレクションを実行
            await client.repo.gc();
            console.log('IPFS garbage collection completed');
            
        } catch (error) {
            console.error('IPFS rollback failed:', error);
            throw new Error(`Failed to rollback IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

// // CIDをpinする関数
const pinCID = async (client: IPFSHTTPClient, cid: string): Promise<void> => {
    try {
        await client.pin.add(cid);
    } catch (error) {
        console.error('Failed to pin CID:', error);
        throw new Error(`Failed to pin CID ${cid}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

// // CIDをunpinする関数（ヘルパー関数として保持）
// const unpinCID = async (client: IPFSHTTPClient, cid: string): Promise<void> => {
//     try {
//         await client.pin.rm(cid);
//     } catch (error) {
//         console.error('Failed to unpin CID:', error);
//         throw new Error(`Failed to unpin CID ${cid}: ${error instanceof Error ? error.message : 'Unknown error'}`);
//     }
// };

const uploadTokenData = async (context: TransactionContext, tokenName: string, tokenImage: File | null, description: string, client: IPFSHTTPClient, ipfsApiUrl: string): Promise<string> => {
    try {
        // 1. File オブジェクトを直接IPFSにアップロード
        if (!tokenImage) return '';
        
        context.updateState(TransactionState.IPFS_UPLOADED);
        const imageResult = await client.add(tokenImage);
        const imageCid = imageResult.cid.toString();
        context.rollbackData.addIPFSCid(imageCid);

        // 2. メタデータをIPFSにアップロード（URIを取得）
        const metadata = {
            name: tokenName,
            description: description,
            image: `${ipfsApiUrl}:8080/ipfs/${imageResult.path}`,
            attributes: []
        };
        const metadataResult = await client.add(JSON.stringify(metadata, null, 2));
        const metadataCid = metadataResult.cid.toString();
        context.rollbackData.addIPFSCid(metadataCid);
        
        const tokenUrl = `${ipfsApiUrl}:8080/ipfs/${metadataCid}`;

        // 3. 画像とメタデータのCIDをpinする
        context.updateState(TransactionState.IPFS_PINNED);
        await pinCID(client, imageCid);
        context.rollbackData.addPinnedCid(imageCid);
        
        await pinCID(client, metadataCid);
        context.rollbackData.addPinnedCid(metadataCid);

        return tokenUrl;
    } catch (error) {
        const err = error as Error;
        context.addError(err, context.state);
        console.error('IPFS upload failed:', err);
        
        // ロールバック実行
        try {
            await RollbackManager.executeRollback(context);
        } catch (rollbackError) {
            console.error('Rollback failed:', rollbackError);
        }
        
        throw new Error(`Failed to upload to IPFS: ${err.message}`);
    }
};

// フェイルオーバー対応IPFSアップロード
const uploadTokenDataWithFailover = async (context: TransactionContext, tokenName: string, tokenImage: File | null, description: string, failoverIPFS: FailoverIPFSClient, ipfsApiUrl: string): Promise<string> => {
    try {
        // 1. File オブジェクトを直接IPFSにアップロード
        if (!tokenImage) return '';
        
        context.updateState(TransactionState.IPFS_UPLOADED);
        const imageResult = await failoverIPFS.add(tokenImage);
        const imageCid = imageResult.cid.toString();
        context.rollbackData.addIPFSCid(imageCid);

        // 2. メタデータをIPFSにアップロード（URIを取得）
        const metadata = {
            name: tokenName,
            description: description,
            image: `${ipfsApiUrl}:8080/ipfs/${imageResult.path}`,
            attributes: []
        };
        const metadataResult = await failoverIPFS.add(JSON.stringify(metadata, null, 2));
        const metadataCid = metadataResult.cid.toString();
        context.rollbackData.addIPFSCid(metadataCid);
        
        const tokenUrl = `${ipfsApiUrl}:8080/ipfs/${metadataCid}`;

        // 3. 画像とメタデータのCIDをpinする
        context.updateState(TransactionState.IPFS_PINNED);
        await failoverIPFS.pin(imageCid);
        context.rollbackData.addPinnedCid(imageCid);
        
        await failoverIPFS.pin(metadataCid);
        context.rollbackData.addPinnedCid(metadataCid);

        return tokenUrl;
    } catch (error) {
        const err = error as Error;
        context.addError(err, context.state);
        console.error('Failover IPFS upload failed:', err);
        
        // ロールバック実行
        try {
            await RollbackManagerWithFailover.executeRollback(context, failoverIPFS);
        } catch (rollbackError) {
            console.error('Failover rollback failed:', rollbackError);
        }
        
        throw new Error(`Failed to upload to IPFS with failover: ${err.message}`);
    }
};

// フェイルオーバー対応ロールバックマネージャー
class RollbackManagerWithFailover {
    static async executeRollback(context: TransactionContext, failoverIPFS: FailoverIPFSClient): Promise<void> {
        console.log(`Starting failover rollback for transaction ${context.id}`);
        const rollbackData = context.rollbackData;
        
        try {
            // フェイルオーバー対応IPFSロールバック
            if (rollbackData.pinnedCids.length > 0) {
                await this.rollbackIPFSWithFailover(failoverIPFS, rollbackData);
            }
            
            // ブロックチェーンロールバック（実際には取り消し不可のため警告のみ）
            if (rollbackData.blockchainTxHash) {
                console.warn(`Blockchain transaction ${rollbackData.blockchainTxHash} cannot be rolled back`);
            }
            
            context.updateState(TransactionState.ROLLED_BACK);
            console.log(`Failover rollback completed for transaction ${context.id}`);
        } catch (error) {
            console.error(`Failover rollback failed for transaction ${context.id}:`, error);
            throw error;
        }
    }
    
    private static async rollbackIPFSWithFailover(failoverIPFS: FailoverIPFSClient, rollbackData: RollbackData): Promise<void> {
        try {
            // ピンされたCIDを削除
            for (const cid of rollbackData.pinnedCids) {
                try {
                    await failoverIPFS.unpin(cid);
                    console.log(`Unpinned CID with failover: ${cid}`);
                } catch (error) {
                    console.warn(`Failed to unpin CID ${cid} with failover:`, error);
                }
            }
            
            // ガベージコレクションを実行
            await failoverIPFS.gc();
            console.log('IPFS garbage collection with failover completed');
            
        } catch (error) {
            console.error('IPFS failover rollback failed:', error);
            throw new Error(`Failed to rollback IPFS with failover: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

// トランザクションマネージャーのインスタンス
const transactionManager = new TransactionManager();

// フェイルオーバーマネージャーのインスタンス
let globalFailoverManager: FailoverManager | null = null;

/**
 * 指定されたウォレットとコントラクトアドレスを使用して新しいNFTトークンをミントする関数
 * エラーハンドリング、再試行、ロールバック、フェイルオーバー機能を含む
 *
 * @param param ミントに必要なパラメータを含むオブジェクト
 * @returns ミントプロセスのトランザクションレシート
 * @throws ウォレットの残高が不足している場合、またはミントプロセスが失敗した場合にエラーをスローします
 */
const putToken = async (param: Params) => {
    // トランザクションIDを生成
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const context = transactionManager.createTransaction(transactionId, param);
    
    // フェイルオーバー設定
    let failoverManager: FailoverManager | null = null;
    let failoverIPFS: FailoverIPFSClient | null = null;
    let failoverBlockchain: FailoverBlockchainProvider | null = null;
    
    if (param.enableFailover) {
        const config = param.failoverConfig || DEFAULT_FAILOVER_CONFIG;
        failoverManager = globalFailoverManager || new FailoverManager(config);
        if (!globalFailoverManager) {
            globalFailoverManager = failoverManager;
        }
        
        failoverIPFS = new FailoverIPFSClient(failoverManager);
        failoverBlockchain = new FailoverBlockchainProvider(failoverManager);
    }
    
    try {
        // 残高チェック（フェイルオーバー対応）
        let provider = param.wallet.provider;
        if (provider === null) { 
            throw new Error('Provider is null');
        }
        
        let balance: bigint;
        if (failoverBlockchain) {
            balance = await failoverBlockchain.getBalance(param.wallet.address);
        } else {
            balance = await provider.getBalance(param.wallet.address);
        }

        if (formatEther(balance) == "0.0") {
            throw new Error('Insufficient balance');
        }

        // 再試行処理付きでトークンをミント
        const maxRetries = param.maxRetries || 3;
        const retryDelay = param.retryDelay || 1000;
        
        const txReceipt = await RetryManager.executeWithRetry(async () => {
            let tokenUrl: string | null = null;

            // IPFSアップロード（必要な場合）
            if (param.image !== null && param.ipfsApiUrl !== null && param.description !== null) {
                if (failoverIPFS) {
                    // フェイルオーバー対応IPFSアップロード
                    tokenUrl = await uploadTokenDataWithFailover(context, param.name, param.image, param.description, failoverIPFS, param.ipfsApiUrl);
                } else if (param.client !== null) {
                    // 通常のIPFSアップロード
                    tokenUrl = await uploadTokenData(context, param.name, param.image, param.description, param.client, param.ipfsApiUrl);
                }
            }

            // ブロックチェーンにミント
            return await mintToken(context, param.name, tokenUrl);
        }, maxRetries, retryDelay);

        // 成功時にトランザクションを削除
        transactionManager.removeTransaction(transactionId);
        return txReceipt;

    } catch (error) {
        const err = error as Error;
        context.addError(err, context.state);
        context.updateState(TransactionState.FAILED);
        
        // エラータイプを分類
        const errorType = ErrorClassifier.classify(err);
        
        // 永久的エラーまたはクリティカルエラーの場合はロールバック
        if (errorType === ErrorType.PERMANENT || errorType === ErrorType.CRITICAL) {
            try {
                if (failoverIPFS) {
                    await RollbackManagerWithFailover.executeRollback(context, failoverIPFS);
                } else {
                    await RollbackManager.executeRollback(context);
                }
            } catch (rollbackError) {
                console.error('Rollback failed:', rollbackError);
            }
        }
        
        // フェイルオーバー統計をログ出力
        if (failoverManager) {
            const stats = failoverManager.getHealthStats();
            console.log('Failover Statistics:', stats);
        }
        
        // エラーログ
        console.error(`Transaction ${transactionId} failed:`, {
            error: err.message,
            errorType,
            state: context.state,
            retryCount: context.retryCount,
            errors: context.errors,
            failoverEnabled: param.enableFailover
        });
        
        // トランザクション情報を保持（デバッグ用）
        console.log(`Transaction ${transactionId} context preserved for debugging`);
        
        throw err;
    }
};

// エクスポート
export default putToken;
export { 
    TransactionManager, 
    TransactionContext, 
    ErrorClassifier, 
    RetryManager, 
    RollbackManager,
    RollbackManagerWithFailover,
    ErrorType,
    TransactionState,
    transactionManager,
    globalFailoverManager
};