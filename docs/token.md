# Token

- [SsdlabToken.sol](/contracts/contracts/SsdlabToken.sol): NFTのスマートコントラクトのコード
- [SsdlabToken.ts](/contracts/test/SsdlabToken.ts): NFTのスマートコントラクトのテストコード
- [fetchTokens.ts](/frontend/src/components/token/fetchTokens.ts): NFT取引一覧を取得する
- [putToken.ts](/frontend/src/components/token/putToken.ts): NFTを発行する
- [transferToken.ts](/frontend/src/components/token/transferToken.ts): NFTを転送する

## スマートコントラクト仕様

[SsdlabToken.sol](./contracts/SsdlabToken.sol) は、ERC721規格に基づくNFTトークンを発行・管理するスマートコントラクトである。

- NFTの発行・転送
- トークン名・URIの設定と取得

**変数一覧**
- `_nextTokenId`: 次に発行するトークンID
- `_tokenNames`: トークンIDごとの名称管理
- `_receiveCount`: アドレスごとの受信回数管理
- `_tokenURIs`: トークンIDごとのURI管理

**メソッド一覧**
- `safeMint(address to, string _tokenName)`: トークンの発行
- `safeMintIPFS(address to, string _tokenName, string _tokenURI)`
    - IPFS URI付きトークン発行
    - [IPFSの仕様書](/docs/ipfs.md)
- `transferFrom(address from, address to, uint256 tokenId)`
    - トークン転送（スコアリングによるアクセス制御）
    - [信用スコアによるアクセス制御の仕様書](/docs/scoring.md)
- `setTokenName(uint256 tokenId, string tokenName)`: トークン名設定
- `getTokenName(uint256 tokenId)`: トークン名取得
- `setTokenURI(uint256 tokenId, string tokenUrl)`: トークンURI設定
- `getTokenURI(uint256 tokenId)`: トークンURI取得
- `faucet(address _to)`: 指定アドレスへ0.1 Ether配布
- `supportsInterface(bytes4 interfaceId)`: インターフェースサポート判定

**イベント**
- `Receive(string)`: Ether受信時
- `Fallback(string)`: フォールバック時

### テストコード仕様

[SsdlabToken.ts](./test/SsdlabToken.ts) は、SsdlabTokenスマートコントラクトの動作検証を行うテストコードである。

**主なテスト内容**
- NFTの発行
    - `safeMint`でNFTを発行し、balanceやトークン名が正しく設定されているか検証
    - `safeMintIPFS`でIPFS URI付きNFTを発行し、トークン名・URIが正しく設定されているか検証
- NFTの転送
    - `transferFrom`でNFTを他アドレスへ転送し、所有者やbalanceが正しく更新されているか検証

**テスト項目の説明**
- NFTを発行したアドレスの保有数が1になっていることを確認
- 発行したトークンの名称が指定した値になっていることを確認する
- IPFS URI付きNFTの場合、トークンのURIが指定した値になっていることを確認
- NFTを転送した場合、所有者が転送先アドレスに正しく変更されていることを確認

## フロントエンド

### fetchTokens.ts

`fetchTokens.ts`は、指定したEthereumネットワーク上のコントラクトからNFTの取引履歴や保有トークン情報を取得するための関数を提供します。

- RPC URL・コントラクトアドレス・ウォレット情報を引数に取り、NFTのTransferイベントをもとにトークン情報を取得
- 取得レベル（all/sent/receive）を指定することで、NFTの取引履歴のいずれかを抽出
    - `all`: ブロックチェーンに記録された全取引における転送履歴を取得
    - `sent`: 自身が送信したNFTの転送履歴を取得
    - `receive`: 自身が受け取ったNFTの転送履歴を取得
- コントラクトの有効性やRPC接続の検証も行い、エラー時は空配列とステータスコードを返す
- 取得する情報一覧
    - `tokenId`: NFTのトークンID(イベントログから取得)
    - `owner`: NFTの所持者(スマートコントラクトで取得)
    - `name`: NFTの名前(スマートコントラクトで取得)
    - `from`: NFTの転送者(イベントログから取得)
    - `to`: NFTの受け取り主(イベントログから取得)
    - `description`: NFTの説明(IPFSから取得)
    - `imageUrl`: NFTのトークンURL(IPFSから取得)

**処理の流れ**

1. ユーザーがウォレットを保持していることを確認
2. コントラクトアドレスの有効性チェックしNFT取得のためのコントラクトインスタンス(`contract`)を作成
3. ERC-721の `Transfer` イベントログを取得

    ```mermaid
    sequenceDiagram
        participant ユーザー
        participant ethers.js
        participant NFTコントラクト

        ユーザー->>ethers.js: NFT所有者一覧をリクエスト
        ethers.js->>NFTコントラクト: Transferログをリクエスト
        NFTコントラクト-->>ethers.js: NFTのTransferログの一覧を返す
        ethers.js-->>ユーザー: NFT所有者一覧を返す
    ```

4. 取得した `Transfer` イベントログから必要な情報のみを取り出して返す

**主な用途例**
- ユーザーが保有するNFT一覧の取得
- 送信・受信履歴のフィルタリング表示
- NFTのメタデータ（画像・説明）の表示

## putToken.ts

`putToken.ts`は、ウォレットとコントラクトアドレスを指定して新しいNFTトークンをミント（発行）するためのフロントエンド用ユーティリティである
より詳細なIPFSとの連携[ipfs.md](/docs/ipfs.md)を参照

- ユーザーのウォレット残高を確認し、残高不足の場合はエラーを返す
- 画像や説明などのメタデータが指定されている場合は、IPFSに画像・メタデータをアップロードし、そのURIを取得
- IPFSへのアップロード時、画像・メタデータのCIDをpinし、エラー時はunpinやガベージコレクションでロールバック処理を行う
- コントラクトの `safeMint` または `safeMintIPFS` を呼び出してNFTを発行
- 発行処理が完了すると、トランザクションレシートを返す

**主な処理の流れ**
1. ウォレットの残高チェック
2. 画像・説明・IPFS情報があればIPFSにアップロードし、メタデータURIを取得
3. コントラクトのmint関数を呼び出しNFTを発行
4. エラー時はIPFSのロールバック処理を実施
5. トランザクションレシートを返却

## transferToken.ts

`transferToken.ts`は、NFTを他のアドレスへ転送するためのフロントエンドの関数

- ウォレットのNFT保有数（balance）を確認し、残高が0の場合はエラーを返す
- スコアリングルールによる転送制限がある場合は、エラーメッセージを判定しfalseを返す
- それ以外のエラー時は例外をスロー

**主な処理の流れ**
1. ウォレットのNFT保有数を確認
2. スマートコントラクトの`safeTransferFrom`でNFTを転送
3. スコアリングルール違反時や失敗した場合は`false`、成功時は`true`を返却

