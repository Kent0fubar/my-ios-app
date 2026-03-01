/**
 * 認証コンテキスト
 * アプリ全体で認証状態を共有する
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../types/database';
import { profileService } from '../services/dataService';
import { purchaseService } from '../services/purchaseService';
import { log } from '../lib/logger';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: Profile | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    profile: null,
    isLoading: true,
    isAuthenticated: false,
    refreshProfile: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshProfile = useCallback(async () => {
        try {
            const p = await profileService.getMyProfile();
            setProfile(p);
        } catch (err) {
            log.error('[Auth] Profile fetch error', err);
        }
    }, []);

    useEffect(() => {
        let mounted = true;

        // セーフティタイマー：万が一初期化が完了しない場合でも5秒後にローディングを解除
        const safetyTimer = setTimeout(() => {
            if (mounted && isLoading) {
                if (__DEV__) console.warn('[Auth] Initialization timed out, forcing isLoading to false');
                setIsLoading(false);
            }
        }, 5000);

        // 初期セッションの取得
        const initSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!mounted) return;

                if (session) {
                    if (__DEV__) console.log('[Auth] Restored persistent session:', session.user.email);
                    setSession(session);
                    setUser(session.user);
                    purchaseService.identify(session.user.id);

                    // プロフィールを取得してからローディングを完了する
                    // これにより、index.tsxでprofileがnullのまま判定されることを防ぐ
                    await refreshProfile();
                }
            } catch (err) {
                log.error('[Auth] Initial session fetch error', err);
            } finally {
                if (mounted) {
                    setIsLoading(false);
                    clearTimeout(safetyTimer);
                }
            }
        };

        initSession();

        // ディープリンクからトークンを取得してセッションを確立するヘルパー
        const handleDeepLink = async (url: string | null) => {
            if (!url) return;
            if (__DEV__) console.log('[Auth] Received deep link:', url);

            try {
                // カスタムスキームURLのパース（bandlink://...）
                // new URL() はカスタムスキームでは失敗する場合があるため、手動パースする
                const queryString = url.includes('?') ? url.split('?')[1]?.split('#')[0] : '';
                const hashString = url.includes('#') ? url.split('#')[1] : '';
                const queryParams = new URLSearchParams(queryString || '');
                const hashParams = new URLSearchParams(hashString || '');

                // リカバリーフローかどうかの判定（queryまたはhashの両方をチェック）
                const recoveryType = queryParams.get('type') || hashParams.get('type');
                const isRecovery = recoveryType === 'recovery';

                // 1. PKCE フロー: ?code=... 形式
                const code = queryParams.get('code');
                if (code) {
                    if (__DEV__) console.log('[Auth] Exchanging PKCE code for session');
                    const { error } = await supabase.auth.exchangeCodeForSession(code);
                    if (error) {
                        log.error('[Auth] Failed to exchange code for session', error);
                    } else {
                        if (__DEV__) console.log('[Auth] Session established from PKCE code exchange');
                        if (isRecovery) {
                            if (__DEV__) console.log('[Auth] Recovery flow detected, navigating to update-password');
                            router.replace('/update-password');
                        }
                    }
                    return;
                }

                // 2. トークンハッシュ方式: ?token_hash=...&type=recovery
                const tokenHash = queryParams.get('token_hash');
                const type = queryParams.get('type');
                if (tokenHash && type) {
                    if (__DEV__) console.log('[Auth] Verifying OTP with token_hash, type:', type);
                    const { error } = await supabase.auth.verifyOtp({
                        token_hash: tokenHash,
                        type: type as any,
                    });
                    if (error) {
                        log.error('[Auth] Failed to verify OTP from deep link', error);
                    } else {
                        if (__DEV__) console.log('[Auth] Session established from token_hash verification');
                        if (isRecovery) {
                            if (__DEV__) console.log('[Auth] Recovery flow detected, navigating to update-password');
                            router.replace('/update-password');
                        }
                    }
                    return;
                }

                // 3. Implicit フロー: #access_token=...&refresh_token=...&type=recovery
                const accessToken = hashParams.get('access_token');
                const refreshToken = hashParams.get('refresh_token');
                if (accessToken && refreshToken) {
                    if (__DEV__) console.log('[Auth] Setting session from deep link tokens');
                    const { error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    });
                    if (error) {
                        log.error('[Auth] Failed to set session from deep link', error);
                    } else {
                        if (__DEV__) console.log('[Auth] Session established from email verification deep link');
                        // Implicit フローでは type は hash に含まれる
                        if (isRecovery) {
                            if (__DEV__) console.log('[Auth] Recovery flow detected, navigating to update-password');
                            router.replace('/update-password');
                        }
                    }
                }
            } catch (e) {
                log.error('[Auth] Deep link handling error', e);
            }
        };

        // アプリが起動した際の初期URLを処理（メールリンクをタップしてアプリが起動した場合）
        Linking.getInitialURL().then(handleDeepLink);

        // アプリが起動中にディープリンクを受け取った場合
        const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
            handleDeepLink(url);
        });

        // 認証状態の変更を監視
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
                if (!mounted) return;
                if (__DEV__) console.log('[Auth] Auth state changed:', event, !!newSession);

                setSession(newSession);
                setUser(newSession?.user ?? null);

                if (event === 'PASSWORD_RECOVERY') {
                    // OTP方式のリセットフロー中はこのイベントを無視
                    // （reset-password画面内で完結するため、update-passwordに飛ばす必要がない）
                    const { isOtpPasswordResetInProgress } = require('../services/authService');
                    if (isOtpPasswordResetInProgress) {
                        if (__DEV__) console.log('[Auth] PASSWORD_RECOVERY event ignored (OTP reset in progress)');
                        return;
                    }
                    // ディープリンク経由のリセットフローの場合のみ遷移
                    router.replace('/update-password');
                    return;
                }

                if (newSession?.user) {
                    await Promise.all([
                        refreshProfile(),
                        purchaseService.identify(newSession.user.id)
                    ]);
                } else if (event === 'SIGNED_OUT') {
                    setProfile(null);
                }
            }
        );

        // アプリの状態（バックグラウンド/フォアグラウンド）を監視してリフレッシュ
        const { AppState } = require('react-native');
        const handleAppStateChange = async (nextAppState: string) => {
            if (nextAppState === 'active') {
                // アプリ復帰時にセッションをリフレッシュ
                const { data: { session: refreshedSession } } = await supabase.auth.getSession();
                if (refreshedSession && mounted) {
                    setSession(refreshedSession);
                    setUser(refreshedSession.user);
                }
            }
        };

        const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            mounted = false;
            clearTimeout(safetyTimer);
            subscription.unsubscribe();
            appStateSubscription.remove();
            linkingSubscription.remove();
        };
    }, [refreshProfile]);

    // ユーザーが変わったらプロフィールを取得
    useEffect(() => {
        if (user) {
            refreshProfile();
        }
    }, [user, refreshProfile]);

    return (
        <AuthContext.Provider
            value={{
                session,
                user,
                profile,
                isLoading,
                isAuthenticated: !!session,
                refreshProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
