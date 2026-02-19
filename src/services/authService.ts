/**
 * 認証サービス
 * Supabase Auth を使用したユーザー認証
 */
import { supabase } from '../lib/supabase';
import { withRateLimit } from '../lib/rateLimit';

export interface SignUpData {
    email: string;
    password: string;
    name: string;
}

export interface SignInData {
    email: string;
    password: string;
}

export const authService = {
    /**
     * メール/パスワードで新規登録
     */
    async signUp({ email, password, name }: SignUpData) {
        // レート制限: 1時間あたり3回
        return withRateLimit('auth:signup', email, async () => {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { name }, // メタデータとして名前を保存
                },
            });

            if (error) throw error;
            return data;
        });
    },

    /**
     * メール/パスワードでログイン
     */
    async signIn({ email, password }: SignInData) {
        return withRateLimit('auth:login', email, async () => {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            return data;
        });
    },

    /**
     * Apple ID でログイン（iOS向け）
     */
    async signInWithApple() {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'apple',
        });
        if (error) throw error;
        return data;
    },

    /**
     * Google でログイン
     */
    async signInWithGoogle() {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
        });
        if (error) throw error;
        return data;
    },

    /**
     * ログアウト
     */
    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    /**
     * パスワードリセットメール送信
     */
    async resetPassword(email: string) {
        return withRateLimit('auth:login', email, async () => {
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            if (error) throw error;
        });
    },

    /**
     * 現在のセッションを取得
     */
    async getSession() {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        return data.session;
    },

    /**
     * 現在のユーザーを取得
     */
    async getCurrentUser() {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        return user;
    },

    /**
     * 認証状態の変更をリスン
     */
    onAuthStateChange(callback: (event: string, session: any) => void) {
        return supabase.auth.onAuthStateChange(callback);
    },
};
