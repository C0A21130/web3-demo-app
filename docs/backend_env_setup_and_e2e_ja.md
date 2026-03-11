# バックエンド `.env` 設定とフロント経由E2E確認ガイド（Dify未接続でも可）

このガイドは、
- `.env` の書き換えが分からない
- まずはDify接続なしで一連の流れを確認したい
という状況向けです。

## 1. `.env` の作成

```bash
cd backend
cp .env.example .env
```

## 2. `.env` を編集する方法

エディタで `backend/.env` を開いて値を書き換えます。

最小構成（Dify未接続で流れ確認）:
```env
PORT=8080
NODE_ENV=development
JWT_SECRET=dev-only-very-secret-key
JWT_EXPIRES_IN_SECONDS=1800
ALLOWED_ORIGIN=http://localhost:5173
CHAIN_ID=31337
RPC_URL=http://127.0.0.1:8545
SBT_CONTRACT_ADDRESS=<デプロイ済みMemberSbtDemoのアドレス>
STAFF_ISSUER_PRIVATE_KEY=<MINTER_ROLEを持つアカウント秘密鍵>
STAFF_API_KEY=my-local-staff-key
DIFY_API_BASE=https://api.dify.ai/v1
DIFY_API_KEY=
DIFY_APP_USER_PREFIX=open-campus
CHAT_MOCK_MODE=true
```

ポイント:
- `JWT_SECRET` と `SBT_CONTRACT_ADDRESS` は必須
- Difyをまだ使わない間は `CHAT_MOCK_MODE=true` にする
- スタッフ発行APIを使うなら `STAFF_*` の2つを入れる

## 3. 値の調べ方（Hardhatローカル）

### 3-1. SBT_CONTRACT_ADDRESS
- 既にデプロイ済みのアドレスを使う
- 迷ったら `frontend/src/App.tsx` の `credentialContractAddress` 値を仮参照してもよい

### 3-2. STAFF_ISSUER_PRIVATE_KEY
- `contracts` のローカル検証用アカウント（デモ用）を使う
- `MemberSbtDemo` の `MINTER_ROLE` を持つアカウント秘密鍵を設定

## 4. サーバ起動

ターミナル1（バックエンド）:
```bash
cd backend
npm install
npm run dev
```

ターミナル2（フロントエンド）:
```bash
cd frontend
npm install
npm run dev
```

## 5. E2E確認シナリオ（フロント経由）

1. `http://localhost:5173` を開く
2. 通常チャット導線が見えることを確認（ログイン不要）
3. 「任意ログイン」画面へ移動
4. ウォレット接続
5. 体験完了チェックをON
6. バッジ発行フローを実行（必要に応じてスタッフAPIを使用）
7. 署名ログインを実行
8. 認証状態が `ログイン済み` になることを確認
9. ログアウトして `未ログイン` に戻ることを確認

## 6. APIでの補助確認（任意）

- 保有確認:
```bash
curl "http://localhost:8080/badge/status?address=0x..."
```

- スタッフ発行:
```bash
curl -X POST "http://localhost:8080/badge/issue" \
  -H "Content-Type: application/json" \
  -H "x-staff-api-key: my-local-staff-key" \
  -d '{"address":"0x...","userName":"student-a"}'
```

- 発行ログ確認:
```bash
curl "http://localhost:8080/badge/logs?limit=20" \
  -H "x-staff-api-key: my-local-staff-key"
```

## 7. よくあるエラー

- `Missing required env: JWT_SECRET`
  - `.env` の `JWT_SECRET` が空
- `Missing required env: SBT_CONTRACT_ADDRESS`
  - `.env` のコントラクトアドレスが未設定
- `unauthorized_staff`
  - `x-staff-api-key` と `.env` の `STAFF_API_KEY` 不一致
- `badge_issue_failed`
  - `STAFF_ISSUER_PRIVATE_KEY` が不正、またはMINTER_ROLE不足

---
最初は `CHAT_MOCK_MODE=true` で全体フローを体験し、
安心できたら `CHAT_MOCK_MODE=false` + `DIFY_API_KEY` 設定で本番接続に進むのがおすすめです。
