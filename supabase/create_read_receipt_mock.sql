-- 既読機能テスト用のモックデータ作成スクリプト

-- 1. 現在のユーザー（または最新のユーザー）をプレミアム会員に設定
UPDATE profiles 
SET is_premium = true, 
    subscription_plan = 'premium',
    subscription_started_at = NOW(),
    subscription_expires_at = NOW() + INTERVAL '1 month'
WHERE id = (SELECT id FROM profiles ORDER BY created_at DESC LIMIT 1);

-- 2. テスト用の相手役ユーザーを特定（2番目に新しいユーザー）
DO $$
DECLARE
    my_id UUID;
    other_id UUID;
    target_match_id UUID;
BEGIN
    SELECT id INTO my_id FROM profiles ORDER BY created_at DESC LIMIT 1;
    SELECT id INTO other_id FROM profiles ORDER BY created_at DESC LIMIT 1 OFFSET 1;

    IF my_id IS NULL OR other_id IS NULL THEN
        RAISE NOTICE 'ユーザーが足りません。少なくとも2名のプロフィールが必要です。';
        RETURN;
    END IF;

    -- 3. マッチの作成（存在しない場合）
    INSERT INTO matches (user1_id, user2_id, created_at)
    VALUES (my_id, other_id, NOW())
    ON CONFLICT DO NOTHING;

    SELECT id INTO target_match_id FROM matches 
    WHERE (user1_id = my_id AND user2_id = other_id) 
       OR (user1_id = other_id AND user2_id = my_id)
    LIMIT 1;

    -- 4. 既読済みのメッセージ（送信者: 自分）
    INSERT INTO messages (match_id, sender_id, content, created_at, read_at)
    VALUES (target_match_id, my_id, 'こんにちは！このメッセージは既読テスト用です。', NOW() - INTERVAL '10 minutes', NOW() - INTERVAL '5 minutes');

    -- 5. 未読のメッセージ（送信者: 自分）
    INSERT INTO messages (match_id, sender_id, content, created_at, read_at)
    VALUES (target_match_id, my_id, 'まだ読んでいないメッセージのテストです。', NOW() - INTERVAL '2 minutes', NULL);

    -- 6. 相手からのメッセージ
    INSERT INTO messages (match_id, sender_id, content, created_at, read_at)
    VALUES (target_match_id, other_id, '了解です！既読が表示されるか確認してください。', NOW() - INTERVAL '1 minute', NULL);

    RAISE NOTICE 'モックデータの作成が完了しました。Match ID: %', target_match_id;
END $$;
