# backend

SBT/NFT based optional login backend for the open-campus chatbot.

## Endpoints
- `GET /health`
- `GET /auth/nonce?address=0x...`
- `POST /auth/verify`
- `GET /auth/me`
- `POST /auth/logout`
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
