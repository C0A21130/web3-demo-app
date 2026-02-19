# EtherFaucet スマートコントラクト仕様書

## 概要
EtherFaucetは、Etherの送金と受信を管理するスマートコントラクトです。主にテストネット環境でのEther配布（faucet機能）を目的としており、SsdlabTokenから分離された独立したコントラクトです。

---

## 機能概要

| 機能名 | 説明 | 実行タイミング |
|--------|------|----------------|
| faucet | 指定アドレスの残高を0.1 Etherちょうどに補充 | 外部から明示的に呼び出し |
| receive | Ether受信時に自動実行 | Etherが送信された場合 |
| fallback | 未知の関数呼び出し時に実行 | 存在しない関数を呼び出した場合 |

---

## 状態変数

### _receiveCount
```solidity
mapping(address => uint8) private _receiveCount;
```
- **型**: `mapping(address => uint8)`
- **可視性**: `private`
- **説明**: 各アドレスのEther受信回数を記録する辞書型データ
- **用途**: アドレスごとのfaucet利用回数を追跡し、過度な利用を防ぐ
- **初期値**: デフォルト値（各アドレスについて0）

---

## イベント

### Receive
```solidity
event Receive(string);
```
- **発生条件**: Ether受信時（receive関数で）
- **引数**: メッセージ文字列 `"Received called"`
- **目的**: Ether受信をブロックチェーンに記録し、外部ツールで監視可能にする

### Fallback
```solidity
event Fallback(string);
```
- **発生条件**: フォールバック関数実行時
- **引数**: メッセージ文字列 `"Fallback called"`
- **目的**: 予期せぬ呼び出しをログ化し、異常検知に利用

---

## 関数仕様

### faucet関数

```solidity
function faucet(address _to) public payable
```

#### 目的
指定アドレスの残高が0.1 Etherちょうどになるよう不足分のみ送金し、受信履歴を記録する

#### パラメータ
- **_to** (`address`): Etherを受け取るアドレス

#### 戻り値
なし

#### 実行条件（require検証）

1. **アドレス検証**
   ```solidity
   require(_to != address(0), "Invalid address");
   ```
   - `_to`がゼロアドレス（`0x0...0`）でないことを確認
   - **理由**: ゼロアドレスへの送金はEtherの焼却となり、損失を防ぐため

2. **受信者残高検証**
   ```solidity
   require(_to.balance < 0.1 ether, "Recipient has sufficient balance");
   ```
   - 受信者の残高が0.1 Ether未満であることを確認
   - **理由**: faucetは不足しているアドレスを支援する目的であり、すでに0.1 Ether以上を持つアドレスには配布しない

3. **必要送金額の算出と残高検証**
   ```solidity
   uint256 amount = 0.1 ether - _to.balance;
   require(address(this).balance >= amount, "Insufficient balance");
   ```
   - 受信者を0.1 Etherに到達させる不足分`amount`を算出し、コントラクト残高がその金額以上であることを確認
   - **理由**: 固定額送金ではなく、必要最小限の送金で0.1 Etherに調整するため

#### 実行フロー

1. **Check フェーズ**: 3つのrequireで条件を検証
2. **Effects フェーズ**: 状態変数を更新
   ```solidity
   _receiveCount[_to] += 1;
   ```
   - `_to`アドレスの受信カウントを1増加
   - **目的**: 利用回数を追跡し、認証や監視に利用可能

3. **Interactions フェーズ**: Ether送金を実行
   ```solidity
   (bool success, ) = _to.call{value: amount}("");
   require(success, "Transfer failed");
   ```
   - `call`メソッドで算出済みの`amount`を`_to`に送信
   - 戻り値`success`は送金の成否を示す（true: 成功、false: 失敗）
   - 失敗時は`require`でトランザクションをリバート

#### 例
```solidity
// 0x1234...の残高を0.1 Etherに補充
faucet(0x1234...);
```

---

### receive関数

```solidity
receive() external payable
```

#### 目的
Ether受信時に自動実行される関数で、受信イベントをログ化する

#### パラメータ
なし

#### 戻り値
なし

#### 実行条件
- Ether（データなし）がコントラクトに送信された場合
- 他の関数が呼び出されていない場合

#### 処理内容
```solidity
emit Receive("Received called");
```
- `Receive`イベントを発行し、ブロックチェーンにログを記録

#### 特徴
- 関数呼び出しが不要（自動実行）
- `payable`修飾子により、Ether受信を許可
- `external`修飾子により、外部からのアクセスのみ可能

#### 例
```solidity
// Etherを送信（receive関数が自動実行される）
address(etherFaucet).call{value: 0.01 ether}("");
```

---

