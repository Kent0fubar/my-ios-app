-- ============================================================
-- スワイプテーブル（swipes）のセキュリティポリシー（RLS）修正パッチ
-- 
-- 実行方法: Supabase Dashboard > SQL Editor でこのファイルの内容を実行
-- ============================================================

-- 既存の個別のポリシーを念のため削除
DROP POLICY IF EXISTS "swipes_select" ON public.swipes;
DROP POLICY IF EXISTS "swipes_insert" ON public.swipes;
DROP POLICY IF EXISTS "swipes_update" ON public.swipes;
DROP POLICY IF EXISTS "swipes_delete" ON public.swipes;
DROP POLICY IF EXISTS "swipes_all" ON public.swipes;

-- 認証済みユーザーが「自分のスワイプのみ」に対して全操作（取得・追加等）を行えるようにする
CREATE POLICY "swipes_all" ON public.swipes
  FOR ALL TO authenticated 
  USING (auth.uid() = swiper_id)
  WITH CHECK (auth.uid() = swiper_id);

-- また、万が一を考慮し Role 権限も付与しておきます
GRANT ALL ON public.swipes TO authenticated;
