-- profiles テーブルから subscription_plan カラムを削除
ALTER TABLE public.profiles DROP COLUMN IF EXISTS subscription_plan;
