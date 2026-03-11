# SBT Badge Optional Login - Minimum Tasks

> 調査更新日: 2026-03-11
> 
> 判定根拠:
> - フロント: `frontend/src/pages/Home.tsx`, `frontend/src/pages/User.tsx`
> - コントラクト/テスト: `contracts/contracts/sbt/MemberSbtDemo.sol`, `contracts/test/memberSbtDemo.ts`
> - バックエンド: `backend/src/index.ts`, `backend/src/sbt.ts`

## Phase 1: Frontend導線（ログイン不要 + 任意バッジ）
- [ ] チャット画面に「バッジを受け取る（任意）」ボタンを追加
	- 現状: `Home` には任意ログイン導線あり。ただし「実チャット画面」への導線設置は未確認。
- [x] ウォレット未接続でもチャット利用できる状態を維持
	- 根拠: `User` 画面で「通常のチャット体験はログイン不要」と明示。バックエンド `POST /chat` はゲスト許可。
- [x] 接続失敗時は「チャットのみ継続」を表示
	- 根拠: `User` の署名ログイン失敗時に「ログインなしで継続可能」アラートを追加。

## Phase 2: Contract確認（既存SBTの再利用）
- [x] 既存SBTコントラクトで mint 権限と balanceOf を確認
	- 根拠: `MemberSbtDemo.sol` に `MINTER_ROLE` / `issueByStaff`。`backend/src/sbt.ts` で `hasCredential` と `balanceOf` フォールバック確認。
- [ ] 体験完了時の mint 条件をテストに追加
	- 現状: コントラクトテストは8件で権限・重複発行・譲渡不可などをカバー。体験完了フラグ連動の自動テストは未追加。

## Phase 3: Backend最小API（後で追加）
- [x] POST /badge/issue (スタッフ操作で発行)
- [x] GET /badge/status?address=... (保有確認)
- [x] 発行ログ（成功/失敗）を残す

補足:
- 現在のバックエンドは `/auth/*` と `/chat` を実装済み。
- `GET /badge/status`, `POST /badge/issue`, `GET /badge/logs` を実装済み。
