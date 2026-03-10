# MintNFT 学習メモ（備忘録）

## 保存場所
- このメモは `frontend/docs/MintNFT-README.md` に保存
- 理由:
  - 対象コード（`frontend/src/components/MintNFT.ts`）に近い
  - フロント実装の変更と一緒に追従しやすい
  - `docs/` 直下の全体資料（ブロックチェーン全般）と役割を分離できる

## 対象ファイル構成（今回の課題で触る場所）
- 実装: `frontend/src/components/MintNFT.ts`
- テスト: `frontend/test/mintNft.test.ts`
- ABI/Artifact: `contracts/artifacts/contracts/Mytoken.sol/MyToken.json`

## 目的（課題の要件）
- コントラクトアドレスを指定してNFT発行コントラクトを呼び出す
- 引数としてトークン所有者（owner）とトークンID（tokenId）を受け取る
- テストコードで呼び出し確認を行う

## MintNFT.ts の処理フロー
1. `contractAddress` / `owner` / `tokenId` の入力チェック
2. `ethereum`（ウォレット注入）確認
3. `BrowserProvider` 作成
4. `getSigner()` で署名者取得
5. `new Contract(contractAddress, MyTokenArtifact.abi, signer)`
6. `safeMint(owner, tokenId)` 実行
7. `tx.wait()` で確定待ち

## 重要な役割の違い
- `contractAddress`: どのスマートコントラクトを呼ぶか（呼び先）
- `owner` / `tokenId`: コントラクトに渡す入力データ
- `provider`: 読み取り寄り
- `signer`: 署名して書き込み可能（mint時に必須）

## 間違えやすいポイント
- `mint` と `safeMint` の関数名不一致
  - ABIにある関数名と一致させる
- ABIとコントラクトアドレスの不一致
  - 別契約のABIを渡すと実行時エラーになりやすい
- `tx.wait()` を省略する
  - 確定前に成功表示してしまう
- `isAddress` の検証を省略する
  - 無駄な送信や分かりにくい失敗が増える
- `|`（ユニオン型）を「引数個数」と誤解する
  - 実際は「許容される型候補」

## テスト方針（現状）
- 異常系1本
  - ウォレット未接続時にエラー
- 成功系1本
  - `safeMint` 成功時に `wait` 結果を返す
- 依存注入（`MintNftDeps`）を使い、環境依存を減らして安定テスト化

## エラー発生時の確認順
1. `contractAddress` が正しいか
2. `owner` が正しいアドレス形式か
3. `tokenId` が `0n` 以上か
4. ウォレット接続されているか
5. ABI（MyTokenArtifact.abi）と呼び先契約が一致しているか
6. signerで呼んでいるか（providerのみで書き込もうとしていないか）

## 今後の拡張候補
- UIからの呼び出し（入力フォーム + 実行結果表示）
- ネットワークID（chainId）チェック
- エラーメッセージのユーザー向け整形
