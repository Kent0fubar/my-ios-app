# 🔧 Supabase セットアップガイド

## 1. Supabase プロジェクト作成

1. [https://supabase.com](https://supabase.com) にアクセス
2. GitHub アカウントでサインアップ
3. 「New Project」をクリック
4. 以下を入力:
   - **Project Name**: `bandlink`
   - **Database Password**: 安全なパスワードを設定（保管してください）
   - **Region**: `Northeast Asia (Tokyo)` を選択
5. 「Create new project」をクリック

## 2. データベーススキーマの適用

1. Supabase ダッシュボードの **SQL Editor** を開く
2. `supabase/schema.sql` の内容をすべてコピー
3. SQL Editor に貼り付けて **RUN** をクリック

## 3. ストレージバケットの作成

1. **Storage** メニューを開く
2. 以下の2つのバケットを作成:
   - `avatars` (Public: ON)
   - `audio_clips` (Public: ON)

## 4. API キーの取得

1. **Project Settings** > **API** を開く
2. 以下の値をコピー:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## 5. 環境変数の設定

プロジェクトルートに `.env` ファイルを作成:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx...
```

## 6. 認証プロバイダーの設定（オプション）

### Apple Sign In
1. **Authentication** > **Providers** > **Apple**
2. Apple Developer アカウントの情報を入力

### Google Sign In
1. **Authentication** > **Providers** > **Google**
2. Google Cloud Console の OAuth 情報を入力

## 7. セキュリティ確認チェックリスト

- [ ] 全テーブルに RLS が有効化されている
- [ ] `anon` キーのみ使用（`service_role` キーはアプリに入れない）
- [ ] ストレージバケットのポリシーが設定されている
- [ ] Spend Cap が有効（有料プラン移行時）
