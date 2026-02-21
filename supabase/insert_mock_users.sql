-- ============================================================
-- テスト用モックデータ追加スクリプト (auth.users不要版)
-- Supabase の RLS を一時的にバイパス、またはダミーのauthを回避してprofilesに直接テストデータを入れます
-- ============================================================

-- ※ auth.users との外部キー制約を一時的に無効化してモックデータを投入するアプローチ
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 古いテストデータを削除（名前で判定、または削除が不要であればコメントアウト）
DELETE FROM public.profiles WHERE name IN ('Kenji', 'Satoshi', 'Yumi', 'Taro', 'Akira');

-- テストデータの投入
INSERT INTO public.profiles (id, name, age, bio, location, latitude, longitude, instruments, genres, skill_level, looking_for, avatar_url, is_verified)
VALUES
  ('2edefb24-4195-4d06-9891-ec172150451f', 'Kenji', 28, 'ギター歴10年です。ブルースやクラシックロックが好きです。週末にセッションできる仲間を募集しています！', '東京都 渋谷区', 35.6600, 139.7020, ARRAY['Guitar', 'Acoustic Guitar'], ARRAY['Rock', 'Blues', 'Classic Rock'], 'intermediate', ARRAY['Bass', 'Drums', 'Vocal'], 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&q=80&w=400', true),
  
  ('6d5eee2d-f5ab-4cf5-98bb-230af1b33fa0', 'Yumi', 24, 'ボーカル希望。ずっと一人で歌っていましたが、やっぱりバンドで歌いたいです！アニソンやポップスが好きです。', '東京都 新宿区', 35.6900, 139.7000, ARRAY['Vocal'], ARRAY['J-Pop', 'Anime', 'Rock'], 'beginner', ARRAY['Guitar', 'Keyboard', 'Drums'], 'https://images.unsplash.com/photo-1516575334481-f85287c2c82d?auto=format&fit=crop&q=80&w=400', true),
  
  ('82dee269-7635-4454-b7e6-5cb195190850', 'Satoshi', 32, 'ベース弾き。ファンクやR&Bのグルーヴが好きです。スラップ多めです。', '神奈川県 横浜市', 35.4437, 139.6380, ARRAY['Bass'], ARRAY['Funk', 'R&B', 'Soul'], 'advanced', ARRAY['Drums', 'Guitar', 'Keyboard'], 'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?auto=format&fit=crop&q=80&w=400', false),
  
  ('2d40077a-adda-4fbc-99be-32595de218b1', 'Taro', 29, 'ドラマーです。ツーバスドコドコ踏めます。メタルバンド加入希望。', '埼玉県 大宮市', 35.9063, 139.6256, ARRAY['Drums'], ARRAY['Metal', 'Hard Rock'], 'intermediate', ARRAY['Guitar', 'Vocal', 'Bass'], 'https://images.unsplash.com/photo-1519892300165-cb5542fac475?auto=format&fit=crop&q=80&w=400', true),
  
  ('6bf8d4b7-d909-48e2-9dff-35a81e9930df', 'Akira', 26, 'キーボード/シンセサイザー。ジャズやフュージョンが好きですがポップスも弾けます。', '千葉県 千葉市', 35.6074, 140.1060, ARRAY['Keyboard', 'Synthesizer'], ARRAY['Jazz', 'Fusion', 'Pop'], 'intermediate', ARRAY['Bass', 'Drums', 'Guitar'], 'https://images.unsplash.com/photo-1520627581788-29cb6400acbe?auto=format&fit=crop&q=80&w=400', false);

-- FK制約を元に戻す場合は以下のコメントアウトを外しますが、Supabase Auth側に実態がないとエラーになるため外したままにしておきます。
-- ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
