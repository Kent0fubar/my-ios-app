-- ============================================================
-- 「あなたへのいいね」セクションを華やかにするための10件のモックデータ作成クエリ
-- ============================================================

-- 使いかた:
-- 1. 下の 'YOUR_USER_ID' を自分のユーザーID（プロフィール画面やAuthタブで確認可能）に書き換える。
-- 2. このクエリを Supabase の SQL Editor で実行。

DO $$
DECLARE
    target_id UUID := 'YOUR_USER_ID'; -- ★ここに自分のIDを入れてください
    new_user_id UUID;
    i INTEGER;
    -- プロフィールデータの配列
    names TEXT[] := ARRAY['Erika', 'Kent', 'Julia', 'Marcus', 'Hana', 'Leon', 'Sarah', 'Tom', 'Noah', 'Mia'];
    bios TEXT[] := ARRAY[
        '都内で活動中のボーカリストです！エモ・ガレージロックが大好き🎸 一緒に熱いステージを作れるメンバーを探しています。',
        'ジャズ・フュージョンを得意とするドラマーです。テクニカルなセッションから歌伴まで幅広く対応します🥁',
        'バイオリンでポップスやアニソンのカバーをしています🎻 バンドにストリングスの彩りを加えませんか？',
        'ファンキーなベースラインなら任せてください！スラップ大好き。グルーヴを極めたいベーシストです🔥',
        '宅録中心に活動しているシンガーソングライターです。私の曲にアレンジを加えてくれるパートナーを募集中♪',
        'テックハウスやメロディックテクノを作っているDJ/Producerです🎧 ボーカル素材を探しています！',
        'ソウルフルなサックスを奏でます🎷 渋いブルースセッションができる仲間と出会いたいです。',
        '速弾きから泣きのソロまで、メタル愛に溢れるギタリストです。ツインギターの相方募集中！⚡',
        'R&B/Neo-Soulな鍵盤弾きです🎹 オシャレでスムースな音作りが得意です。',
        'パンクロック命のドラマーです！シンプルかつパワフルなビートでフロアを揺らしましょう🤘'
    ];
    avatars TEXT[] := ARRAY[
        'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=600&fit=crop'
    ];
    -- text[] 型の二次元配列は使えないので、個別に設定する
    v_instruments TEXT[];
    v_genres TEXT[];
BEGIN
    FOR i IN 1..10 LOOP
        new_user_id := gen_random_uuid();

        -- 楽器を個別に設定
        CASE i
            WHEN 1 THEN v_instruments := ARRAY['vocal'];
            WHEN 2 THEN v_instruments := ARRAY['drums'];
            WHEN 3 THEN v_instruments := ARRAY['violin'];
            WHEN 4 THEN v_instruments := ARRAY['bass'];
            WHEN 5 THEN v_instruments := ARRAY['songwriter', 'vocal'];
            WHEN 6 THEN v_instruments := ARRAY['dj', 'producer'];
            WHEN 7 THEN v_instruments := ARRAY['saxophone'];
            WHEN 8 THEN v_instruments := ARRAY['guitar'];
            WHEN 9 THEN v_instruments := ARRAY['piano', 'keyboard'];
            WHEN 10 THEN v_instruments := ARRAY['drums'];
        END CASE;

        -- ジャンルを個別に設定
        CASE i
            WHEN 1 THEN v_genres := ARRAY['rock', 'punk'];
            WHEN 2 THEN v_genres := ARRAY['jazz', 'funk'];
            WHEN 3 THEN v_genres := ARRAY['pop', 'classical'];
            WHEN 4 THEN v_genres := ARRAY['funk', 'rnb'];
            WHEN 5 THEN v_genres := ARRAY['indie', 'pop'];
            WHEN 6 THEN v_genres := ARRAY['electronic'];
            WHEN 7 THEN v_genres := ARRAY['blues', 'jazz'];
            WHEN 8 THEN v_genres := ARRAY['metal', 'rock'];
            WHEN 9 THEN v_genres := ARRAY['rnb', 'pop'];
            WHEN 10 THEN v_genres := ARRAY['punk', 'rock'];
        END CASE;

        -- 1. プロフィールの作成
        INSERT INTO profiles (
            id,
            name,
            bio,
            avatar_url,
            instruments,
            genres,
            skill_level,
            location,
            age,
            is_pro,
            is_premium,
            latitude,
            longitude,
            created_at
        ) VALUES (
            new_user_id,
            names[i],
            bios[i],
            avatars[i],
            v_instruments,
            v_genres,
            CASE WHEN i % 3 = 0 THEN 'professional' WHEN i % 2 = 0 THEN 'advanced' ELSE 'intermediate' END,
            '東京都',
            20 + (i % 15),
            (i % 4 = 0),
            (i % 4 = 0),
            35.6895 + (random() * 0.1),
            139.6917 + (random() * 0.1),
            NOW() - (i || ' days')::interval
        );

        -- 2. いいねを自分に飛ばす
        INSERT INTO swipes (
            swiper_id,
            swiped_id,
            direction,
            created_at
        ) VALUES (
            new_user_id,
            target_id,
            CASE WHEN i % 3 = 0 THEN 'superlike' ELSE 'like' END,
            NOW() - (i || ' hours')::interval
        );
    END LOOP;

    RAISE NOTICE '10人の魅力的なミュージシャンからあなたへの「いいね」を作成しました。';
END $$;
