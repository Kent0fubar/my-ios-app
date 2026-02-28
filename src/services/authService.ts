/**
 * 認証サービス
 * Supabase Auth を使用したユーザー認証
 */
import { supabase } from '../lib/supabase';
import { withRateLimit } from '../lib/rateLimit';
import * as AppleAuthentication from 'expo-apple-authentication';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import { log } from '../lib/logger';

// iOSネイティブアプリ向けの初期設定
GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
});

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
                    // Edge Function を中間ページとして使用
                    // Safari が HTTPS→カスタムスキームの302リダイレクトをブロックするため、
                    // Edge Function 経由で JavaScript によるリダイレクトを行う
                    emailRedirectTo: `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/auth-callback`,
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
     * Apple ID でログイン（iOSネイティブ専用）
     */
    async signInWithApple() {
        try {
            const isAvailable = await AppleAuthentication.isAvailableAsync();
            if (!isAvailable) {
                throw new Error('お使いの端末ではAppleログインを利用できません。');
            }

            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });

            if (credential.identityToken) {
                const { data, error } = await supabase.auth.signInWithIdToken({
                    provider: 'apple',
                    token: credential.identityToken,
                });
                if (error) throw error;
                return data.session;
            } else {
                throw new Error('Appleログインに必要な情報（identityToken）が取得できませんでした。');
            }
        } catch (e: any) {
            if (e.code === 'ERR_REQUEST_CANCELED' || e.code === 'ERR_CANCELED') {
                log.info('[Auth] Native Apple Auth cancelled by user.');
                return null; // ユーザーキャンセル
            }
            log.error('[Auth] Native Apple Auth failed', e);
            throw e;
        }
    },

    /**
     * Google でログイン（iOSネイティブ専用）
     */
    async signInWithGoogle() {
        try {
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();

            if (userInfo.type === 'success' && userInfo.data.idToken) {
                const { data, error } = await supabase.auth.signInWithIdToken({
                    provider: 'google',
                    token: userInfo.data.idToken,
                });
                if (error) throw error;
                return data.session;
            } else if (userInfo.type === 'cancelled') {
                log.info('[Auth] Native Google Sign-In cancelled.');
                return null;
            } else {
                throw new Error('Google ID Token not found or sign-in failed.');
            }
        } catch (e: any) {
            if (e.code === '7' || e.code === 'ASYNC_OP_IN_PROGRESS') {
                log.info('[Auth] Native Google Sign-In cancelled by user.');
                return null; // Cancel
            }
            log.error('[Auth] Native Google Sign-In failed:', e);
            throw e;
        }
    },

    /**
     * ログアウト
     */
    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    /**
     * パスワードリセット用OTPメール送信
     */
    async resetPassword(email: string) {
        return withRateLimit('auth:login', email, async () => {
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            if (error) throw error;
        });
    },

    /**
     * OTPを検証してパスワードを更新
     */
    async verifyOtpAndUpdatePassword(email: string, token: string, newPassword: string) {
        // OTP を検証してセッションを確立
        const { data, error: verifyError } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'recovery',
        });
        if (verifyError) throw verifyError;

        // セッションが確立されたらパスワードを更新
        const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword,
        });
        if (updateError) throw updateError;

        return data;
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
