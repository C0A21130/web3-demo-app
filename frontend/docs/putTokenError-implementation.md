# putTokenError.ts エラーハンドリングシステム

## 概要

`putTokenError.ts`では、NFTトークンのミント処理において、順序管理機構、ロールバック処理、再試行処理、フェイルオーバーメカニズムを実装し、永久的および一時的なエラーを適切に処理します。

## 主要機能

### 1. 順序管理機構

#### TransactionManager
- 複数のトランザクションを並行管理
- トランザクション状態の追跡とライフサイクル管理
- 各トランザクションに一意のIDを割り当て

#### TransactionContext
- 個別のトランザクション状態管理
- ロールバックデータの保存
- エラー履歴の記録
- 再試行回数の追跡

#### TransactionState
```typescript
enum TransactionState {
    PENDING = 'pending',
    IPFS_UPLOADED = 'ipfs_uploaded',
    IPFS_PINNED = 'ipfs_pinned',
    BLOCKCHAIN_SUBMITTED = 'blockchain_submitted',
    COMPLETED = 'completed',
    FAILED = 'failed',
    ROLLED_BACK = 'rolled_back'
}
```

### 2. エラー分類システム

#### ErrorClassifier
エラーを以下の3つのカテゴリに分類：

- **一時的エラー (TEMPORARY)**: ネットワーク接続問題、タイムアウト、502/503/504エラーなど
- **永久的エラー (PERMANENT)**: 残高不足、認証エラー、不正なパラメータなど
- **クリティカルエラー (CRITICAL)**: スマートコントラクトのrevert、ガス不足、nonceエラーなど

### 3. 再試行処理

#### RetryManager
- 指数バックオフによる再試行
- エラータイプに基づく再試行判定
- 一時的エラーのみ再試行実行
- 永久的・クリティカルエラーは即座に失敗

```typescript
static async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000,
    backoffMultiplier: number = 2
): Promise<T>
```

### 4. ロールバック処理

#### RollbackManager
- IPFS CIDのunpinとガベージコレクション
- ブロックチェーン取引の警告表示（取り消し不可のため）
- 部分的失敗に対する復旧処理

#### RollbackData
```typescript
class RollbackData {
    public ipfsCids: string[] = [];
    public pinnedCids: string[] = [];
    public blockchainTxHash: string | null = null;
}
```

### 5. フェイルオーバーメカニズム

#### FailoverManager
- IPFS・ブロックチェーンエンドポイントの健康監視
- 自動的なエンドポイント切り替え
- 負荷分散とパフォーマンス最適化

#### フェイルオーバー戦略
- **Sequential**: 順次接続試行
- **Parallel**: 並列接続（最初に成功したものを使用）
- **Prioritized**: 応答時間でソート後選択

## 使用方法

### 基本的な使用

```typescript
import putToken from './putTokenEerror';

const params = {
    wallet: myWallet,
    contractAddress: '0x...',
    name: 'My NFT',
    description: 'NFT Description',
    image: imageFile,
    client: ipfsClient,
    ipfsApiUrl: 'http://localhost',
    maxRetries: 3,
    retryDelay: 1000
};

try {
    const receipt = await putToken(params);
    console.log('NFT minted successfully:', receipt);
} catch (error) {
    console.error('Minting failed:', error);
}
```

### フェイルオーバー有効化

```typescript
const paramsWithFailover = {
    ...params,
    enableFailover: true,
    failoverConfig: {
        ipfsEndpoints: [
            'http://localhost:5001',
            'https://ipfs.infura.io:5001',
            'https://ipfs.io'
        ],
        blockchainProviders: [
            'http://localhost:8545',
            'https://mainnet.infura.io/v3/YOUR_PROJECT_ID'
        ],
        fallbackMode: 'prioritized',
        healthCheckInterval: 30000,
        connectionTimeout: 5000,
        maxFailureCount: 3
    }
};
```

## テストケース

### 1. 順序管理テスト
- トランザクション状態の正しい遷移
- 並行トランザクションの独立性
- ロールバックデータの整合性

### 2. エラー分類テスト
- 各エラータイプの正確な分類
- エラーメッセージの解析精度

### 3. 再試行処理テスト
- 一時的エラーでの再試行実行
- 永久的エラーでの即座終了
- 指数バックオフの動作確認

### 4. ロールバックテスト
- IPFS CIDのクリーンアップ
- 部分失敗時の適切な処理
- エラー時の状態復旧

### 5. フェイルオーバーテスト
- エンドポイント切り替えの自動実行
- 健康チェックの定期実行
- 負荷分散の動作確認

### 6. 統合テスト
- エンドツーエンドのミント処理
- 複数エラーシナリオの組み合わせ
- パフォーマンステスト

## 実行方法

### テスト実行

```bash
# 全テスト実行
npm test putTokenError.test.ts

# フェイルオーバーテスト実行
npm test failoverManager.test.ts

# カバレッジ付きテスト
npm test -- --coverage
```

### デバッグモード

```typescript
// トランザクション状態の確認
const context = transactionManager.getTransaction(transactionId);
console.log('Transaction State:', context?.state);
console.log('Error History:', context?.errors);

// フェイルオーバー統計の確認
const stats = globalFailoverManager?.getHealthStats();
console.log('Failover Statistics:', stats);
```

## アーキテクチャの利点

### 1. 高可用性
- 複数エンドポイントによる冗長性
- 自動フェイルオーバーによる継続性
- 健康監視による予防的対応

### 2. 信頼性
- 永久的エラーの即座検出
- 一時的エラーの自動回復
- 完全なロールバック機能

### 3. 観測可能性
- 詳細なトランザクション履歴
- エラー分類と統計
- フェイルオーバーイベントの記録

### 4. スケーラビリティ
- 並行トランザクションの効率的管理
- 負荷分散による性能最適化
- リソース使用量の監視

## 設定例

### 本番環境設定

```typescript
const productionConfig = {
    maxRetries: 5,
    retryDelay: 2000,
    enableFailover: true,
    failoverConfig: {
        ipfsEndpoints: [
            'https://ipfs.infura.io:5001',
            'https://ipfs.io',
            'https://gateway.pinata.cloud'
        ],
        blockchainProviders: [
            'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
            'https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY',
            'https://rpc.ankr.com/eth'
        ],
        fallbackMode: 'prioritized',
        healthCheckInterval: 30000,
        connectionTimeout: 10000,
        maxFailureCount: 3
    }
};
```

### 開発環境設定

```typescript
const developmentConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    enableFailover: false,
    // ローカル環境での簡素化設定
};
```

## まとめ

この実装により、`putTokenError.ts`は以下を達成します：

1. **完全なエラーハンドリング**: 永久的・一時的エラーの適切な分類と処理
2. **自動復旧機能**: 再試行とフェイルオーバーによる高い可用性
3. **データ整合性**: ロールバック機能による確実な状態管理
4. **運用監視**: 詳細な統計とログによる運用サポート
5. **テスト性**: 包括的なテストスイートによる品質保証

これらの機能により、Web3アプリケーションにおけるNFTミント処理の信頼性と可用性を大幅に向上させることができます。