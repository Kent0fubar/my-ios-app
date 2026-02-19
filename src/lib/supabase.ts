import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Database } from '../types/database';

// Supabase の設定
// ⚠️ 本番環境では環境変数から読み込んでください
// Supabase ダッシュボードの Project Settings > API から取得
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false, // React Native ではURLセッションを無効化
    },
    // グローバルヘッダー設定
    global: {
        headers: {
            'x-app-version': '1.0.0',
            'x-platform': 'ios',
        },
    },
});

// セッション状態の監視
supabase.auth.onAuthStateChange((event, session) => {
    if (__DEV__) {
        console.log('[Auth]', event, session?.user?.email);
    }
});
