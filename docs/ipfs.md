# IPFS機能仕様書

## 概要

**Helia**ライブラリを使用してIPFS（InterPlanetary File System）にメタデータを保存し、NFTトークンと連携する機能を実装しています。

## 技術スタック

- **IPFSライブラリ**: Helia v5.5.1
- **ブロックチェーン**: Ethereum (Hardhat localhost)
- **スマートコントラクト**: SsdlabToken
- **テスト環境**: Jest with ESM support

## Overview

- [ipfs.md](/docs/ipfs.md): IPFS機能仕様書
- [putToken.ts](/frontend/src/components/putToken.ts): IPFSメタデータ付きNFTミント機能
- [token.test.ts](/frontend/test/token.test.ts): 基本NFTミント機能のテストコード
- [SsdlabToken.sol](/contracts/contracts/SsdlabToken.sol): NFTトークンのスマートコントラクト

## 機能一覧

### 1. 統合ミント機能

- IPFSへのデータアップロードやNFT発行の関数を呼び出し実行する
- 関数: `putToken`

```typescript
const putToken = async (wallet: Wallet | HDNodeWallet, contractAddress: string, tokenName: string, file: File | null): Promise<TransactionReceipt>
```

**処理の流れ**

1. 条件に合えばIPFSへデータをアップロードする処理を呼び出す
  - 条件: 引数の`file`が`null`ではなくIPFSノードに接続できることを確認する
  - [`uploadData`](#2-ipfs画像アップロード)関数と[`uploadMetadata`](#3-ipfsメタデータアップロード)関数を呼び出す
2. [`mintToken`](#4-nftミント)関数を呼び出す
  - IFPSへのアップロードを実行していれば`tokenUrl`引数に値を渡す

**主要エラー**

| エラー | 原因 |
|---|---|
| "Insufficient balance" | ウォレット残高不足 |
| "Failed to upload to IPFS" | IPFSアップロード失敗 |
| "Failed to mint NFT" | コントラクトエラー |

### 2. IPFS画像アップロード

- Heliaライブラリを使用してIPFSにコンテンツデータをアップロード
- 関数: `uploadData`
- 戻り値: IPFSハッシュ（CID形式）

```typescript
const uploadData = async (data: File): Promise<string>
```

**処理の流れ**

1. 引数で受け取った`file`を`Uint8Array`に変換する
2. 変換した`Uint8Array`をHeliaのunixfsモジュールを利用してアップロードする
  - 参考: [@helia/unixfs](https://ipfs.github.io/helia/modules/_helia_unixfs.index.html)
3. 取得したCIDを返す

### 3. IPFSメタデータアップロード

- 画像URIからメタデータを作成してIPFSにアップロード
- 関数: `uploadMetadata`
- 戻り値: IPFSハッシュ（CID形式）

```typescript
const uploadMetadata = async (tokenName: string, imageUrl: string): Promise<string>
```

**メタデータ構造**

```json
{
  "name": "トークン名",
  "description": "An NFT minted via Ssdlab using Helia IPFS library",
  "image": "IPFS画像URI",
  "attributes": []
}
```

### 4. NFTミント

- IPFSメタデータなしの基本的なNFTをミント
- 関数: `mintToken`

```typescript
const mintToken = async (wallet: Wallet | HDNodeWallet, contractAddress: string, tokenName: string, tokenUri?: string): Promise<TransactionReceipt>
```

**処理の流れ**

1. `tokenUri`に合わせてNFTを発行するスマートコントラクトを呼び出す
  - `tokenUri`が設定されていれば`safeMint`コントラクトを呼び出す
  - `tokenUri`が設定されていなければ`safeMintIpfs`コントラクトを呼び出す
2. コントラクトの処理正しく実行されていなければエラーハンドリングを実行する

## 設定情報

### IPFSゲートウェイ
- **プライベートゲートウェイ**: `http://10.203.92.63:8080/ipfs/`

### Jest設定（ESM対応）
```javascript
export default {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!(helia|@helia|multiformats|uint8arrays|@libp2p|libp2p)/)'
  ],
  testEnvironment: 'node'
};
```

## テスト仕様

### 基本NFTミントテスト
- ウォレット取得 → Ether送金 → NFTミント → 確認

### IPFSメタデータ付きNFTミントテスト  
- IPFSハッシュ指定 → メタデータ付きNFTミント → 確認

### Heliaライブラリテスト
- Heliaアップロード → メタデータ作成 → NFTミント

## トラブルシューティング

| 問題 | 解決方法 |
|---|---|
| `Promise.withResolvers is not a function` | polyfill実装済み |
| Heliaの動的import失敗 | Jest設定でtransformIgnorePatterns設定済み |
| Jestが終了しない | Heliaノードの適切な停止処理実装済み |

## パフォーマンス

- **基本NFTミント**: ~1秒
- **IPFSアップロード**: ~2-4秒  
- **メタデータ付きNFTミント**: ~4-6秒

---
**更新日**: 2025年10月9日  
**バージョン**: v1.0.0


