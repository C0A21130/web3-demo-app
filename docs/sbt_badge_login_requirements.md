# SBT Badge Login Requirements (Open Campus)

## Goal
- Difyチャットはログイン不要で全員利用可能
- 希望者のみ任意ログインでSBTバッジを取得できる

## Scope
- 対象規模: 約10人
- バッジ種類: 1種類（システム開発道場）
- 発行タイミング: 体験完了時
- 次回特典: SBT保有者向けに実施（予定）

## UX Policy
- パスワード登録は必須にしない
- ウォレット作成は必須にしない
- チャット体験を最優先（導線を邪魔しない）

## Operation Policy
- 発行運用はスタッフ承認付き（手動トリガ）
- 本番障害時は「チャットのみ利用可」にフォールバック

## Data Policy (Minimum)
- オンチェーン: 所有情報中心（個人情報は入れない）
- メタデータ: badgeType, issuedAt, eventId を最小構成で管理
- 本名・学籍番号などPIIは記録しない

## Non-goals (for now)
- Hardhat3移行はこの機能開発と分離
- 高度なメタデータ暗号化/可搬性設計は次フェーズ
