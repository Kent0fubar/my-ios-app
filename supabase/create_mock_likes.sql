-- ============================================================
-- 「あなたへのいいね」セクションのテスト用モックデータ作成クエリ
-- ============================================================

-- 1. まず、自分のユーザーIDを確認してください。
--    アプリのプロフィール画面、または Supabase Dashboard > Authentication で確認可能。
--    以下の 'YOUR_USER_ID' を自分の実際のIDに書き換えて実行してください。

DO $$
DECLARE
    target_user_id UUID := 'YOUR_USER_ID'; -- ここを自分のIDに書き換えてください
    liker_ids UUID[];
    liker_id UUID;
    i INTEGER := 1;
BEGIN
    -- 自分以外のプロフィールから、いいねをくれる「練習用ユーザー」を5人ピックアップ
    SELECT ARRAY(
        SELECT id FROM profiles 
        WHERE id != target_user_id 
        LIMIT 5
    ) INTO liker_ids;

    -- ピックアップしたユーザーから自分への「いいね」を挿入
    FOREACH liker_id IN ARRAY liker_ids
    LOOP
        -- 既存のスワイプがあれば削除（テストを何度でも実行できるようにするため）
        DELETE FROM swipes WHERE swiper_id = liker_id AND swiped_id = target_user_id;
        
        -- いいねを挿入 (3人は 'like'、2人は 'superlike' に設定)
        INSERT INTO swipes (swiper_id, swiped_id, direction, created_at)
        VALUES (
            liker_id, 
            target_user_id, 
            CASE WHEN i % 2 = 0 THEN 'superlike' ELSE 'like' END,
            NOW() - (i || ' hours')::interval -- 時間をずらしてリアルにする
        );
        i := i + 1;
    END LOOP;

    RAISE NOTICE '% 人のユーザーからあなたへの「いいね」を作成しました。', i - 1;
END $$;
