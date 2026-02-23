-- ============================================================
-- 都内の活動拠点を分散させたミュージシャン・モックデータ作成（50名分）
-- ============================================================

DO $$
DECLARE
    i INTEGER;
    new_id UUID;
    names TEXT[] := ARRAY['Ken', 'Mika', 'Satoshi', 'Yuki', 'Taka', 'Haruka', 'Daisuke', 'Emi', 'Kenta', 'Aoi', 'Hiro', 'Nana', 'Syoji', 'Mai', 'Ryo', 'Kana', 'Tsubasa', 'Misaki', 'Ren', 'Saki', 'Kaito', 'Rina', 'Yuto', 'Miu', 'Hayato', 'Sora', 'Taichi', 'Hinata', 'Kazu', 'Rio', 'Nao', 'Maki', 'Kei', 'Jun', 'Aki', 'Tomoo', 'Satoru', 'Yasu', 'Mari', 'Erika', 'Kota', 'Yuna', 'Takumi', 'Mizuki', 'Shin', 'Rei', 'Kou', 'An', 'Sho', 'Yue'];
    
    -- 活動拠点のプール（渋谷・新宿・下北沢などを中心に）
    locations TEXT[] := ARRAY[
        '渋谷区', '新宿区', '世田谷区', '杉並区', '中野区', 
        '豊島区', '目黒区', '港区', '品川区', '千代田区',
        '武蔵野市', '調布市', '下北沢', '高円寺', '吉祥寺'
    ];
    
    -- 各拠点に対応するおおよその座標（35.6帯、139.7帯）
    lats DOUBLE PRECISION[] := ARRAY[35.658, 35.693, 35.646, 35.704, 35.707, 35.731, 35.633, 35.658, 35.609, 35.694, 35.705, 35.650, 35.661, 35.705, 35.702];
    lngs DOUBLE PRECISION[] := ARRAY[139.701, 139.703, 139.653, 139.615, 139.663, 139.711, 139.715, 139.751, 139.730, 139.753, 139.566, 139.544, 139.667, 139.649, 139.580];

    bios TEXT[] := ARRAY[
        'ベースやってます！ファンクやジャズが好きです。都内でセッション仲間募集中。',
        'DTMで作曲中。ボーカルの方とコラボしたいです。',
        'ギター歴10年、ハードロック命。週末の練習相手探してます。',
        'ドラム担当。ジャズ研出身です。ゆるく叩ける場所を探しています。',
        'シンガーソングライター。作詞作曲の相談もOK。',
        'キーボード弾けます。クラシックからポップスまで対応します。',
        'バイオリン奏者。オーケストラ以外にバンドにも興味あります！',
        'サックスやってます。J-Popをメインに吹いています。',
        'DJやってます。ミキシングやマスタリングの相談もどうぞ。',
        '初心者ですがギター始めました！一緒に練習できる方。',
        'プロ志向です。本気でバンド組めるメンバー募集中。',
        'アニソンカバーバンドのボーカルやりたいです。',
        'ブルースハープ吹けます。渋い音楽を一緒にやりましょう。',
        '三味線やってます。和楽器×洋楽器のコラボに興味あり。',
        'コーラス募集！ゴスペルとかやりたいです。',
        'チェロ弾きです。ストリングスユニット組みませんか？',
        'ウクレレでまったり演奏中。ハワイアンも好きです。',
        'メタル専門のドラマー探してます。',
        'パンクロックが原点。熱いライブがしたい。',
        'ボカロPやってます。イラストレーターさんも募集. ',
        '宅録メイン。遠隔でのコラボ希望。',
        'フルート奏者。癒やし系の音楽が得意です。',
        'パーカッション全般。カホンでもなんでも叩きます。',
        'エレクトロニカ作ってます。アンビエントな雰囲気。',
        'カントリーミュージック好き。バンジョー探してます。',
        'R&B、ソウル系のボーカリストです。',
        'ビブラフォン奏者。珍しい楽器ですが誘ってください！',
        'トランペットでスカパラみたいなことしたい。',
        'トロンボーン担当。ブラスバンドの経験あります。',
        'コントラバス奏者。クラシックからジャズまで。',
        'アコギ一本で活動中。ストリートライブ仲間。',
        'DTM初心者です。機材の話をしたい。',
        'レゲエのリズムが心地いい。ベース弾けます。',
        'スラッシュメタル。速いドラムを叩きたい。',
        'グランジ。90年代の空気感が好き。',
        'シューゲイザー。フィードバックノイズに埋もれたい。',
        'シティポップ。都会的なサウンドを追求中。',
        'フュージョン。テクニカルなプレイを目指してます。',
        '童謡のリアレンジとか面白いことしたい。',
        '映画音楽のような壮大なスケール。キーボード。',
        'ラップやってます。トラックメイクできる方。',
        'テクノ。ミニマルなループ。',
        'ヒップホップ。サンプリングネタを探してます。',
        'フラメンコギター。情熱的な演奏。',
        'ケルト音楽。バイオリンや笛が得意な方。',
        'ハードコア。激しいノリ。',
        'スカ。裏打ちが命。',
        'サイケデリック。音の旅路。',
        'プログレ。変拍子がたまらない。',
        'インディーポップ。自由な感性。'
    ];
    
    -- 小文字のIDに変更 (FrontendのmockData.tsと一致させる)
    instr_pool TEXT[] := ARRAY['guitar', 'bass', 'drums', 'vocal', 'keyboard', 'piano', 'saxophone', 'trumpet', 'violin', 'dj', 'producer', 'songwriter'];
    genre_pool TEXT[] := ARRAY['rock', 'jazz', 'funk', 'pop', 'blues', 'metal', 'electronic', 'hiphop', 'classical', 'reggae', 'punk', 'country', 'rnb', 'soul', 'indie'];
    looking_for_pool TEXT[] := ARRAY['band', 'session', 'collaboration', 'songwriter'];
    
    avatars TEXT[] := ARRAY[
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1554151228-14d9def656e4?w=400&h=400&fit=crop'
    ];
    loc_idx INTEGER;
