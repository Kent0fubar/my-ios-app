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

        // 認証状態の変更を監視
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
                if (!mounted) return;
                if (__DEV__) console.log('[Auth] Auth state changed:', event, !!newSession);

                setSession(newSession);
                setUser(newSession?.user ?? null);

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
