# backend

SBT/NFT based optional login backend for the open-campus chatbot.

## Endpoints
- `GET /health`
- `GET /auth/nonce?address=0x...`
- `POST /auth/verify`
- `GET /auth/me`
- `POST /auth/logout`
- `GET /badge/status?address=0x...`
- `POST /badge/issue` (staff only)
- `GET /badge/logs` (staff only)
- `POST /chat` (guest allowed, auth optional)

## Quick start
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

## Notes
- Nonce is one-time and short-lived.
- JWT is short-lived and stored in `httpOnly` cookie.
- `/chat` can be used without login; when logged in, user context is attached.
- `CHAT_MOCK_MODE=true` でDify未接続でも `/chat` のモック応答を返せる。

## Staff issuance env vars
- `STAFF_ISSUER_PRIVATE_KEY`: `issueByStaff` を送信するスタッフウォレット秘密鍵
- `STAFF_API_KEY`: `/badge/issue` と `/badge/logs` を保護する共有キー（`x-staff-api-key`）
