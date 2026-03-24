# IPFS

## 概要

- [ipfs.md](/docs/ipfs.md): IPFS機能仕様書
- [putToken.ts](/frontend/src/components/token/putToken.ts): IPFSメタデータ付きNFTミント機能
- [token.test.ts](/frontend/test/ipfs.test.ts): IPFSを利用したNFTミント機能のテストコード
- [SsdlabToken.sol](/contracts/contracts/SsdlabToken.sol): NFTトークンのスマートコントラクト

- **IPFSライブラリ**: kubo-rpc-client
- **ブロックチェーン**: Ethereum (Hardhat localhost)
- **スマートコントラクト**: SsdlabToken
- **テスト環境**: Jest with ESM support

## putToken.tsに基づくIPFS連携仕様

### 1. 画像・メタデータのアップロードとNFTミント

- 画像や説明などのメタデータが指定されている場合、IPFSに画像・メタデータをアップロードし、そのURIを取得
- 画像・メタデータのCIDをpinし、エラー時はunpinやガベージコレクションでロールバック処理を行う
- コントラクトを呼び出してNFTを発行
  - `safeMint`: 画像やメタデータを含まないトークンの発行
  - `safeMintIPFS`: `ToknenURI`を指定したトークンの発行

#### 主な処理の流れ
1. ウォレットの残高チェック
2. 画像・説明・IPFS情報があればIPFSにアップロードし、メタデータURIを取得
3. コントラクトのmint関数を呼び出しNFTを発行
4. エラー時はIPFSのロールバック処理を実施
5. トランザクションレシートを返却

#### エラー時のロールバック
- IPFSへのアップロードやpin処理でエラーが発生した場合、pin解除（unpin）やガベージコレクション（repo.gc）でリソースをクリーンアップ

### 2. IPFSアップロード関数例

- 画像アップロード: `client.add(file)`
- メタデータアップロード: `client.add(JSON.stringify(metadata))`
- pin: `client.pin.add(cid)`
- unpin: `client.pin.rm(cid)`
- ガベージコレクション: `client.repo.gc()`

### 3. メタデータ構造例

```json
{
  "name": "トークン名",
  "description": "NFTの説明",
  "image": "IPFS画像URI",
  "attributes": []
}
```

## テスト

### テスト環境設定方法

JestでESM対応のTypeScriptテストを実行するには、以下のような設定を`jest.config.js`に記述してください。

```javascript
/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', {
      useESM: true
    }]
  },
  testEnvironment: 'node',
  transformIgnorePatterns: [
    'node_modules/(?!(kubo-rpc-client|@ipld|multiformats|uint8arrays)/)'
  ],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.[jt]s$': '$1'
  }
};
```

- `preset: 'ts-jest/presets/default-esm'` でESM対応のTypeScriptテストを有効化
- `extensionsToTreatAsEsm: ['.ts']` で`.ts`ファイルをESMとして扱う
- `transformIgnorePatterns` でkubo-rpc-client等のESM依存パッケージをトランスパイル対象に含める
- `moduleNameMapper` で相対パスimportの拡張子解決をサポート

### テストコード (ipfs.test.ts)

- Hardhat ローカルノードに接続した `JsonRpcProvider` と秘密鍵からウォレットを生成する
- `kubo-rpc-client` の `create` 関数で IPFS API クライアント (`KuboRPCClient`) を作成する
- ダミーの PNG バイト列から `File` オブジェクトを生成し、`putToken` に以下のパラメータを渡して NFT をミントする
  - `name`: トークン名
  - `image`: 画像ファイル
  - `description`: トークン説明
  - `wallet`: ミントに使用するウォレット
  - `contractAddress`: SsdlabToken コントラクトアドレス
  - `client`: IPFS クライアント
  - `ipfsApiUrl`: IPFS API のベース URL
- 戻り値のトランザクションレシート `txReceipt` が定義されており、ログが 1 件以上存在することを検証する
- 最後のログから `tokenId`（`args[2]`）を取得し、値が定義されていることを検証する
- コントラクトインスタンスを生成し、`getTokenURI(tokenId)` を呼び出して、ミントされたトークンに IPFS メタデータ URI が正しく設定されていることを確認する
- IPFS 処理に時間がかかる可能性を考慮し、テストのタイムアウトを `60000ms` に延長している
