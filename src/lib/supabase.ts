import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Database } from '../types/database';

// Supabase の設定
// 環境変数から読み込みます (.env などを利用)
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    if (process.env.APP_ENV === 'production') {
        throw new Error('Missing Supabase Environment Variables in Production');
    } else {
        console.warn('⚠️ Environment Variables not found. Check your .env setup.');
    }
}

const supabaseUrlStr = SUPABASE_URL || '';
const supabaseAnonStr = SUPABASE_ANON_KEY || '';

// 型定義の不整合によるビルドエラーを回避するため一時的にanyを使用
export const supabase = createClient<any>(supabaseUrlStr, supabaseAnonStr, {
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
