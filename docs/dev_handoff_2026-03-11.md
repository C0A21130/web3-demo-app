# Development Handoff (2026-03-11)

## Project Goal
- Open campus chatbot (Dify) is the main feature.
- Chat usage must remain available without login.
- Optional wallet login enables SBT badge issuance and signature-based auth.

## Current Branch
- `feature/sbt-badge-optional-login`

## Completed Work
1. Requirement and flow docs added.
- `docs/sbt_badge_login_requirements.md`
- `docs/sbt_badge_user_flow.md`
- `docs/sbt_badge_implementation_tasks.md`

2. SBT contract enhancements completed.
- `contracts/contracts/sbt/MemberSbtDemo.sol`
- Added one-address-one-badge rule.
- Added `hasCredential(address)`.
- Added staff issuance entrypoint with `MINTER_ROLE` (`issueByStaff`).

3. Contract tests expanded and passing.
- `contracts/test/memberSbtDemo.ts`
- Result: 8 passing.

4. Frontend optional-login UX added.
- `frontend/src/pages/Home.tsx`
- `frontend/src/pages/User.tsx`
- `frontend/src/components/Navbar.tsx`
- Chat remains available without login.
- Optional signature login UI added in User page.
- Experience-completion checkbox added before badge issuance UI.

5. Backend minimal auth/chat proxy scaffold implemented.
- `backend/src/index.ts`
- `backend/src/auth.ts`
- `backend/src/store.ts`
- `backend/src/sbt.ts`
- `backend/src/dify.ts`
- `backend/src/config.ts`
- Endpoints:
  - `GET /health`
  - `GET /auth/nonce`
  - `POST /auth/verify`
  - `GET /auth/me`
  - `POST /auth/logout`
  - `POST /chat` (guest allowed)

## Verified Status
- Backend build: success.
- Frontend build: success.
- MemberSbtDemo tests: 8 passing.

## Open Items (Next Priority)
1. Connect real chatbot UI to backend `POST /chat`.
2. Finalize issuance policy for event day:
- keep self-mint for demo, or
- switch to staff-only issuance for production.
3. Prepare `.env` for backend and verify end-to-end run:
- `JWT_SECRET`
- `SBT_CONTRACT_ADDRESS`
- `RPC_URL`
- `DIFY_API_KEY`
- `ALLOWED_ORIGIN`
4. Add beginner-friendly Japanese backend explanation doc (optional but recommended).

## Risks / Notes
- Current nonce store is in-memory (`backend/src/store.ts`); acceptable for demo, not for scalable production.
- Existing workspace may contain unrelated local changes (ABI import adjustments). Keep commits scoped.
- Team policy currently: local `add + commit` is enough for backup; push/PR optional.

## Useful Commands
```bash
# Contract test
cd contracts && npx hardhat test test/memberSbtDemo.ts

# Frontend build
cd frontend && npm run -s build

# Backend build
cd backend && npm run -s build
```
