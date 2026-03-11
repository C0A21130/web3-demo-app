# Optional Login Backend 解説（日本語）

このドキュメントは `backend/` の構造・役割・動作フローを、実装コードに対応させて理解するための学習メモです。

## 1. 何をするバックエンドか

目的は次の2つを両立することです。
- チャットはログイン不要（ゲスト利用可能）
- 希望者だけ署名ログインし、SBT保有者として認証状態を持てる

実装上は `POST /chat` を中心に、任意ログインのための `auth` 系APIが前段にあります。

## 2. ファイル構成と役割

- `backend/src/index.ts`
  - APIエントリポイント。
  - ミドルウェア（`helmet`, `cors`, `json`, `cookie-parser`）設定。
  - ルーティング（`/auth/*`, `/badge/status`, `/chat`）の実体。

- `backend/src/config.ts`
  - `.env` 読み込みと設定値の集約。
  - 必須環境変数チェック（`JWT_SECRET`, `SBT_CONTRACT_ADDRESS`）。

- `backend/src/auth.ts`
  - 署名検証とJWT発行/検証。
  - `parseNonceFromMessage` で署名メッセージから nonce を取り出す。

- `backend/src/store.ts`
  - nonce の一時保管（メモリ内 `Map`）。
  - `createNonce`, `consumeNonce` を提供（ワンタイム利用）。

- `backend/src/sbt.ts`
  - SBT保有チェックのブロックチェーン呼び出し層。
  - まず `hasCredential`、失敗時は `balanceOf` にフォールバック。

- `backend/src/dify.ts`
  - Dify APIラッパー。
  - `callDifyChat` が `chat-messages` を呼ぶ。

- `backend/src/types.ts`
  - APIリクエストやセッションの型定義。

## 3. APIごとの動作フロー

### 3-1. `GET /auth/nonce`
1. `address` の形式検証（`ethers.isAddress`）
2. `store.createNonce` でnonce作成（TTL付き）
3. 署名対象メッセージを生成して返す

ポイント:
- メッセージに `nonce`, `issuedAt`, `chainId`, `address` を含める
- このnonceは次の `/auth/verify` で1回だけ有効

### 3-2. `POST /auth/verify`
1. `address/message/signature` の入力検証
2. `auth.parseNonceFromMessage` でnonce抽出
3. `store.consumeNonce` でワンタイム検証
4. `auth.verifySignature` で署名検証
5. `sbt.hasSbtCredential` でSBT保有確認
6. 条件を満たせば `auth.signSession` でJWT発行
7. `httpOnly cookie (oc_token)` に保存して返却

ポイント:
- SBT未保有は `403 badge_required`
- nonce再利用や期限切れは `401 invalid_or_expired_nonce`

### 3-3. `GET /auth/me`
1. Cookieから `oc_token` を取得
2. `auth.verifySession` でJWT検証
3. 成功時、`address` と `chainId` を返す

### 3-4. `POST /auth/logout`
1. `oc_token` を `clearCookie`
2. `ok: true` を返す

### 3-5. `GET /badge/status?address=...`
1. `address` 検証
2. `sbt.hasSbtCredential` 実行
3. `hasBadge` を返却

### 3-6. `POST /chat`
1. Cookieから任意でJWTを検証（失敗してもゲスト扱いで続行）
2. `query` が空なら `400 query_required`
3. `userId` を決定
   - ログイン済み: `payload.sub`
   - ゲスト: `guest:<ip>`
4. `dify.callDifyChat` でDifyへ中継
5. 結果を `{ ok, auth, data }` で返す

ポイント:
- この設計により「ログイン不要チャット」が成立
- 認証は追加コンテキストとしてのみ効く

## 4. セキュリティ/運用上の注意点

- nonceストアはメモリ内実装
  - 再起動で消える
  - 複数インスタンスで共有できない
- Cookie設定
  - `httpOnly` でJSから読めない
  - `secure` は本番（`NODE_ENV=production`）で有効
- レート制限
  - auth: 1分20回
  - chat: 1分40回

## 5. まず読む順番（学習ロードマップ）

1. `index.ts`
   - ルート全体を見て、どのファイルを呼んでいるか把握
2. `auth.ts` + `store.ts`
   - optional login の核心（nonce + signature + session）
3. `sbt.ts`
   - ログイン条件（SBT保有）の判断ロジック
4. `dify.ts`
   - チャット中継部分
5. `config.ts`
   - 実行時に必要な環境変数を確認

## 6. 実践チェック（手動API確認）

- `GET /health`
- `GET /auth/nonce?address=...`
- `POST /auth/verify`
- `GET /auth/me`
- `GET /badge/status?address=...`
- `POST /chat`

最短確認コマンド例（概念）:
```bash
cd backend
npm run dev
```

別ターミナルで `curl` やフロントから順に叩き、
- nonce取得
- 署名
- verify
- me
- chat
の順で確認すると流れが掴みやすいです。

## 7. つまずきやすい点

- `DIFY_API_KEY` 未設定で `/chat` が 502 になる
- `SBT_CONTRACT_ADDRESS` や `RPC_URL` が不正で `hasSbtCredential` が常にfalseになる
- 署名時に使った `message` と verify送信の `message` が一致していない
- nonceが期限切れ、または使い回しされている

---
このドキュメントを読んだら、次は「実際に1回ログイン成功するまで」をハンズオンで実施すると理解が定着します。
