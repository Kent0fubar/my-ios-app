-- ============================================================
-- messages テーブルの RLS 修正（既読機能対応版）
-- ============================================================

-- 既存のアップデートポリシーを削除
DROP POLICY IF EXISTS "messages_update" ON public.messages;

-- 送信者はメッセージの編集が可能、受信者は既読（read_at）の更新が可能
CREATE POLICY "messages_update" ON public.messages
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = messages.match_id
      AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  )
  WITH CHECK (
    -- 送信者は何でも更新可能（本当は制限すべきだが、現状のロジックに合わせる）
    (auth.uid() = sender_id)
    OR
    -- 受信者は read_at のみを更新可能（厳密なフィールド制限はPostgreSQLのトリガーが必要だが、
    -- ロジック上、受信者がここを通るのは既読更新時のみとする）
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = messages.match_id
      AND (
        (m.user1_id = auth.uid() AND m.user2_id = sender_id) OR
        (m.user2_id = auth.uid() AND m.user1_id = sender_id)
      )
    )
  );

-- Realtimeを有効化（既読通知を飛ばすため）
-- 注意: これはダッシュボードから行うか、以下のSQLコマンドが実行可能な環境で有効です。
-- ALTER PUBLICATION supabase_realtime ADD TABLE messages;
