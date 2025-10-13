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

### 1. 基本NFTミント
- IPFSメタデータなしの基本的なNFTをミント
- 関数: `mintBaseToken`

### 2. IPFSアップロード
- Heliaライブラリを使用してIPFSにデータをアップロード
- 関数: `uploadData`
- 対応形式: `string` | `Uint8Array`
- 戻り値: IPFSハッシュ（CID形式）

### 3. IPFSメタデータ付きNFTミント
- 画像URIからメタデータを作成してIPFSにアップロード
- 関数: `uploadMatadata`

### 4. 統合ミント機能
- tokenURIの有無により基本ミントまたはIPFSミントを自動選択
- 関数: `putToken`

## メタデータ構造
```json
{
  "name": "トークン名",
  "description": "An NFT minted via Ssdlab using Helia IPFS library",
  "image": "IPFS画像URI",
  "attributes": []
}
```

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

## APIリファレンス

### putToken関数

```typescript
putToken(wallet: Wallet, contractAddress: string, tokenName: string, tokenURI: string)
```

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| wallet | Wallet \| HDNodeWallet | ✓ | 署名用ウォレット |
| contractAddress | string | ✓ | スマートコントラクトアドレス |
| tokenName | string | ✓ | トークン名 |
| tokenURI | string | - | IPFSハッシュまたはURI |

**戻り値**: `TransactionReceipt`

### 主要エラー

| エラー | 原因 |
|---|---|
| "Insufficient balance" | ウォレット残高不足 |
| "Failed to upload to IPFS" | IPFSアップロード失敗 |
| "Failed to mint NFT" | コントラクトエラー |

---
**更新日**: 2025年10月9日  
**バージョン**: v1.0.0