### fallback関数

```solidity
fallback() external payable
```

#### 目的
未知の関数呼び出しやデータ付きのEther送信時に自動実行される関数で、予期せぬ呼び出しをログ化する

#### パラメータ
なし

#### 戻り値
なし

#### 実行条件
1. 存在しない関数が呼び出された場合
2. データ付きのEther送信が行われた場合
3. `receive`関数が定義されていないEther送信

#### 処理内容
```solidity
emit Fallback("Fallback called");
```
- `Fallback`イベントを発行し、ブロックチェーンにログを記録

#### 特徴
- 関数呼び出しが不要（自動実行）
- `payable`修飾子により、Ether受信を許可
- `external`修飾子により、外部からのアクセスのみ可能
- receive関数との違い: fallbackはより汎用的で、データ付き送金やエラー処理に対応

#### 例
```solidity
// 存在しない関数を呼び出し（fallback関数が実行）
etherFaucet.unknownFunction();

// データ付きでEtherを送信（fallback関数が実行）
address(etherFaucet).call{value: 0.01 ether}(abi.encodeWithSignature("foo()"));
```

---

## セキュリティ考慮事項

### 1. アドレス検証
- **実装**: `require(_to != address(0))`
- **目的**: ゼロアドレスへの誤送金を防止

### 2. 残高チェック
- **実装**: `uint256 amount = 0.1 ether - _to.balance; require(address(this).balance >= amount)`
- **目的**: 受信者を0.1 Etherに補充するための必要最小額を確保

### 3. 受信者保護
- **実装**: `require(_to.balance < 0.1 ether)`
- **目的**: 十分なEtherを持つアドレスへの不要な送金を防止

### 4. 送金確認
- **実装**: `require(success, "Transfer failed")`
- **目的**: Ether送金の確実性を保証

### 5. 利用回数追跡
- **実装**: `_receiveCount[_to] += 1`
- **目的**: ボット攻撃の検出や利用統計に利用可能

### 6. CEI（Checks-Effects-Interactions）パターン

#### 目的
`faucet`関数における外部送金処理を安全に実行するため、
**Checks → Effects → Interactions** の順序を厳守する。

#### 適用対象
- `faucet(address _to)`

#### 実装ルール
1. **Checks（検証）**
    - 入力値と前提条件を先に検証する。
    - 本コントラクトでは以下を検証する：
       - `_to != address(0)`
       - `_to.balance < 0.1 ether`
       - `address(this).balance >= amount`

2. **Effects（状態更新）**
    - 外部呼び出し前に内部状態を更新する。
    - 本コントラクトでは以下を更新する：
       - `_receiveCount[_to] += 1`

3. **Interactions（外部呼び出し）**
    - 最後に外部アドレスへ送金を行う。
    - 本コントラクトでは以下を実行する：
       - `_to.call{value: amount}("")`
       - `require(success, "Transfer failed")` で失敗時にリバート

#### セキュリティ上の意図
- 外部呼び出し前に状態を確定し、再入可能性に起因する不整合リスクを低減する。
- 送金失敗時はトランザクション全体をリバートし、一貫性を保つ。

#### 今後の拡張指針
- 外部送金を伴う新規関数も同じCEI順序を必須とする。
- 必要に応じて`ReentrancyGuard`導入を検討する（機能拡張時）。

### 今後の改善提案
- 利用回数の上限を設定（`require(_receiveCount[_to] < MAX_COUNT)`）
- タイムロック機能の追加（同一アドレスの再利用を期間制限）
- オーナーによる緊急停止機能
- イベント発行時に詳細情報（アドレス、金額、タイムスタンプ）を記録

---

## デプロイメント

### Hardhatでのデプロイ
```bash
npx hardhat compile  # コンパイル
npx hardhat test     # テスト実行
npx hardhat run scripts/deploy.js --network <network>  # デプロイ
```

### デプロイ後の操作
```javascript
// faucet関数を呼び出し
await etherFaucet.faucet("0xAddress...");

// Ether送信（receive関数が実行）
await accounts[0].sendTransaction({
  to: etherFaucet.address,
  value: ethers.utils.parseEther("1.0")
});
```

---

## 関連ファイル
- [SsdlabToken.sol](../contracts/contracts/SsdlabToken.sol) - EtherFaucetから分離されたNFT管理コントラクト
- [Scoring.sol](../contracts/contracts/scoring/Scoring.sol) - 信用スコア計算コントラクト

---

## 更新履歴
- 2026-02-04: 初版作成
- 2026-02-17: CEI（Checks-Effects-Interactions）パターン仕様を追記
- 2026-02-17: faucetの送金ロジック（不足分補充）に合わせて説明を更新
