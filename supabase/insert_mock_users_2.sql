-- ============================================================
-- テスト用モックデータ追加スクリプト 第2弾 (auth.users不要版)
-- Supabase の RLS を一時的にバイパス、またはダミーのauthを回避してprofilesに直接テストデータを入れます
-- ============================================================

-- ※ auth.users との外部キー制約を一時的に無効化してモックデータを投入するアプローチ
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- すでに投入済みのユーザーを削除したい場合はコメントアウトを外して実行してください
-- DELETE FROM public.profiles WHERE name IN ('Nanami', 'Keisuke', 'Mari', 'Sho', 'Ryota');

-- テストデータの投入
INSERT INTO public.profiles (id, name, age, bio, location, latitude, longitude, instruments, genres, skill_level, looking_for, avatar_url, is_verified)
VALUES
  ('a68fc490-81f2-4be1-bb57-ec00d04e24ca', 'Nanami', 22, 'DTMで曲作りをしています。ボーカリストさんを探しています！', '東京都 品川区', 35.6092, 139.7302, ARRAY['Synthesizer', 'Keyboard'], ARRAY['Pop', 'Electronic', 'Lo-Fi'], 'intermediate', ARRAY['Vocal', 'Guitar'], 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400', true),
  
  ('107eb317-0055-4f15-8a79-a16391b733af', 'Keisuke', 35, '長年ジャズギターを弾いています。休日にセッションできるホーンセクションやピアノの方、よろしくお願いします。', '神奈川県 川崎市', 35.5308, 139.7029, ARRAY['Acoustic Guitar', 'Guitar'], ARRAY['Jazz', 'Bossa Nova'], 'professional', ARRAY['Keyboard', 'Saxophone', 'Trumpet'], 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400', true),
  
  ('7237f6c5-a3dc-4099-b55a-d7ca8c461a84', 'Mari', 27, 'ガールズロックバンド結成希望！今はベースを練習中です。', '埼玉県 川口市', 35.8021, 139.7121, ARRAY['Bass'], ARRAY['Rock', 'Pop Punk'], 'beginner', ARRAY['Guitar', 'Drums', 'Vocal'], 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=400', false),
  
  ('b8f608f9-48f2-44dc-ab57-18b099106d03', 'Sho', 20, 'ドラム歴3年くらいです。ミクスチャーやラウドロックが好き。', '東京都 世田谷区', 35.6465, 139.6533, ARRAY['Drums'], ARRAY['Loud Rock', 'Mixture'], 'intermediate', ARRAY['Vocal', 'Guitar', 'Bass'], 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&q=80&w=400', true),
  
  ('1388455d-65c9-4736-9b38-88f0d4b79a3b', 'Ryota', 30, 'ソロ活動中ですが、サポートメンバーを探しています。キーボード弾ける方歓迎です。', '千葉県 船橋市', 35.6946, 139.9827, ARRAY['Vocal', 'Acoustic Guitar'], ARRAY['Folk', 'Indie', 'Acoustic'], 'advanced', ARRAY['Keyboard', 'Percussion', 'Bass'], 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400', false);
