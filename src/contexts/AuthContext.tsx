/**
 * 認証コンテキスト
 * アプリ全体で認証状態を共有する
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../types/database';
import { profileService } from '../services/dataService';

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
            if (__DEV__) console.error('[Auth] Profile fetch error:', err);
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

        // 初回ロード時にセッションを取得
        supabase.auth.getSession()
            .then(({ data: { session } }) => {
                if (!mounted) return;
                if (__DEV__) console.log('[Auth] Initial session fetched:', !!session);
                setSession(session);
                setUser(session?.user ?? null);
                setIsLoading(false);
                clearTimeout(safetyTimer);
            })
            .catch(err => {
                if (__DEV__) console.error('[Auth] Initial session fetch error:', err);
                if (mounted) {
                    setIsLoading(false);
                    clearTimeout(safetyTimer);
                }
            });

        // 認証状態の変更を監視
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                if (!mounted) return;
                if (__DEV__) console.log('[Auth] Auth state changed:', _event, !!session);

                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    await refreshProfile();
                } else {
                    setProfile(null);
                }
            }
        );

        return () => {
            mounted = false;
            clearTimeout(safetyTimer);
            subscription.unsubscribe();
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
