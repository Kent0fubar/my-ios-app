-- ============================================================
-- BandLink データベーススキーマ
-- Supabase ダッシュボードの SQL Editor で実行してください
-- ============================================================

-- 拡張機能の有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. プロフィールテーブル
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  age INTEGER CHECK (age >= 13 AND age <= 120),
  bio TEXT DEFAULT '',
  location TEXT DEFAULT '',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  instruments TEXT[] DEFAULT '{}',
  genres TEXT[] DEFAULT '{}',
  skill_level TEXT DEFAULT 'beginner' CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'professional')),
  looking_for TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  avatar_url TEXT,
  audio_clip_url TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  push_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 新規ユーザー登録時にプロフィールを自動作成するトリガー
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. スワイプテーブル
-- ============================================================
CREATE TABLE public.swipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  swiper_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  swiped_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('like', 'nope', 'superlike')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(swiper_id, swiped_id)  -- 同じ相手に2回スワイプ不可
);

-- インデックス
CREATE INDEX idx_swipes_swiper ON public.swipes(swiper_id);
CREATE INDEX idx_swipes_swiped ON public.swipes(swiped_id);
CREATE INDEX idx_swipes_direction ON public.swipes(direction);

-- ============================================================
-- 3. マッチテーブル
-- ============================================================
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

-- インデックス
CREATE INDEX idx_matches_user1 ON public.matches(user1_id);
CREATE INDEX idx_matches_user2 ON public.matches(user2_id);

-- ============================================================
-- 4. メッセージテーブル
-- ============================================================
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 2000),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_messages_match ON public.messages(match_id);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_created ON public.messages(created_at);

-- ============================================================
-- 5. レポート（通報）テーブル
-- ============================================================
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. Row Level Security (RLS) — DoS/不正アクセス対策の要
-- ============================================================

-- すべてのテーブルでRLSを有効化
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- === プロフィール ===
-- 誰でも閲覧可能（認証ユーザーのみ）
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- 自分のプロフィールのみ更新可能
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 自分のプロフィールのみ挿入可能
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- === スワイプ ===
-- 自分のスワイプのみ閲覧
CREATE POLICY "swipes_select" ON public.swipes
  FOR SELECT USING (auth.uid() = swiper_id);

-- 自分のスワイプのみ作成
CREATE POLICY "swipes_insert" ON public.swipes
  FOR INSERT WITH CHECK (auth.uid() = swiper_id);

-- === マッチ ===
-- 自分が関与するマッチのみ閲覧
CREATE POLICY "matches_select" ON public.matches
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- マッチの作成は自分が関与する場合のみ
CREATE POLICY "matches_insert" ON public.matches
  FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- === メッセージ ===
-- マッチに関与するユーザーのみ閲覧
CREATE POLICY "messages_select" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.matches
      WHERE matches.id = messages.match_id
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );

-- マッチに関与し、自分が送信者の場合のみ作成
CREATE POLICY "messages_insert" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.matches
      WHERE matches.id = match_id
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );

-- 既読更新はマッチに関与するユーザーのみ
CREATE POLICY "messages_update" ON public.messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.matches
      WHERE matches.id = messages.match_id
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );

-- === レポート ===
-- 自分のレポートのみ閲覧
CREATE POLICY "reports_select" ON public.reports
  FOR SELECT USING (auth.uid() = reporter_id);

-- 自分がレポーターの場合のみ作成
CREATE POLICY "reports_insert" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- ============================================================
-- 7. ストレージバケット（アバター・音声クリップ）
-- ============================================================
-- Supabase ダッシュボード > Storage で以下のバケットを作成してください:
-- - avatars (Public)
-- - audio_clips (Public)

-- ストレージのRLSポリシー（ダッシュボードで設定）:
-- avatars:
--   SELECT: true (公開)
--   INSERT: auth.uid() = (ファイルパスの最初のフォルダ名)
--   UPDATE: auth.uid() = (ファイルパスの最初のフォルダ名)
--   DELETE: auth.uid() = (ファイルパスの最初のフォルダ名)

-- ============================================================
-- 8. Realtime の有効化
-- ============================================================
-- messages テーブルのリアルタイムを有効化
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
