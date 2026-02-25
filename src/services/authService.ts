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
                    // 認証後のリダイレクト先を中間ページ（Edge Function）に設定
                    emailRedirectTo: (() => {
                        const linking = require('expo-linking');
                        let baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace('.supabase.co', '.supabase.co/functions/v1/auth-success');

                        // 環境変数から固定のスキームを取得、なければ動的に取得
                        let scheme = process.env.EXPO_PUBLIC_APP_SCHEME;

                        if (!scheme) {
                            try {
                                const currentUrl = linking.createURL('');
                                scheme = currentUrl.split(':')[0];
                            } catch (e) {
                                log.error('[Auth] Failed to get current scheme', e);
                            }
                        }

                        if (scheme && baseUrl) {
                            baseUrl += `?scheme=${scheme}`;
                        }

                        if (__DEV__) console.log('[Auth] Generated signUp redirectTo URL:', baseUrl);
                        return baseUrl;
                    })(),
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
