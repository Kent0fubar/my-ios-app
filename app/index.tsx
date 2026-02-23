import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';

export default function Index() {
    const { isAuthenticated, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading) {
            if (isAuthenticated) {
                router.replace('/(tabs)/discover');
            } else {
                router.replace('/login');
            }
        }
    }, [isAuthenticated, isLoading]);

    return null;
}
