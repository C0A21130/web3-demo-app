# SBT Badge Optional Login - Minimum Tasks

## Phase 1: Frontend導線（ログイン不要 + 任意バッジ）
- [ ] チャット画面に「バッジを受け取る（任意）」ボタンを追加
- [ ] ウォレット未接続でもチャット利用できる状態を維持
- [ ] 接続失敗時は「チャットのみ継続」を表示

## Phase 2: Contract確認（既存SBTの再利用）
- [ ] 既存SBTコントラクトで mint 権限と balanceOf を確認
- [ ] 体験完了時の mint 条件をテストに追加

## Phase 3: Backend最小API（後で追加）
- [ ] POST /badge/issue (スタッフ操作で発行)
- [ ] GET /badge/status?address=... (保有確認)
- [ ] 発行ログ（成功/失敗）を残す
