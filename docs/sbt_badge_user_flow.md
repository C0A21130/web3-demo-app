# SBT Badge Optional Login - User Flow

## Visitor Flow (Default)
1. トップ画面を開く
2. ログインなしでDifyチャットを利用
3. 体験完了後に「参加バッジを受け取る」案内を表示

## Optional Badge Flow (Only if user wants)
1. 「バッジを受け取る」を選択
2. ウォレット接続（可能なら既存ウォレット、なければスキップ可）
3. スタッフ承認後にSBT発行
4. 発行成功メッセージ表示

## Staff Flow
1. 体験完了者を確認
2. 対象ユーザーを選択
3. 「SBT発行」実行
4. 成否ログを確認

## Failure Fallback
- ウォレット接続不可: チャット体験のみ継続
- 発行失敗: 再試行または後日発行