BEGIN
    FOR i IN 1..50 LOOP
        new_id := gen_random_uuid();
        loc_idx := (i - 1) % 15 + 1;
        
        -- 1. auth.usersへの挿入
        BEGIN
            INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, aud, role)
            VALUES (
                new_id, 
                'user_' || i || '_' || substr(new_id::text, 1, 5) || '@example.com', 
                'mock_password', 
                NOW(), 
                '{"provider":"email","providers":["email"]}', 
                jsonb_build_object('name', names[(i - 1) % 50 + 1]), 
                NOW(), 
                NOW(), 
                'authenticated', 
                'authenticated'
            );
        EXCEPTION WHEN OTHERS THEN
        END;

        -- 2. profilesテーブルへの更新/挿入
        INSERT INTO public.profiles (
            id,
            name,
            age,
            bio,
            latitude,
            longitude,
            location,
            instruments,
            genres,
            looking_for,
            skill_level,
            avatar_url,
            is_premium,
            created_at,
            updated_at
        ) VALUES (
            new_id,
            names[(i - 1) % 50 + 1],
            20 + (i % 25),
            bios[(i - 1) % 50 + 1],
            lats[loc_idx] + (random() * 0.01 - 0.005),
            lngs[loc_idx] + (random() * 0.01 - 0.005),
            locations[loc_idx],
            ARRAY[instr_pool[(i - 1) % 12 + 1]],
            ARRAY[genre_pool[(i - 1) % 15 + 1]],
            ARRAY[looking_for_pool[(i - 1) % 4 + 1]],
            CASE (i % 4) 
                WHEN 0 THEN 'beginner' 
                WHEN 1 THEN 'intermediate' 
                WHEN 2 THEN 'advanced' 
                ELSE 'professional' 
            END,
            avatars[(i - 1) % 8 + 1],
            false,
            NOW() - (i || ' hours')::interval,
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            latitude = EXCLUDED.latitude,
            longitude = EXCLUDED.longitude,
            location = EXCLUDED.location,
            instruments = EXCLUDED.instruments,
            genres = EXCLUDED.genres,
            looking_for = EXCLUDED.looking_for,
            skill_level = EXCLUDED.skill_level,
            updated_at = NOW();
    END LOOP;
    
    RAISE NOTICE '都内各拠点のモックプロフィール作成が完了しました。';
END $$;
