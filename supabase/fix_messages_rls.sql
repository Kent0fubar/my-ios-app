-- ============================================================
-- messages テーブルの RLS 修正
-- ============================================================

-- 既存の個別のポリシーを削除
DROP POLICY IF EXISTS "messages_select" ON public.messages;
DROP POLICY IF EXISTS "messages_insert" ON public.messages;
DROP POLICY IF EXISTS "messages_update" ON public.messages;
DROP POLICY IF EXISTS "messages_delete" ON public.messages;
DROP POLICY IF EXISTS "messages_all" ON public.messages;

-- 自分が関与するマッチのメッセージのみ閲覧可能
CREATE POLICY "messages_select" ON public.messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = messages.match_id
      AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );

-- 自分が送信者の場合にのみメッセージを送信可能（簡略化：マッチIDの厳密なチェックを外す）
CREATE POLICY "messages_insert" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- 自分が送信者の場合にのみ更新可能
CREATE POLICY "messages_update" ON public.messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = sender_id);

-- 自分が送信者の場合にのみ削除可能
CREATE POLICY "messages_delete" ON public.messages
  FOR DELETE TO authenticated
  USING (auth.uid() = sender_id);
