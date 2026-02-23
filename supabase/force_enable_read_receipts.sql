-- ============================================================
-- 既読機能の完全有効化＆デバッグ用ツール
-- ============================================================

-- 1. レプリカアイデンティティをFULL設定（更新時の全カラム通知を保証）
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- 2. リアルタイム配信設定（既にある場合は無視される）
-- 注意: このコマンドは特定の環境下でエラーになることがありますが、基本的には不要（schema.sqlで設定済み）
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 3. 全ユーザーを強制的にプレミアムにする（テスト用）
-- 本番ではこれを行わないでください
UPDATE public.profiles SET is_premium = true;

-- 4. 既存の全ての送受信済みメッセージを一旦「既読」にする（テスト用）
-- これにより、過去のメッセージに「既読」が出るはずです
UPDATE public.messages SET read_at = NOW() WHERE read_at IS NULL;

-- 5. RLSの再徹底（受信者が更新できるようにする）
DROP POLICY IF EXISTS "messages_update" ON public.messages;
CREATE POLICY "messages_update_v3" ON public.messages
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = messages.match_id
      AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  )
  WITH CHECK (true); -- テストのため一時的にチェックを緩和
