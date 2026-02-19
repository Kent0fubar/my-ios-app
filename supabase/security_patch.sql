-- ============================================================
-- セキュリティ強化パッチ
-- ユーザーが自身の is_premium, is_verified を変更できないようにする
-- 
-- 実行方法: Supabase Dashboard > SQL Editor でこのファイルの内容を実行
-- ============================================================

-- 1. 既存の profiles_update ポリシーを削除
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

-- 2. 新しいポリシーを作成: 自分のプロフィールのみ更新可能
--    ただし更新できるカラムを制限するため、トリガーで保護する
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3. is_premium, is_verified の不正変更を防止するトリガー
--    ユーザーがこれらのフィールドを変更しようとした場合、元の値に戻す
CREATE OR REPLACE FUNCTION public.protect_premium_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- is_premium は管理者/Webhook経由でのみ変更可能
  -- 通常のユーザーリクエストでは変更を無視する
  IF OLD.is_premium IS DISTINCT FROM NEW.is_premium THEN
    NEW.is_premium := OLD.is_premium;
  END IF;

  -- is_verified は管理者のみ変更可能
  IF OLD.is_verified IS DISTINCT FROM NEW.is_verified THEN
    NEW.is_verified := OLD.is_verified;
  END IF;

  -- push_token 以外のフィールドは変更時に updated_at を更新
  NEW.updated_at := NOW();
  
  -- id と created_at は絶対に変更不可
  NEW.id := OLD.id;
  NEW.created_at := OLD.created_at;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 既存のトリガーがあれば削除してから作成
DROP TRIGGER IF EXISTS protect_premium_on_update ON public.profiles;

CREATE TRIGGER protect_premium_on_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_premium_fields();

-- ============================================================
-- 4. ストレージのRLSポリシー（SQLで設定）
-- ============================================================

-- avatars バケットのポリシー
-- 公開読み取り（すでに Public バケット）
-- アップロードは自分のフォルダのみ
CREATE POLICY "avatars_upload" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 更新は自分のファイルのみ
CREATE POLICY "avatars_update" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 削除は自分のファイルのみ
CREATE POLICY "avatars_delete" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- audio_clips バケットのポリシー
CREATE POLICY "audio_clips_upload" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'audio_clips'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "audio_clips_update" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'audio_clips'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "audio_clips_delete" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'audio_clips'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
