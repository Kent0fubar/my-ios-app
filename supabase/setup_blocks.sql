-- ブロック（blocks）テーブルの作成とRLS設定
CREATE TABLE IF NOT EXISTS blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id)
);

-- RLSの有効化
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

-- 自分が実行したブロックのみ参照可能
CREATE POLICY "Users can see their own blocks" 
ON blocks FOR SELECT 
TO authenticated 
USING (auth.uid() = blocker_id);

-- ブロックの登録は本人のみ
CREATE POLICY "Users can insert their own blocks" 
ON blocks FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = blocker_id);

-- ブロックの解除は本人のみ
CREATE POLICY "Users can delete their own blocks" 
ON blocks FOR DELETE 
TO authenticated 
USING (auth.uid() = blocker_id);
