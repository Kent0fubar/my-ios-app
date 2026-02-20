# 🔐 Supabase OAuth 認証設定ガイド (Google / Apple)

BandLinkアプリで「Googleでログイン」「Appleでログイン」を機能させるために必要な、Supabaseと各プロバイダーの設定手順です。

---

## 🔵 1. Googleログインの設定手順

### Step 1: Google Cloud Consoleでのアプリ登録
1. [Google Cloud Console](https://console.cloud.google.com/) にアクセスし、ログインします。
2. 画面上の**「プロジェクトを選択」**から、新しいプロジェクトを作成します（例：`BandLink Auth`）。
3. 左側のメニューから **「APIとサービス」 > 「認証情報」** を選択します。
4. 画面上部の **「＋認証情報を作成」** をクリックし、**「OAuth クライアント ID」** を選びます。
   - ※ 初めての場合「同意画面を設定」するよう求められます。ユーザータイプ「外部」を選び、アプリ名（BandLink）と連絡先メールアドレスだけ入力して保存すればOKです。
5. アプリケーションの種類で **「ウェブ アプリケーション」** を選択します。（※iOSアプリでもSupabaseを中継するためウェブを選びます）
6. **「承認済みのリダイレクト URI」** に以下のURLを入力して追加します。
   - `https://[あなたのSupabaseプロジェクトのID].supabase.co/auth/v1/callback`
7. 「作成」を押すと、**「クライアントID」** と **「クライアント シークレット」** が発行されます。これをコピーしておきます。

### Step 2: Supabase側への設定
1. [Supabaseのダッシュボード](https://supabase.com/dashboard)を開きます。
2. 左メニューから **Authentication**（鍵マーク） > **Providers** を開き、**Google** の項目を開きます。
3. トグルを「Enable Google」にしてONにします。
4. Step 1でコピーした**「Client ID」** と **「Client Secret」** を貼り付けて、「Save」を押せば完了です！

---

## 🍎 2. Appleログインの設定手順

iOSアプリでサードパーティ認証（Googleなど）を導入する場合、Appleの審査のルール上、**「Appleでサインイン（Sign in with Apple）」ボタンを必ず設置しなければなりません。**

### Step 1: Apple Developerサイトでの証明書作成
1. [Apple Developer Portal (Certificates, Identifiers & Profiles)](https://developer.apple.com/account/resources/identifiers/list) にアクセスします。
2. **App ID の設定**: 
   - 「Identifiers」から「App IDs」を選んで作成。
   - Bundle ID（例: `com.bandlink.app`）を指定し、Capabilities（機能）のリストの下の方にある **「Sign In with Apple」** にチェックを入れて保存します。
3. **Services ID の作成**:
   - 右上の＋ボタンを押し、「Services IDs」を選択します。
   - Identifier（例: `com.bandlink.app.signin`）を入力。
   - 作成したServices IDを開き、「Sign In with Apple」にチェックを入れて「Configure」を押します。
   - **Primary App ID**に先ほどのApp IDを選びます。
   - **Web Domain** に `[あなたのSupabaseのID].supabase.co` を入力。
   - **Return URLs** に `https://[あなたのSupabaseのID].supabase.co/auth/v1/callback` を入力して保存します。
4. **Key (秘密鍵) の作成**:
   - 左メニューの「Keys」を選び、＋ボタンで作ります。（例: `BandLink Apple Sign In`）
   - 「Sign In with Apple」にチェックを入れ、「Configure」でPrimary App IDを紐付けます。
   - 作成後、**`.p8` ファイル**を1度だけダウンロードできます。大切に保管してください。
   - 同時に画面に表示される **Key ID** と、右上に常に表示されている **Team ID** をメモします。

### Step 2: Supabase側への設定
1. [Supabaseのダッシュボード](https://supabase.com/dashboard)の **Authentication** > **Providers** > **Apple** を開きます。
2. トグルを「Enable」にしてONにします。
3. 以下の情報を入力します：
   - **Services ID**: Step 1-3で作った `com.bandlink.app.signin`
   - **Team ID**: Step 1-4でメモしたTeam ID
   - **Key ID**: Step 1-4でメモしたKey ID
   - **Private Key**: ダウンロードした `.p8` ファイルをメモ帳で開き、中のテキスト（`-----BEGIN PRIVATE KEY-----`等を含む）をすべてコピーして貼り付けます。
4. 「Save」を押せば完了です！

---

### 次のステップ（アプリ側の実装）
上記の設定が終われば、現在実装されている「Appleでログイン」「Googleでログイン」ボタンを押した際に、各種認証プロバイダーを経由した安全なログイン・新規登録が自動的に行われるようになります。
