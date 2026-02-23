-- ============================================================
-- BandLink スキーマ更新 (課金プラン管理用カラム追加)
-- Supabase ダッシュボードの SQL Editor で実行してください
-- ============================================================

-- profiles テーブルに課金管理用カラムを追加
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_plan TEXT CHECK (subscription_plan IN ('free', 'premium', 'pro'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- 既存の is_premium = true なユーザーを premium に移行する場合の例
-- UPDATE public.profiles SET subscription_plan = 'premium', subscription_started_at = NOW(), subscription_expires_at = NOW() + INTERVAL '1 month' WHERE is_premium = true AND subscription_plan IS NULL;
