-- ============================================================
-- テスト用モックデータ追加スクリプト 第3弾 (auth.users不要版)
-- Supabase の RLS を一時的にバイパス、またはダミーのauthを回避してprofilesに直接テストデータを入れます
-- ============================================================

-- ※ auth.users との外部キー制約を一時的に無効化してモックデータを投入するアプローチ
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- すでに投入済みのユーザーを削除したい場合は適宜コメントアウトを外して実行してください
-- DELETE FROM public.profiles WHERE name IN ('Yuki', 'Kenta', 'Mio', 'Daiki', 'Haruka', 'Takumi', 'Rina', 'Yosuke', 'Aya', 'Ken');

-- テストデータの投入 (10名分)
INSERT INTO public.profiles (id, name, age, bio, location, latitude, longitude, instruments, genres, skill_level, looking_for, avatar_url, is_verified)
VALUES
  ('4bab4cf4-2c8e-4bd9-af77-f80fb2fcb710', 'Yuki', 26, 'シンガーソングライターを目指して日々弾き語りをしています。アコースティックな編成でオリジナル曲をやってみたいです。', '東京都 杉並区', 35.6995, 139.6355, ARRAY['Vocal', 'Acoustic Guitar'], ARRAY['Acoustic', 'Pop', 'Folk'], 'intermediate', ARRAY['Keyboard', 'Percussion'], 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400', true),
  
  ('a6e3a1c8-b99e-43df-a3e0-51ae12b56591', 'Kenta', 31, 'メタルコア、Djent系のギタリストです。7弦ギター弾きます。テクニカルなドラマーを探しています！', '神奈川県 相模原市', 35.5714, 139.3732, ARRAY['Guitar'], ARRAY['Metal', 'Djent', 'Hardcore'], 'advanced', ARRAY['Drums', 'Bass', 'Vocal'], 'https://images.unsplash.com/photo-1598387993441-a364f854c3e1?auto=format&fit=crop&q=80&w=400', true),
  
  ('6a28a1d7-2bb7-403a-9c91-f0bfd79e43ac', 'Mio', 23, 'ピアノ幼少期からやってますが、最近シンセサイザーも買いました！ポップスやR&Bのバンドに入りたいです。', '東京都 目黒区', 35.6415, 139.6983, ARRAY['Keyboard', 'Synthesizer'], ARRAY['Pop', 'R&B', 'Soul'], 'advanced', ARRAY['Vocal', 'Bass', 'Guitar', 'Drums'], 'https://images.unsplash.com/photo-1485875437342-9b39470b3d95?auto=format&fit=crop&q=80&w=400', false),
  
  ('e0debe58-21ec-45cc-89c8-8ccef2aa5dec', 'Daiki', 28, 'パンクロック一筋でベース弾いてます。ピック弾きメイン。とにかくライブをたくさんやりたい！', '埼玉県 さいたま市', 35.8617, 139.6455, ARRAY['Bass', 'Chorus'], ARRAY['Punk', 'Rock', 'Melodic Punk'], 'intermediate', ARRAY['Guitar', 'Drums', 'Vocal'], 'https://images.unsplash.com/photo-1549834125-8f64522f2cb8?auto=format&fit=crop&q=80&w=400', true),
  
  ('9611109d-4ffc-4553-b73c-ce0f328d07c6', 'Haruka', 25, 'ドラム女子です。スタジオでジャズやファンクのセッションをするのが休日の楽しみです。', '東京都 世田谷区', 35.6465, 139.6533, ARRAY['Drums'], ARRAY['Jazz', 'Funk', 'R&B'], 'intermediate', ARRAY['Bass', 'Guitar', 'Keyboard'], 'https://images.unsplash.com/photo-1516280440502-863a1fa0fd19?auto=format&fit=crop&q=80&w=400', true),
  
  ('fc3c6991-d401-4e1a-8049-482b6f6e1b7f', 'Takumi', 34, '趣味でサックス吹いてます。ブラスバンド経験あり。スカやスカパンクのバンドがあれば加入したいです。', '千葉県 柏市', 35.8624, 139.9723, ARRAY['Saxophone'], ARRAY['Ska', 'Jazz', 'Funk'], 'intermediate', ARRAY['Guitar', 'Bass', 'Drums', 'Trumpet'], 'https://images.unsplash.com/photo-1525926477800-7a32bd04359a?auto=format&fit=crop&q=80&w=400', false),
  
  ('80026285-0cf8-4a18-8c89-aa825977c3f9', 'Rina', 21, 'アイドルコピーバンドを立ち上げたいです！私はボーカルと少しだけギターができます。', '東京都 豊島区', 35.7304, 139.7118, ARRAY['Vocal', 'Guitar'], ARRAY['J-Pop', 'Idol'], 'beginner', ARRAY['Guitar', 'Bass', 'Drums', 'Keyboard'], 'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?auto=format&fit=crop&q=80&w=400', true),
  
  ('9c7e789c-3dc2-4200-94ee-6c9d259d04c1', 'Yosuke', 29, 'ブルースギター弾き。エリック・クラプトンやSRVが好きです。ジャムセッションできる仲間を募集中。', '神奈川県 藤沢市', 35.3385, 139.4886, ARRAY['Guitar', 'Acoustic Guitar'], ARRAY['Blues', 'Classic Rock'], 'professional', ARRAY['Bass', 'Drums', 'Keyboard'], 'https://images.unsplash.com/photo-1575284852084-3c6f376cf744?auto=format&fit=crop&q=80&w=400', true),
  
  ('330a244c-20ef-4b10-bfc1-4dc3dad7b641', 'Aya', 27, 'クラブミュージックが好きで、DJとトラックメイクをしています。生楽器との融合プロジェクトをやりたいです。', '東京都 渋谷区', 35.6600, 139.7020, ARRAY['DJ', 'Synthesizer', 'Programming'], ARRAY['Electronic', 'House', 'Hip Hop'], 'advanced', ARRAY['Vocal', 'Guitar', 'Bass'], 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=400', false),
  
  ('e86ff23b-ab20-4c77-8cc9-8bfbae8f9fbb', 'Ken', 38, '週末おやじバンドで活動中。現在リードギターが抜けてしまったため探しています。80年代ハードロック中心です', '東京都 練馬区', 35.7356, 139.6517, ARRAY['Bass', 'Chorus'], ARRAY['Hard Rock', 'Classic Rock'], 'intermediate', ARRAY['Guitar'], 'https://images.unsplash.com/photo-1493225457124-a1a2a5fbbc66?auto=format&fit=crop&q=80&w=400', true);
