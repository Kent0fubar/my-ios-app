-- ============================================================
-- matches テーブルの RLS 修正
-- ============================================================

-- 既存の個別のポリシーを削除
DROP POLICY IF EXISTS "matches_select" ON public.matches;
DROP POLICY IF EXISTS "matches_insert" ON public.matches;
DROP POLICY IF EXISTS "matches_all" ON public.matches;

-- matches_all という包括的なポリシーを作成
CREATE POLICY "matches_all" ON public.matches
  FOR ALL TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id)
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);
