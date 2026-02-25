-- ============================================================
-- セキュリティ強化パッチ v2
-- ハッカー視点での脆弱性修正
-- ============================================================

-- 1. プロフィール保護の強化 (特権フィールドの固定)
CREATE OR REPLACE FUNCTION public.protect_profile_restricted_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- 以下のフィールドはユーザー自身がクライアントから直接変更することは禁止
  -- 管理者、Webhook、またはサーバーサイドの処理のみが変更を許可すべき
  
  -- 課金・プラン関連
  IF OLD.is_premium IS DISTINCT FROM NEW.is_premium THEN
    NEW.is_premium := OLD.is_premium;
  END IF;
  
  IF OLD.is_pro IS DISTINCT FROM NEW.is_pro THEN
    NEW.is_pro := OLD.is_pro;
  END IF;
  
  IF OLD.subscription_plan IS DISTINCT FROM NEW.subscription_plan THEN
    NEW.subscription_plan := OLD.subscription_plan;
  END IF;
  
  IF OLD.subscription_expires_at IS DISTINCT FROM NEW.subscription_expires_at THEN
    NEW.subscription_expires_at := OLD.subscription_expires_at;
  END IF;

  -- 認証・凍結関連
  IF OLD.is_verified IS DISTINCT FROM NEW.is_verified THEN
    NEW.is_verified := OLD.is_verified;
  END IF;

  IF OLD.is_suspended IS DISTINCT FROM NEW.is_suspended THEN
    NEW.is_suspended := OLD.is_suspended;
  END IF;

  IF OLD.suspended_at IS DISTINCT FROM NEW.suspended_at THEN
    NEW.suspended_at := OLD.suspended_at;
  END IF;

  -- 定数フィールド
  NEW.id := OLD.id;
  NEW.created_at := OLD.created_at;
  NEW.updated_at := NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガーの再設定
DROP TRIGGER IF EXISTS protect_premium_on_update ON public.profiles;
DROP TRIGGER IF EXISTS protect_profile_restricted_fields_trigger ON public.profiles;

CREATE TRIGGER protect_profile_restricted_fields_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_restricted_fields();

-- ============================================================
-- 2. マッチング・セキュリティ (強制マッチ防止)
-- ============================================================

-- クライアントからの matches への直接挿入を禁止
DROP POLICY IF EXISTS "matches_insert" ON public.matches;

CREATE POLICY "matches_insert_denied" ON public.matches
  FOR INSERT WITH CHECK (false); -- 誰も直接挿入できない

-- スワイプ時に相互いいねを確認して自動でマッチを作成するロジック
CREATE OR REPLACE FUNCTION public.check_for_mutual_match()
RETURNS TRIGGER AS $$
BEGIN
  -- 'like' または 'superlike' の場合のみチェック
  IF NEW.direction IN ('like', 'superlike') THEN
    -- 相手も自分を 'like' しているか確認
    IF EXISTS (
      SELECT 1 FROM public.swipes
      WHERE swiper_id = NEW.swiped_id
      AND swiped_id = NEW.swiper_id
      AND direction IN ('like', 'superlike')
    ) THEN
      -- 相互いいねがあればマッチを作成
      -- すでに存在しないか確認 (重複防止)
      INSERT INTO public.matches (user1_id, user2_id)
      VALUES (
        LEAST(NEW.swiper_id, NEW.swiped_id),
        GREATER(NEW.swiper_id, NEW.swiped_id)
      )
      ON CONFLICT (user1_id, user2_id) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- スワイプ後の自動マッチ作成トリガー
DROP TRIGGER IF EXISTS on_swipe_mutual_match ON public.swipes;
CREATE TRIGGER on_swipe_mutual_match
  AFTER INSERT ON public.swipes
  FOR EACH ROW
  EXECUTE FUNCTION public.check_for_mutual_match();

-- 補助関数の作成 (LEAST/GREATER の UUID 版がない場合用)
CREATE OR REPLACE FUNCTION LEAST(a UUID, b UUID) RETURNS UUID AS $$
BEGIN
  RETURN CASE WHEN a < b THEN a ELSE b END;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION GREATER(a UUID, b UUID) RETURNS UUID AS $$
BEGIN
  RETURN CASE WHEN a > b THEN a ELSE b END;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 3. メッセージ改ざん防止
-- ============================================================

-- 既存のメッセージ更新ポリシーを削除
DROP POLICY IF EXISTS "messages_update" ON public.messages;

-- 既読状態 (read_at) の更新のみを許可するポリシー
-- 注意: INSERT と SELECT は既存のもので OK
CREATE POLICY "messages_update_read_only" ON public.messages
  FOR UPDATE USING (
    -- 自分が受信者の場合のみ更新可能（read_at をセットするため）
    EXISTS (
      SELECT 1 FROM public.matches
      WHERE matches.id = messages.match_id
      AND (
        (matches.user1_id = auth.uid() AND messages.sender_id != auth.uid()) OR
        (matches.user2_id = auth.uid() AND messages.sender_id != auth.uid())
      )
    )
  )
  WITH CHECK (
    -- read_at 以外のフィールドの変更をトリガーで防ぐ必要があるが、
    -- ここではポリシーレベルで「自分が受信者であること」を強制
    TRUE
  );

-- メッセージ改ざん防止トリガー
CREATE OR REPLACE FUNCTION public.prevent_message_tampering()
RETURNS TRIGGER AS $$
BEGIN
  -- 送信者、内容、マッチID の変更は一切禁止
  IF OLD.sender_id IS DISTINCT FROM NEW.sender_id OR
     OLD.content IS DISTINCT FROM NEW.content OR
     OLD.match_id IS DISTINCT FROM NEW.match_id OR
     OLD.created_at IS DISTINCT FROM NEW.created_at 
  THEN
    RAISE EXCEPTION 'メッセージの内容や送信者は変更できません。';
  END IF;
  
  -- 変更を許可するのは read_at のみ
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS prevent_message_tampering_trigger ON public.messages;
CREATE TRIGGER prevent_message_tampering_trigger
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_message_tampering();

-- ============================================================
-- 4. 自動凍結システム (通報累積による自動処理)
-- ============================================================

CREATE OR REPLACE FUNCTION public.check_report_threshold_and_suspend()
RETURNS TRIGGER AS $$
DECLARE
  report_count INTEGER;
BEGIN
  -- 通報対象のユーザーについて、ユニークな通報者数をカウント
  SELECT COUNT(DISTINCT reporter_id) INTO report_count
  FROM public.reports
  WHERE reported_id = NEW.reported_id;

  -- 閾値 (例: 5人) を超えたら自動的に凍結
  IF report_count >= 50 THEN
    UPDATE public.profiles
    SET is_suspended = TRUE,
        suspended_at = NOW()
    WHERE id = NEW.reported_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_report_auto_suspend ON public.reports;
CREATE TRIGGER on_report_auto_suspend
  AFTER INSERT ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.check_report_threshold_and_suspend();

