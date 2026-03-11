# 新チャット再開用プロンプト（日本語）

以下を新しいチャットの最初に貼り付けて再開してください。

---
このリポジトリは `web3-demo-app` です。目的は「Difyチャットはログイン不要のまま維持し、希望者のみSBTバッジ取得と署名ログインを可能にする」ことです。

まず下記ファイルを読んでから作業を再開してください。
1. `docs/dev_handoff_2026-03-11.md`
2. `docs/sbt_badge_login_requirements.md`
3. `docs/sbt_badge_user_flow.md`
4. `docs/sbt_badge_implementation_tasks.md`

現在ブランチは `feature/sbt-badge-optional-login` です。

現時点の実装状況:
- SBTコントラクト強化済み（1アドレス1バッジ、`hasCredential`、`MINTER_ROLE`/`issueByStaff`）
- `contracts/test/memberSbtDemo.ts` は 8 passing
- フロントは任意ログイン導線を追加済み（Home/User/Navbar）
- バックエンド最小API実装済み（`/auth/nonce`, `/auth/verify`, `/auth/me`, `/auth/logout`, `/chat`）

次の最優先タスク:
- 実際のチャットUIを `backend` の `POST /chat` に接続し、ゲスト利用と任意ログイン利用の両方を確認する。

作業ルール:
- まず `git status --short` で現状確認
- 変更は小さく分割
- チーム方針に合わせて、必要なら `add + commit` までで止める（push/PRは任意）
---
