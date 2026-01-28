# Scoring

信用スコアリングシステムにおけるスマートコントラクトを用いたシステムである

1. 信用スコアの算出とアクセス制御(Scoring)
2. 信用スコアの管理(TrustRating)

## Overview

※事前に信用スコアリングシステム([https://github.com/C0A21130/trust-score](https://github.com/C0A21130/trust-score))を起動しアクセスポイントのURLを取得する

- 信用スコアによるアクセス制御
    - アクセスポイント([/frontend/src/App.tsx](/frontend/src/App.tsx))を設定
    ```typescript
    export const scoringEndpointUrl = "<信用スコアリングシステムのアクセスポイントURL>";
    ```
    - ポリシーは[http://localhost:5173/user](http://localhost:5173/user)にアクセスしポリシーを設定する
    - ポリシーを設定後は自動でアクセス制御が行われる
- NFT取引履歴の取得・登録
    - 事前にMetamaskを利用できるようにしてEthereum等のネットワークにアクセスできるようにしておく
    - [http://localhost:5173/score](http://localhost:5173/score)にアクセスし、ウォレットアドレスに接続でMetamaskに接続する
    - 接続に完了するとウォレットアドレスが表示されるため確認し取得対象のコントラクトアドレスを入力する
    - NFT取引ログを取得後は先頭50件が画面に表示されるため信用スコアリングシステムに登録する

## Trust scoring contract

信用スコアリングスマートコントラクトでは外部の信用スコアリングシステムが算出した信用スコアの管理とポリシーによるアクセス制御を行う

- [scoring.md](/docs/scoring.md): 信用スコアリングシステムの開発仕様書
- [Scoring.sol](/contracts/contracts/scoring/Scoring.sol): 信用スコアリングシステムのメインコード
- [Scoring.ts](/contracts/test/scoring/Scoring.ts): Scoring.solのテストコード
- [TrustRating.sol](/contracts/contracts/scoring/TrustRating.sol): Agentにより算出されたスコアの管理
- [IERC4974.sol](/contracts/contracts/scoring/IERC4974.sol): ERC4974のインターフェース

```mermaid
classDiagram
    class TrustRating {
        -operators: mapping(address=>bool)
        -ratings: mapping(address=>int8)
        +edgeCount: mapping(address=>mapping(address=>bool))
        +averageRating: int8
        -ratingCount: int256
        +supportsInterface(bytes4) bool
        +setOperator(address)
        +rate(address,int8)
        +removeRating(address)
        +ratingOf(address) int8
    }

    class Scoring {
        -policies: mapping(address=>uint8)
        +getScore(address) int8
        +getScores(address[]) int8[]
        +compareScore(address,address) bool
        +setPolicy(uint8)
        +getPolicy(address) uint8
        +accessControl(address,address) bool
    }

    TrustRating ..|> IERC4974
    Scoring --|> TrustRating
```

### アクセス制御コントラクト

[Scoring.sol](/contracts/contracts/scoring/Scoring.sol)は、　`TrustRating.sol` を継承し、信用スコアリングシステムの中核となるスマートコントラクトである。
信用スコアリングシステムが登録する外部評価を組み合わせて総合的なアクセス制御を実現する。
これらの判断はユーザーが設定するポリシーに基づいたアクセス制御を実施する。

- `getScore(address _user)`
    - アドレスを指定して信用スコアを取得する
    - 0アドレス指定時はリバートする
    - `TrustRating.ratingOf(_user)` を呼び出し、-127〜127 の `int8` スコアを返す
- `getScores(address[] memory _users)`
    - 複数ユーザーの信用スコアを一括取得
    - 各ユーザーに対して `getScore` を実行し、同じ並び順で配列に格納する
- `compareScore(address myAddress, address targetAddress)`
    - 自身と取引相手のスコア比較
    - 2アドレスともゼロアドレスを拒否
    - `myScore >= targetScore` なら `true`、それ以外は `false`
- `setPolicy(uint8 policy) / getPolicy(address user)`
    - アクセス制御ポリシーの設定・取得
    - `setPolicy` は呼び出し元アドレス `msg.sender` に対してポリシー値 0〜4 を設定する
    - `getPolicy` は任意ユーザーのポリシーを参照し、0アドレス指定時はリバートする
    - ポリシーの意味:
        - 0: アクセス制御なし(初期値)
        - 1: 通常ユーザー（自分のスコアが相手以上なら許可）
        - 2: 適応的ユーザー（スコア比較に加え、既知関係があれば許可）
        - 3: フリーライダー（自分のスコアが相手以上かつ平均スコア以上の場合のみ許可）
        - 4: 孤立ユーザー（常に拒否）
- `accessControl(address from, address to)`
    - ポリシーに応じた取引可否のアクセス制御を行う
    - `to` のポリシーを取得し、`from` / `to` 双方のスコアと `edgeCount`・`averageRating` を用いて取引可否を決定する
    - ポリシーごとの判定ロジック:
        - Policy 0: 常に許可
        - Policy 1: `fromScore >= toScore` のとき許可
        - Policy 2: `fromScore >= toScore` または `edgeCount[to][from]` もしくは `edgeCount[from][to]` が `true` のとき許可
        - Policy 3: `fromScore >= toScore` かつ `fromScore >= averageRating` のときのみ許可
        - Policy 4: 常に拒否

**テストコード**

[Scoring.ts](/contracts/test/scoring/Scoring.ts)では[Scoring.sol](/contracts/contracts/scoring/Scoring.sol)の信用スコアリングシステムの統合テストを実行する。
Scoring コントラクト単体の基本機能と、SsdlabToken と連携したポリシー別アクセス制御の動作を検証する。

1. **テストケース構成**

    **Scoring コントラクトの基本機能テスト**
    - `getScore` の初期値確認: 未評価ユーザーのスコアが 0 であることを検証
    - `getScores` の一括取得確認: 複数アドレスに対してスコア配列が返ることを確認
    - `setPolicy` / `getPolicy` の動作確認: 呼び出し元アドレスに対して任意のポリシー値を設定・取得できることを検証
    - スコア比較機能: `rate` でユーザーごとにスコアを設定し、自身と相手のスコア比較結果が期待通りになることを確認

    **SsdlabToken と連携したアクセス制御テスト**
    - ポリシー0（アクセス制御なし）: Policy 0を設定したユーザー間では常にNFT転送が成功することを検証
    - ポリシー1（通常ユーザー）: 高スコア → 低スコア の方向のみ取引可否になり、逆方向の転送はリバートすることを検証
    - ポリシー2（適応的ユーザー）: 過去の取引履歴が存在する場合はスコアが低い場合でも組み合わせにより取引が許可されるケースを検証
    - ポリシー3（フリーライダー）: スコアが高くても平均スコア未満の場合は取引が拒否となりNFT転送がリバートされることを検証
    - ポリシー4（孤立ユーザー）: Policy 4を設定したユーザーとの取引は常に拒否され、NFT転送がリバートされることを検証

### 信用スコア管理コントラクト

[TrustRating.sol](/contracts/contracts/scoring/TrustRating.sol)は`IERC4974.sol`を継承し、信用スコア管理の中核となるスマートコントラクトである。

**主要機能**

1. **オペレーター (Trust Scoring Agent) 管理機能**
    - `constructor(address _operator)`: 初期オペレーター設定
    - `setOperator(address _operator)`: 新しいTrust Score Agentの追加
    - `onlyOperator` modifier: オペレーターのみ実行可能な関数の制御

2. **外部評価管理機能（ERC4974準拠）**
    - `rate(address _rated, int8 _rating)`: Trust Score Agentによるスコア登録
    - `removeRating(address _removed)`: 登録済みスコアの削除
    - `ratingOf(address _rated)`: 外部評価スコアの取得
    - `_rating` は -127〜127 の範囲のみ許可され、それ以外はリバートする

3. **信用ネットワーク情報の管理機能**
    - `edgeCount(address from, address to)`: ユーザー間の既知関係の有無を管理するフラグでありPolicy 2 で「取引履歴の有無」として参照される
    - `averageRating`: すべての評価の単純平均を `int8` で保持

**ERC4974**

- [IERC4974.sol](/contracts/contracts/scoring/IERC4974.sol)はTrust Scoring Agentが算出した信用スコアの値を`ERC4974`を用いて管理する
- Ethereumブロックチェーン上で数値評価を管理するための標準インターフェース
- 評価はint8型（-128～127の範囲）で管理され、ポジティブ・ネガティブ両方の評価が可能
- オペレーターが管理し、評価の付与・変更・削除を行える
    - 悪意のある評価操作を防ぐため、評価の更新・削除機能を提供
    - 評価を決める方法は実装者に委ねられている
- ERC165(コントラクトが特定のインターフェースをサポートしているか確認する仕組み)を継承している

## Trust scoring Frontend

以下のモジュールを用いて信用スコアに関するスマートコントラクトの呼び出しと取引履歴の管理を行う

- [compareScore.ts](/frontend/src/components/scoring/compareScore.ts): 自身と取引相手の信用スコアを比較する
- [configPolicy.ts](/frontend/src/components/scoring/confgPolicy.ts): 自身のNFT取引のアクセス制御におけるポリシーを変更する
- [fetchScores.ts](/frontend/src/components/scoring/fetchScores.ts): 自身と取引相手の信用スコアを取得する
- [fetchTransferLogs.ts](/frontend/src/components/scoring/fetchTransferLogs.ts): ブロックチェーン上のNFT取引履歴を取得する
- [postTransferLogs.ts](/frontend/src/components/scoring/postTransferLogs.ts): ブロックチェーン上の取引履歴を信用スコアリングシステムへ送信する

### 信用スコアコントラクトの呼び出し

**compareScore.ts**

- 自分のウォレットアドレスと取引相手アドレスの信用スコアを比較し、取引可能かどうかを判定する関数
- コントラクトの `compareScore` を呼び出し、自分のスコアが相手以上の場合は `true`、それ以外は `false` を返す
- 無効なアドレス形式やコントラクト呼び出し失敗時には例外をスローし、エラーログを出力する

**configPolicy.ts**

- ユーザー自身のNFT取引におけるアクセス制御ポリシーを設定する関数
- スマートコントラクトの `setPolicy` を呼び出しトランザクションを送信する
- `policy` は 0〜4 の数値を取り、Scoring コントラクトで定義される各ポリシー（アクセス制御なし／通常ユーザー／適応的ユーザー／フリーライダー／孤立ユーザー）に対応する
- `setPolicy` 実行後に `getPolicy` スマートコントラクトを呼び出しポリシーが正しく設定できていることを検証する

**fetchPolicy**

- ユーザー自身のNFT取引におけるアクセス制御ポリシーを取得する関数
- スマートコントラクトの `getPolicy` を呼び出しポリシーを取得する 

**fetchScores.ts**

- ユーザー自身と取引相手の信用スコアを取得する関数
- 指定したユーザーアドレスリスト`targetAddressList`と自分のウォレットアドレスについてスマートコントラクトから信用スコアを取得する
- 取得したスコアはint8型を100で割ってnumber型に変換し返却する
- 取得したスコアは`targetScores`（取引相手のスコア配列）と`myScore`（自分のスコア）として返す

### 取引履歴の取得・登録

**fetchTransferLogs.ts**

- ブロックチェーン上のNFTのログを取得する関数
    - `fetchEventLogs`: NFT転送時に記録される `EventLog` を取得する
    - `fetchReceiptLogs`: 取得した `EventLog` からトランザクションのレシートを取得しガス代と `TokenURI` を取得する
- 指定したコントラクトアドレスの `Transfer` イベントを、最新ブロック番号まで一定ブロック数ごとに分割して取得し、ガス代やTokenURIなどの情報を付加して返す
- 内部処理:
    1. コントラクトインスタンスと最新ブロック番号を取得
    2. ブロック範囲ごとに`queryFilter("Transfer", fromBlock, toBlock)`でイベントログを取取得する
    3. 取得した各ログについて、ethers.jsの`getTransactionReceipt`を用いてトランザクションレシートを取得し、`gasPrice`と`gasUsed`を`gwei`単位の文字列として取得
    4. イベント引数またはトピックから`tokenId`を特定し、`tokenURI(tokenId)`を呼び出してメタデータURIを取得
    5. fromアドレスがゼロアドレス（NFTの発行）であるログを除外し、それ以外のログのみをTransferLog型に整形

**postTransferLogs.ts**

- `fetchTransferLogs.ts`を用いて取得するNFTの取引ログを信用スコアリングシステムへ送信する関数
- 指定したコントラクトアドレスとTransferLog配列をAPIサーバーにPOSTし、スコアリングシステムに取引履歴を記録する
- ログが空の場合は送信せずに終了する

### Reference

- Ethereum Improvement Proposals, ERC-4974: Ratings, [https://eips.ethereum.org/EIPS/eip-4974](https://eips.ethereum.org/EIPS/eip-4974)
- Ethereum Improvement Proposals, ERC-165: Standard Interface Detection, [https://eips.ethereum.org/EIPS/eip-165](https://eips.ethereum.org/EIPS/eip-165)
