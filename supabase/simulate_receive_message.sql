-- ============================================================
-- メッセージ受信テスト用スクリプト
-- ============================================================
-- 最新のマッチに対して、相手ユーザーからメッセージが送られてきた状態をシミュレートします。
-- ※ アプリ側でチャット画面を開いたままこのSQLを実行すると、リアルタイムでメッセージが届くのが確認できます！

WITH latest_match AS (
  -- 最も新しく成立したマッチを取得
  SELECT id AS match_id, user2_id AS opponent_id
  FROM public.matches
  ORDER BY created_at DESC
  LIMIT 1
)
INSERT INTO public.messages (match_id, sender_id, content)
SELECT 
  match_id, 
  opponent_id, 
  'こんにちは！マッチありがとうございます！😊 いつか一緒にセッションしましょう！'
FROM latest_match;
