-- ============================================================
-- スワイプテーブル（swipes）のセキュリティポリシー（RLS）拡張
-- 自分に「いいね」してくれたユーザーを確認できるようにする（Premium機能向け）
-- ============================================================

-- 既存の swipes_all ポリシーは swiper_id のみ許可しているので、
-- swiped_id（自分に向けられたスワイプ）も許可するポリシーを追加

-- swipes_all を削除して、より包括的なポリシーにするか、別途追加する
-- ここでは swipes_all を維持しつつ、SELECT 権限を swiped_id にも広げる

DROP POLICY IF EXISTS "swipes_all" ON public.swipes;

-- 自分がスワイパーであるか、自分がスワイプ対象である場合に閲覧可能
CREATE POLICY "swipes_select_involved" ON public.swipes
  FOR SELECT TO authenticated
  USING (auth.uid() = swiper_id OR auth.uid() = swiped_id);

-- 挿入・更新・削除は引き続き自分自身のスワイプのみ
CREATE POLICY "swipes_insert_own" ON public.swipes
  FOR INSERT WITH CHECK (auth.uid() = swiper_id);

CREATE POLICY "swipes_update_own" ON public.swipes
  FOR UPDATE USING (auth.uid() = swiper_id) WITH CHECK (auth.uid() = swiper_id);

CREATE POLICY "swipes_delete_own" ON public.swipes
  FOR DELETE USING (auth.uid() = swiper_id);
