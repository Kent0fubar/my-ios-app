/**
 * 認証サービス
 * Supabase Auth を使用したユーザー認証
 */
import { supabase } from '../lib/supabase';
import { withRateLimit } from '../lib/rateLimit';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as AppleAuthentication from 'expo-apple-authentication';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

// Google Sign-In の初期設定
GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
});

// Ensure the browser session is correctly handled on web
WebBrowser.maybeCompleteAuthSession();

const performOAuth = async (provider: 'apple' | 'google') => {
    // ログイン後、アプリに戻るためのURL
    // Development Client では scheme: "bandlink" を使用
    const redirectUrl = Linking.createURL('', { scheme: 'bandlink' });

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo: redirectUrl,
            skipBrowserRedirect: true, // アプリ側でブラウザを開くため自動リダイレクトをスキップ
        },
    });

    if (error) throw error;

    if (data?.url) {
        if (__DEV__) {
            console.log('[OAuth] Attempting to open URL:', data.url);
            console.log('[OAuth] Redirect URL set as:', redirectUrl);
        }
        // WebView/ブラウザモードで各社の認証画面を開く
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

        if (result.type === 'success' && result.url) {
            // リダイレクトされたURL内の # 以降からトークンを抽出する
            const urlParts = result.url.split('#');
            if (urlParts.length > 1) {
                const paramsStr = urlParts[1].split('&');
                const params: Record<string, string> = {};
                for (const part of paramsStr) {
                    const [k, v] = part.split('=');
                    if (k && v) params[k] = decodeURIComponent(v);
                }

                // トークンがあればSupabaseにセットしてログイン完了
                if (params.access_token && params.refresh_token) {
                    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                        access_token: params.access_token,
                        refresh_token: params.refresh_token,
                    });
                    if (sessionError) throw sessionError;
                    return sessionData.session; // ログイン成功
                } else if (params.error_description) {
                    throw new Error(decodeURIComponent(params.error_description).replace(/\+/g, ' '));
                } else if (params.error) {
                    throw new Error(params.error);
                } else {
                    throw new Error('認証トークンが取得できませんでした。');
                }
            }
        } else if (result.type !== 'cancel' && result.type !== 'dismiss') {
            // キャンセル以外のWebBrowserのエラー
            throw new Error(`ブラウザでの認証に失敗しました。(${result.type})`);
        }
    } else {
        throw new Error('認証用のURLを取得できませんでした。設定を確認してください。');
    }
    return null; // キャンセルされた等
};

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
     * Apple ID でログイン（iOS向けネイティブ / 他はOAuth）
     */
    async signInWithApple() {
        if (Platform.OS === 'ios') {
            try {
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
                    throw new Error('Apple認証トークンの取得に失敗しました');
                }
            } catch (e: any) {
                if (e.code === 'ERR_CANCELED') {
                    return null; // ユーザーキャンセル
                }
                throw e;
            }
        }

        // iOS 以外またはネイティブが利用不可の場合は OAuth ブラウザフロー
        return performOAuth('apple');
    },

    /**
     * Google でログイン（iOS/Androidネイティブ / 他はOAuth）
     */
    async signInWithGoogle() {
        if (Platform.OS === 'ios' || Platform.OS === 'android') {
            try {
                await GoogleSignin.hasPlayServices();
                const userInfo = await GoogleSignin.signIn();

                if (userInfo.data?.idToken) {
                    const { data, error } = await supabase.auth.signInWithIdToken({
                        provider: 'google',
                        token: userInfo.data.idToken,
                    });
                    if (error) throw error;
                    return data.session;
                } else {
                    throw new Error('Google認証トークンの取得に失敗しました');
                }
            } catch (e: any) {
                // キャンセル時はエラーを投げない
                return null;
            }
        }

        // ネイティブが利用不可の場合は OAuth ブラウザフロー
        return performOAuth('google');
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
