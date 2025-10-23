# MemberSBT コントラクト仕様書

## 📋 目次
1. [概要](#概要)
2. [コントラクトアーキテクチャ](#コントラクトアーキテクチャ)
3. [MemberSBT.sol 仕様](#membersbt-仕様)
4. [MemberSbtDemo.sol 仕様](#membersbtdemo-仕様)
5. [API リファレンス](#api-リファレンス)
6. [パフォーマンス最適化](#パフォーマンス最適化)
7. [テスト](#テスト)

---

## 概要

### SBT（Soulbound Token）とは
SBT（ソウルバウンドトークン）は、**譲渡不可能なNFT**です。一度発行されると、所有者から他のアドレスへ移転することができません。会員証、資格証明、参加証明など、個人に紐付く証明として使用されます。

### プロジェクトの目的
このプロジェクトでは、以下の2つのSBTコントラクトを提供します：

1. **MemberSBT.sol** - 本番環境用（権限管理機能付き）
2. **MemberSbtDemo.sol** - デモ・開発用（簡略版）

---

## コントラクトアーキテクチャ

### 継承構造
```
MemberSBT / MemberSbtDemo
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

## MemberSbtDemo 仕様

### 1. コントラクト基本情報

| 項目 | 内容 |
|------|------|
| コントラクト名 | `MemberSbtDemo` |
| Solidityバージョン | `^0.8.21` |
| ライセンス | MIT |
| 用途 | デモ・開発・テスト環境 |

### 2. MemberSBT.sol との主な違い

| 項目 | MemberSBT | MemberSbtDemo |
|------|-----------|----------------|
| MINTER_ROLE | 必要 | 不要 |
| ミント対象 | 任意のアドレス | 自分自身のみ |
| 権限管理 | 厳密 | 簡略化 |
| 用途 | 本番環境 | デモ・開発 |

### 3. safeMint の違い

| コントラクト | 権限チェック | ミント対象 |
|------------|-----------|----------|
| MemberSBT.sol | `onlyRole(MINTER_ROLE)` 必須 | 任意のアドレス |
| MemberSbtDemo.sol | 不要 | 自分自身のみ（`to == msg.sender`） |

### 4. 使い分け

| 環境 | 推奨コントラクト | 理由 |
|------|----------------|------|
| 本番環境 | MemberSBT | 権限管理が厳密 |
| テスト環境 | MemberSbtDemo | セットアップが簡単 |
| フロントエンド開発 | MemberSbtDemo | 権限付与が不要 |
| デモンストレーション | MemberSbtDemo | ユーザーが自分で発行可能 |

---

## パフォーマンス最適化

### 1. イベントログを使用した高速データ取得

`fetchCredential`関数は、イベントログを使用して効率的にSBT情報を取得します。

**特徴:**
- ✅ RPC呼び出しが1回のみ（大幅な高速化）
- ✅ ガス代不要（読み取り専用操作）
- ✅ 過去の全履歴を効率的に取得

### 2. イベントログの仕組み

**コントラクト側**: `SBTMinted`イベントを発行（`indexed`パラメータで検索可能）  
**フロントエンド側**: `contract.queryFilter()`で一括取得（1回のRPC呼び出し）

**イベントログの特徴:**
- ブロックチェーンに永久保存
- ガス代なしで読み取り可能
- `indexed`パラメータで効率的に検索可能

### 3. 注意事項

- **プロバイダーの設定**: ウォレットには必ずプロバイダーを接続する
- **大量データ**: RPCプロバイダーの制限がある場合はブロック範囲を分割

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
- `contractAddress`: MemberSbtDemoコントラクトのアドレス
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
- `contractAddress`: MemberSbtDemoコントラクトのアドレス

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

## テスト

```bash
# スマートコントラクト
npx hardhat test test/memberSbtDemo.test.ts

# フロントエンド
npm run test test/credential.test.ts
```

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

---

## ライセンス

MIT License

---

**最終更新日**: 2025年10月20日
