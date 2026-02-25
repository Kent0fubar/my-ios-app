import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';

export default function Index() {
    const { isAuthenticated, isLoading, profile } = useAuth();

    useEffect(() => {
        if (!isLoading) {
            if (isAuthenticated) {
                // プロフィールが未設定（例：年齢や担当楽器が未登録）ならオンボーディングへ
                const isProfileIncomplete = !profile || !profile.age || !profile.instruments || profile.instruments.length === 0;

                if (isProfileIncomplete) {
                    router.replace('/onboarding');
                } else {
                    router.replace('/(tabs)/discover');
                }
            } else {
                router.replace('/signup');
            }
        }
    }, [isAuthenticated, isLoading, profile]);

    return null;
}
