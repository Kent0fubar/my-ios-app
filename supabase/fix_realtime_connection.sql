-- ============================================================
-- リアルタイム機能の完全復旧用スクリプト
-- ============================================================

-- 1. messages テーブルのレプリカ設定を FULL に（確実な変更通知のため）
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- 2. リアルタイムパブリケーションの再設定
-- 一旦削除（存在しない場合はエラーになる可能性があるので DO ブロックで実行）
DO $$
BEGIN
    -- messages テーブルがパブリケーションに含まれているか確認
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;

    -- matches テーブルも一応確認
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'matches'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
    END IF;
END $$;

-- 3. RLS ポリシーの再確認（SELECT 権限が正しく設定されていないと Realtime も届きません）
-- すでに fix_messages_rls_v2.sql などで設定済みのはずですが、基本に立ち返ります。
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 全メッセージを対象とした SELECT ポリシー（自分が関与するマッチのみ）
DROP POLICY IF EXISTS "messages_select" ON public.messages;
CREATE POLICY "messages_select" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.matches
      WHERE matches.id = messages.match_id
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );

-- 4. テスト用：全てのメッセージを INSERT した際に Realtime が飛ぶように、
-- 本来 RLS で保護されているが、Realtime 配信サーバーが正しく認識できるように
-- テーブル全体の Realtime チャンネルを再起動する効果を狙います。
NOTIFY pgrst, 'reload schema';
