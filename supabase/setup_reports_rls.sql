    -- 通報（reports）テーブルの作成とRLS設定
    CREATE TABLE IF NOT EXISTS reports (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        reported_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        reason TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- RLSの有効化
    ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

    -- 挿入ポリシー: 認証済みユーザーは誰でも通報を送れる
    CREATE POLICY "Anyone can insert reports" 
    ON reports FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = reporter_id);

    -- 参照ポリシー: 自分の送った通報、または管理者の参照用（ここでは一旦自分のみ）
    CREATE POLICY "Users can see their own reports" 
    ON reports FOR SELECT 
    TO authenticated 
    USING (auth.uid() = reporter_id);

    -- (削除済み) 匿名での集計が必要な場合は、セキュリティを考慮した別の方法（Edge Function等）を検討してください

