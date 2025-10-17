# MemberSBT コントラクト仕様書

## 📋 目次
1. [概要](#概要)
2. [コントラクトアーキテクチャ](#コントラクトアーキテクチャ)
3. [MemberSBT.sol 仕様](#membersbt-仕様)
4. [MemberSBT_Demo.sol 仕様](#membersbt_demo-仕様)
5. [デプロイ方法](#デプロイ方法)
6. [使用例](#使用例)
7. [パフォーマンス最適化](#パフォーマンス最適化)
8. [セキュリティ考慮事項](#セキュリティ考慮事項)
9. [テスト](#テスト)

---

## 概要

### SBT（Soulbound Token）とは
SBT（ソウルバウンドトークン）は、**譲渡不可能なNFT**です。一度発行されると、所有者から他のアドレスへ移転することができません。会員証、資格証明、参加証明など、個人に紐付く証明として使用されます。

### プロジェクトの目的
このプロジェクトでは、以下の2つのSBTコントラクトを提供します：

1. **MemberSBT.sol** - 本番環境用（権限管理機能付き）
2. **MemberSBT_Demo.sol** - デモ・開発用（簡略版）

---

## コントラクトアーキテクチャ

### 継承構造
```
MemberSBT / MemberSBT_Demo
├── ERC5192（SBTの基本機能）
│   └── ERC721（NFTの基本機能）
└── AccessControl（権限管理機能）
```

### 主要な規格
- **ERC721**: NFTの標準規格
- **ERC5192**: SBT（譲渡不可能トークン）の規格
- **ERC165**: インターフェース検出の標準規格
- **AccessControl**: OpenZeppelinの役割ベースアクセス制御

---

## MemberSBT 仕様

### 1. コントラクト基本情報

| 項目 | 内容 |
|------|------|
| コントラクト名 | `MemberSBT` |
| Solidityバージョン | `^0.8.21` |
| ライセンス | MIT |
| 用途 | 本番環境での会員証SBT発行・管理 |

### 2. 主要な状態変数

| 変数名 | 型 | 説明 |
|--------|-----|------|
| `MINTER_ROLE` | bytes32 | SBT発行権限を識別するロールID |
| `_nextTokenId` | uint256 | 次に発行するSBTのID（初期値: 0） |
| `_userNames` | mapping | Token IDとユーザー名の紐付け |

### 3. イベント

**SBTMinted**: SBT発行時に発火するイベント

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| to | address | SBTの受信者アドレス（indexed） |
| tokenId | uint256 | 発行されたToken ID（indexed） |
| userName | string | ユーザー名 |

### 4. コンストラクタ

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| _name | string | SBTの名前（例: "Member Soulbound Token"） |
| _symbol | string | SBTのシンボル（例: "MSBT"） |
| _isLocked | bool | ロック状態（通常はtrue） |
| ownerAdmin | address | 管理者アドレス |
| initialMinters | address[] | 初期ミント権限者のアドレス配列 |

### 5. 主要な関数

| 関数名 | アクセス制御 | 説明 | ガス消費量 |
|--------|------------|------|-----------|
| `safeMint(address to, string userName)` | MINTER_ROLE必須 | SBTを発行し、Token IDを返す | 約123,000 gas |
| `getUserName(uint256 tokenId)` | 誰でも可能 | Token IDからユーザー名を取得 | 無料（view） |
| `getTotalSupply()` | 誰でも可能 | 発行済みSBTの総数を取得 | 無料（view） |
| `verifyCredential(uint256 tokenId, address userAddress)` | 誰でも可能 | 指定されたアドレスがSBTの所有者かどうかを検証 | 無料（view） |
| `supportsInterface(bytes4 interfaceId)` | 誰でも可能 | ERC165インターフェース確認 | 無料（view） |

### 6. 権限管理

| ロール名 | 説明 | 主な権限 |
|---------|------|---------|
| `DEFAULT_ADMIN_ROLE` | 管理者ロール | ロールの付与・剥奪 |
| `MINTER_ROLE` | ミント権限 | SBTの発行 |

**権限管理関数**: `grantRole()`, `revokeRole()`, `hasRole()`

---

## MemberSBT_Demo 仕様

### 1. コントラクト基本情報

| 項目 | 内容 |
|------|------|
| コントラクト名 | `MemberSBT_Demo` |
| Solidityバージョン | `^0.8.21` |
| ライセンス | MIT |
| 用途 | デモ・開発・テスト環境 |

### 2. MemberSBT.sol との主な違い

| 項目 | MemberSBT | MemberSBT_Demo |
|------|-----------|----------------|
| MINTER_ROLE | 必要 | 不要 |
| ミント対象 | 任意のアドレス | 自分自身のみ |
| 権限管理 | 厳密 | 簡略化 |
| 用途 | 本番環境 | デモ・開発 |

### 3. safeMint の違い

| コントラクト | 権限チェック | ミント対象 |
|------------|-----------|----------|
| MemberSBT.sol | `onlyRole(MINTER_ROLE)` 必須 | 任意のアドレス |
| MemberSBT_Demo.sol | 不要 | 自分自身のみ（`to == msg.sender`） |

### 4. 使い分け

| 環境 | 推奨コントラクト | 理由 |
|------|----------------|------|
| 本番環境 | MemberSBT | 権限管理が厳密 |
| テスト環境 | MemberSBT_Demo | セットアップが簡単 |
| フロントエンド開発 | MemberSBT_Demo | 権限付与が不要 |
| デモンストレーション | MemberSBT_Demo | ユーザーが自分で発行可能 |

---

## デプロイ方法

### 1. デプロイ手順

```bash
# Hardhat Ignitionを使用してデプロイ
npx hardhat ignition deploy ignition/modules/MemberSBT.ts --network localhost

# デプロイされたアドレスを確認
cat ignition/deployments/chain-31337/deployed_addresses.json
```

### 2. 環境変数の設定

`.env` ファイル例:
- `AGENT_PRIVATE_KEY`: 管理者またはエージェントの秘密鍵
- `LOCAL_RPC_URL`: ローカルノードのRPC URL (例: http://127.0.0.1:8545/)
- `SBT_CONTRACT_ADDRESS`: デプロイされたコントラクトアドレス

---

## 使用例

### 1. エージェントによるSBT発行（バックエンド）

```javascript
const { mintSbt, getUserNameForToken } = require('./agent/workers/sbtAgent/sbtManager.js');

// SBTを発行
const tokenId = await mintSbt("0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "佐藤太郎");

// ユーザー名を取得
const userName = await getUserNameForToken(tokenId);
```

### 2. フロントエンドでのSBT発行と取得

```typescript
import { ethers } from "ethers";
import issueCredential from './components/SBT-modules/issueCredential';
import fetchCredential from './components/SBT-modules/fetchCredential';

// ウォレット接続（Node.js環境）
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const wallet = new ethers.Wallet(privateKey, provider);

// ウォレット接続（ブラウザ環境 - MetaMask）
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

// SBTを発行
const credential = await issueCredential(wallet, contractAddress, "佐藤太郎");
// => { tokenId: 0, userName: "佐藤太郎", address: "0x...", trustScore: 0 }

// 全SBT情報を取得
const credentials = await fetchCredential(wallet, contractAddress);
// => [{ tokenId: 0, userName: "佐藤太郎", ... }, ...]
```

---

## パフォーマンス最適化

### 1. イベントログを使用した高速データ取得

`fetchCredential`関数は、イベントログを使用して効率的にSBT情報を取得します。

**特徴:**
- ✅ RPC呼び出しが1回のみ（大幅な高速化）
- ✅ ガス代不要（読み取り専用操作）
- ✅ 過去の全履歴を効率的に取得

### 2. パフォーマンス比較

#### 100個のSBTが発行されている場合

| 項目 | 従来の方法（個別呼び出し） | イベントログ使用 | 改善率 |
|------|------------------------|----------------|--------|
| **RPC呼び出し回数** | 201回<br>(getTotalSupply: 1回<br>ownerOf: 100回<br>getUserName: 100回) | **1回**<br>(queryFilter: 1回) | **99.5%削減** |
| **推定処理時間**<br>(RPC 50ms想定) | 約10秒 | **約0.05秒** | **200倍高速化** |
| **ガス代** | 0 ETH<br>(view関数のため) | 0 ETH<br>(view関数のため) | 同じ |
| **ネットワーク負荷** | 高い | 低い | 大幅削減 |

#### 1000個のSBTが発行されている場合

| 項目 | 従来の方法 | イベントログ使用 | 改善率 |
|------|-----------|----------------|--------|
| **RPC呼び出し回数** | 2001回 | **1回** | **99.95%削減** |
| **推定処理時間**<br>(RPC 50ms想定) | 約100秒 | **約0.05秒** | **2000倍高速化** |

### 3. イベントログの仕組み

**コントラクト側**: `SBTMinted`イベントを発行（`indexed`パラメータで検索可能）  
**フロントエンド側**: `contract.queryFilter()`で一括取得（1回のRPC呼び出し）

**イベントログの特徴:**
- ブロックチェーンに永久保存
- ガス代なしで読み取り可能
- `indexed`パラメータで効率的に検索可能

### 4. 注意事項

- **プロバイダーの設定**: ウォレットには必ずプロバイダーを接続する
- **大量データ**: RPCプロバイダーの制限がある場合はブロック範囲を分割

### 5. パフォーマンス最適化のまとめ

| 観点 | 評価 |
|------|------|
| **パフォーマンス** | ⭐⭐⭐⭐⭐ 圧倒的に高速 |
| **コスト効率** | ⭐⭐⭐⭐⭐ ガス代不要 |
| **実装難易度** | ⭐⭐⭐⭐ 比較的簡単 |
| **推奨度** | **強く推奨** |

**結論**: SBT情報の取得には、**イベントログを使用する`fetchCredential`関数を強く推奨**します。特にToken数が増えるほど、その効果は絶大です。

---

## セキュリティ考慮事項

### 1. アクセス制御

#### ✅ 推奨事項
- **MINTER_ROLEの厳格な管理**: 信頼できるアドレスにのみ付与
- **DEFAULT_ADMIN_ROLEの保護**: マルチシグウォレットの使用を推奨
- **定期的な権限監査**: 不要なロールは即座に剥奪

#### ❌ 避けるべき事項
- 秘密鍵の共有
- 不特定多数へのMINTER_ROLE付与
- ハードコーディングされた秘密鍵の使用

### 2. 譲渡不可能性の保証

ERC5192の実装により、`transferFrom`等がブロックされ譲渡が不可能です。

### 3. メタデータの管理

- オンチェーン保存（永続的・変更不可）
- 個人情報の保存には注意が必要

### 4. ガスコスト

| 操作 | ガス消費量（目安） |
|------|------------------|
| デプロイ | 2,724,387 gas |
| safeMint | 123,568 gas |
| getUserName | 無料（view関数） |

### 5. リスクと対策

| リスク | 影響 | 対策 |
|-------|------|------|
| 秘密鍵の漏洩 | MINTER_ROLEの悪用 | ハードウェアウォレット使用 |
| スマートコントラクトのバグ | 資金・データ損失 | 監査の実施 |
| ガス代の高騰 | 発行コスト増加 | ガス価格の監視 |
| オンチェーンデータの永続性 | 削除不可 | 慎重なデータ設計 |

---

## テスト

### 1. テスト実行方法

```bash
# スマートコントラクト
npx hardhat test test/MemberSBT_Demo.ts

# フロントエンド
cd frontend && npm run test test/Membersbt_democheck.test.ts
```

### 2. テストカバレッジ

**スマートコントラクト**: 5項目（自分自身への発行、他人への発行禁止、ユーザー名取得、譲渡防止、イベント発行）  
**フロントエンド**: 11項目（SBT発行、全SBT取得、型検証、エラーハンドリング等）

全テスト合格: ✅

---

## API リファレンス

### フロントエンド関数一覧

#### 1. issueCredential（SBT発行）

```typescript
issueCredential(
    wallet: Wallet | HDNodeWallet,
    contractAddress: string,
    userName: string
): Promise<UserCredential>
```

**説明**: ウォレットを使用して新しいSBTを発行し、発行された認証情報を返します。

**パラメータ:**
- `wallet`: SBTを発行するウォレット（Wallet または HDNodeWallet）
- `contractAddress`: MemberSBT_Demoコントラクトのアドレス
- `userName`: SBTに紐付けるユーザー名

**戻り値:** `UserCredential`
```typescript
{
    tokenId: number;      // 発行されたトークンID
    userName: string;     // ユーザー名
    address: string;      // ウォレットアドレス
    trustScore: number;   // 信頼スコア（デフォルト: 0）
}
```

**使用例:**
```typescript
const credential = await issueCredential(wallet, contractAddress, "佐藤太郎");
// => { tokenId: 0, userName: "佐藤太郎", address: "0x...", trustScore: 0 }
```

**エラー:**
- `"Invalid contract address"`: 無効なコントラクトアドレスが指定された場合
- `"User name is required"`: ユーザー名が空または空白のみの場合
- `"Wallet provider is not available"`: ウォレットにプロバイダーが設定されていない場合
- `"You can only mint an SBT for yourself"`: 自分以外のアドレスにSBTを発行しようとした場合
- `"Insufficient funds for gas"`: ガス代が不足している場合
- `"Transaction failed"`: トランザクションの送信に失敗した場合
- `"Transaction receipt failed"`: トランザクションの受領に失敗した場合
- `"SBTMinted event not found in transaction logs"`: イベントが見つからない場合
- `"Invalid token ID received from event"`: イベントから無効なトークンIDを受信した場合

**エラーハンドリング例:**
```typescript
try {
    const credential = await issueCredential(
        wallet,
        contractAddress,
        "佐藤太郎"
    );
    console.log(`✅ SBT発行成功: Token ID ${credential.tokenId}`);
} catch (error) {
    if (error instanceof Error) {
        if (error.message.includes('Invalid contract address')) {
            console.error('コントラクトアドレスが無効です');
        } else if (error.message.includes('Insufficient funds')) {
            console.error('ガス代が不足しています');
        } else if (error.message.includes('User name is required')) {
            console.error('ユーザー名を入力してください');
        } else {
            console.error('SBT発行エラー:', error.message);
        }
    }
}
```

#### 2. fetchCredential（認証情報取得）

```typescript
fetchCredential(
    wallet: Wallet | HDNodeWallet,
    contractAddress: string
): Promise<UserCredential[]>
```

**説明**: イベントログを使用して、すべてのSBT所持者の認証情報を高速に取得します。

**パラメータ:**
- `wallet`: プロバイダーが設定されたウォレット
- `contractAddress`: MemberSBT_Demoコントラクトのアドレス

**戻り値:** `UserCredential[]`
```typescript
[
    {
        tokenId: number;
        userName: string;
        address: string;
        trustScore: number;
    },
    ...
]
```

**使用例:**
```typescript
const credentials = await fetchCredential(wallet, contractAddress);
// => [{ tokenId: 0, userName: "佐藤太郎", ... }, ...]
```

**エラー:**
- `"Invalid contract address"`: 無効なコントラクトアドレスが指定された場合
- `"Wallet provider is not available"`: ウォレットにプロバイダーが設定されていない場合
- `"Failed to create contract instance"`: コントラクトインスタンスの作成に失敗した場合
- `"Failed to create event filter"`: イベントフィルターの作成に失敗した場合
- `"Too many events. Please use a smaller block range or contact support."`: イベント数が多すぎる場合
- `"Network error while fetching events. Please check your connection."`: ネットワークエラーが発生した場合
- `"Failed to query events"`: イベントのクエリに失敗した場合

**エラーハンドリング例:**
```typescript
try {
    const credentials = await fetchCredential(wallet, contractAddress);
    console.log(`✅ ${credentials.length}件の認証情報を取得しました`);
} catch (error) {
    if (error instanceof Error) {
        if (error.message.includes('Invalid contract address')) {
            console.error('コントラクトアドレスが無効です');
        } else if (error.message.includes('Too many events')) {
            console.error('データ量が多すぎます。管理者に連絡してください。');
        } else if (error.message.includes('Network error')) {
            console.error('ネットワークエラー。接続を確認してください。');
        } else {
            console.error('認証情報取得エラー:', error.message);
        }
    }
}
```

**特徴:**
- ✅ **高速**: イベントログを使用（1回のRPC呼び出し）
- ✅ **効率的**: ガス代不要
- ✅ **完全**: すべての発行済みSBTを取得

### 戻り値の型定義

すべての型定義は `vite-env.d.ts` に定義されています：

```typescript
interface UserCredential {
    tokenId: number;      // SBTのトークンID
    userName: string;     // ユーザー名
    address: string;      // 所有者のアドレス
    trustScore: number;   // 信頼スコア
}
```

### 関数の使い分け

| 操作 | 使用する関数 | 主な用途 |
|------|------------|---------|
| SBTを発行する | `issueCredential` | ユーザー登録、認証発行 |
| 全SBTを取得する | `fetchCredential` | ユーザー一覧表示、統計分析 |

---

## トラブルシューティング

### よくある問題と解決策

#### 1. SBT発行時のエラー

**症状1: Invalid contract address**
```
Error: Invalid contract address
```

**原因:** コントラクトアドレスの形式が無効

**解決策:**
```typescript
// アドレスの検証
if (!ethers.isAddress(contractAddress)) {
    console.error('Invalid address format');
}

// 正しい形式: 0xで始まる40文字の16進数
const validAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
```

**症状2: User name is required**
```
Error: User name is required
```

**原因:** ユーザー名が空または空白のみ

**解決策:**
```typescript
// ユーザー名の検証
const userName = userInput.trim();
if (!userName) {
    console.error('Please enter a user name');
    return;
}

const credential = await issueCredential(wallet, contractAddress, userName);
```

**症状3: Insufficient funds for gas**
```
Error: Insufficient funds for gas
```

**原因:** ウォレットにガス代が不足

**解決策:**
```typescript
// 残高確認
const balance = await wallet.provider.getBalance(wallet.address);
console.log(`Balance: ${ethers.formatEther(balance)} ETH`);

if (balance < ethers.parseEther("0.01")) {
    console.error('Insufficient balance. Please add funds.');
}
```

**症状4: You can only mint an SBT for yourself**
```
Error: You can only mint an SBT for yourself
```

**原因:** MemberSBT_Demoでは自分自身にのみSBTを発行可能

**解決策:**
```typescript
// 正しい使用方法: toアドレス = msg.sender
const credential = await issueCredential(
    wallet,
    contractAddress,
    userName
); // 内部的に wallet.address が使用される
```

**症状5: Wallet provider is not available**
```
Error: Wallet provider is not available
```

**原因:** ウォレットにプロバイダーが設定されていない

**解決策:**
```typescript
// ❌ 誤り: プロバイダーなし
const wallet = new ethers.Wallet(privateKey);

// ✅ 正しい: プロバイダー付き
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const wallet = new ethers.Wallet(privateKey, provider);
```

#### 2. 認証情報取得時のエラー

**症状1: Wallet provider is not available**
```
Error: Wallet provider is not available
```

**原因:** ウォレットにプロバイダーが設定されていない

**解決策:**
```typescript
// プロバイダーが設定されたウォレットを使用
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const wallet = new ethers.Wallet(privateKey, provider);

// または既存のウォレットにプロバイダーを接続
const connectedWallet = wallet.connect(provider);
```

**症状2: Too many events**
```
Error: Too many events. Please use a smaller block range or contact support.
```

**原因:** 大量のイベントを一度に取得しようとした

**解決策:**
```typescript
// RPCプロバイダーの制限を確認し、必要に応じてバッチ処理を実装
// または管理者に連絡してインフラを拡張
```

**症状3: Network error while fetching events**
```
Error: Network error while fetching events. Please check your connection.
```

**原因:** ネットワーク接続の問題

**解決策:**
```typescript
// ネットワーク接続を確認
try {
    const blockNumber = await provider.getBlockNumber();
    console.log('Connection OK, current block:', blockNumber);
} catch (error) {
    console.error('Network connection failed');
}

// リトライロジックの実装
async function fetchWithRetry(wallet: Wallet, address: string, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fetchCredential(wallet, address);
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            console.log(`Retry ${i + 1}/${maxRetries}...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
}
```

#### 3. メモリ不足エラー

**症状:**
```
FATAL ERROR: Reached heap limit
```

**原因**: 大量のイベントを一度に取得

**解決策:**
- Node.jsのヒープサイズを増やす: `node --max-old-space-size=4096`
- イベント取得範囲を分割する

#### 4. コントラクトアドレスが無効

**症状:**
```
Error: Invalid contract address
```

**解決策:**
- アドレスが正しいか確認（0xで始まる40文字の16進数）
- デプロイ済みのアドレスか確認

---

## FAQ

### Q1: MemberSBTとMemberSBT_Demoのどちらを使うべきですか？

**A:** 用途によります。

- **本番環境**: MemberSBT.sol（権限管理が厳密）
- **開発・テスト**: MemberSBT_Demo.sol（セットアップが簡単）

### Q2: issueCredentialとfetchCredentialの違いは何ですか？

**A:** 

- **issueCredential**: 新しいSBTを発行する関数（書き込み操作）
  - ガス代が必要
  - トランザクションを送信
  - 1つのUserCredentialを返す
  
- **fetchCredential**: すべてのSBT情報を取得する関数（読み取り操作）
  - ガス代不要
  - イベントログから取得
  - UserCredential配列を返す

### Q3: ガス代はかかりますか？

**A:** 
- **SBT発行**: ガス代がかかります（約123,000 gas）
- **情報取得**: ガス代は不要（view関数のため）

### Q4: 発行したSBTを削除できますか？

**A:** いいえ。SBTは**譲渡不可能**であり、現在の実装では削除（バーン）機能もありません。必要に応じてバーン機能を追加することは可能です。

### Q5: イベントログはどこに保存されますか？

**A:** ブロックチェーンに永続的に保存されます。ノードがフルノードであれば、全てのイベントログにアクセスできます。

---

## 参考リンク

- [EIP-721: NFT Standard](https://eips.ethereum.org/EIPS/eip-721)
- [EIP-5192: Minimal Soulbound NFTs](https://eips.ethereum.org/EIPS/eip-5192)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js v6 Documentation](https://docs.ethers.org/v6/)
- [Ethers.js v6 - queryFilter](https://docs.ethers.org/v6/api/contract/#BaseContract-queryFilter)
- [Solidity Events](https://docs.soliditylang.org/en/latest/contracts.html#events)

---

## バージョン履歴

| バージョン | 日付 | 変更内容 |
|-----------|------|---------|
| 1.2.0 | 2025-10-16 | API刷新 |
| - | - | issueCredentialとfetchCredentialに統一 |
| - | - | UserCredential型の導入 |
| - | - | APIリファレンスの更新 |
| 1.1.0 | 2025-10-09 | パフォーマンス最適化セクション追加 |
| - | - | イベントログ使用の実装追加 |
| - | - | APIリファレンス追加 |
| - | - | トラブルシューティング追加 |
| - | - | FAQ追加 |
| 1.0.0 | 2025-10-09 | 初版リリース |
| - | - | MemberSBT.sol 実装 |
| - | - | MemberSBT_Demo.sol 実装 |
| - | - | エージェント機能追加 |

---

## ライセンス

MIT License

---

**最終更新日**: 2025年10月17日
