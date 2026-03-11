# 起動・動作確認 README（任意ログイン + SBT）

このREADMEは、`web3-demo-app` をローカルで起動し、
- ログイン未利用（ゲスト）
- ログイン利用（SBT発行 + 署名ログイン）
の2パターンを確認するための手順書です。

## 0. 事前前提

- OS: Linux/macOS 想定
- Node.js: `.nvmrc` に合わせる
- 4つのターミナルを使うと進めやすい

推奨ターミナル役割:
- ターミナルA: Hardhat node
- ターミナルB: Contract deploy
- ターミナルC: Backend
- ターミナルD: Frontend

## 1. 初回セットアップ

```bash
cd /home/taito/web3-demo-app
```

```bash
cd contracts && npm install
cd ../backend && npm install
cd ../frontend && npm install
```

## 2. ローカルチェーン起動（ターミナルA）

```bash
cd /home/taito/web3-demo-app/contracts
npx hardhat node
```

## 3. コントラクトデプロイ（ターミナルB）

```bash
cd /home/taito/web3-demo-app/contracts
npx hardhat ignition deploy ignition/modules/localhost.ts --network localhost
```

出力例:
- `localhostModule#MemberSbtDemo - 0x...`（SBT）
- `localhostModule#SsdlabToken - 0x...`（NFT）

このうち以下を控える:
- SBTアドレス: `MemberSbtDemo`
- NFTアドレス: `SsdlabToken`

## 4. フロント設定更新

`frontend/src/App.tsx` を開き、デプロイしたアドレスに合わせる。

- `contractAddress` <- `SsdlabToken` のアドレス
- `credentialContractAddress` <- `MemberSbtDemo` のアドレス

## 5. backend .env 設定（ターミナルC）

```bash
cd /home/taito/web3-demo-app/backend
cp .env.example .env
```

`backend/.env` を編集:

```env
PORT=8080
NODE_ENV=development
JWT_SECRET=your-long-random-secret
JWT_EXPIRES_IN_SECONDS=1800
ALLOWED_ORIGIN=http://localhost:5173
CHAIN_ID=31337
RPC_URL=http://127.0.0.1:8545
SBT_CONTRACT_ADDRESS=<MemberSbtDemoのアドレス>
STAFF_ISSUER_PRIVATE_KEY=
STAFF_API_KEY=
DIFY_API_BASE=https://api.dify.ai/v1
DIFY_API_KEY=
DIFY_APP_USER_PREFIX=open-campus
CHAT_MOCK_MODE=true
```

メモ:
- `SBT_CONTRACT_ADDRESS` は `MemberSbtDemo` を設定
- `CHAT_MOCK_MODE=true` ならDify未接続でも `/chat` 動作確認可能
- `STAFF_*` は代理発行APIを使う時だけ設定

## 6. backend起動（ターミナルC）

```bash
cd /home/taito/web3-demo-app/backend
npm run dev
```

## 7. frontend起動（ターミナルD）

```bash
cd /home/taito/web3-demo-app/frontend
npm run dev
```

注意:
- 正しいコマンドは `npm run dev`
- `npm run deb` は誤り

## 8. 動作確認シナリオ

ブラウザで `http://localhost:5173` を開く。

### 8-1. パターンA（ログイン未利用）

1. Home画面を開く
2. チャット利用導線を確認（ログイン不要方針）
3. 任意ログインせず終了

期待結果:
- 体験を中断せず利用できる

### 8-2. パターンB（ログイン利用）

1. `任意ログイン` 画面へ移動
2. ウォレット作成/接続
3. ETH受け取り（必要時）
4. 体験完了チェックをON
5. `My会員証` でユーザー名を入力して発行
6. `署名してログイン`
7. 状態が `ログイン済み` になることを確認
8. `ログアウト` 実行

期待結果:
- 会員証発行後に署名ログイン成功
- `認証済みアドレス` が表示される

## 9. 代理発行（スタッフ運用する場合）

前提:
- `backend/.env` に以下を設定
  - `STAFF_ISSUER_PRIVATE_KEY`（MINTER_ROLE保有アカウント）
  - `STAFF_API_KEY`

代理発行API:

```bash
curl -X POST "http://localhost:8080/badge/issue" \
  -H "Content-Type: application/json" \
  -H "x-staff-api-key: <STAFF_API_KEY>" \
  -d '{"address":"0x対象ウォレット","userName":"表示名"}'
```

確認API:

```bash
curl "http://localhost:8080/badge/status?address=0x対象ウォレット"
```

```bash
curl "http://localhost:8080/badge/logs?limit=20" \
  -H "x-staff-api-key: <STAFF_API_KEY>"
```

## 10. トラブルシュート

- `badge_required` になる
  - SBT未発行か、発行先と照会先コントラクト不一致
  - `frontend/src/App.tsx` の `credentialContractAddress` と
    `backend/.env` の `SBT_CONTRACT_ADDRESS` を一致させる

- backend起動時に `Missing required env`
  - `JWT_SECRET` / `SBT_CONTRACT_ADDRESS` が未設定

- frontendが起動しない
  - `npm run dev` を実行しているか確認
  - `npm run deb` は存在しない

- ローカルチェーン再起動後に保有情報が消えた
  - Hardhat local は永続前提でない
  - 再デプロイ後はアドレス再設定が必要

## 11. 当日運用の推奨

- 基本導線: 全員はログイン不要チャット
- 希望者のみ: SBT発行 + 署名ログイン
- ウォレットに不慣れな参加者はスタッフ代理発行でフォロー

これにより、体験完走率を維持しながらWeb3要素を任意提供できる。
