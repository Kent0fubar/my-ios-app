-- profilesテーブルにアカウント凍結用のカラムを追加
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE;

-- 凍結されたユーザーを検索しやすくするためのインデックス
CREATE INDEX IF NOT EXISTS idx_profiles_is_suspended ON profiles(is_suspended);
