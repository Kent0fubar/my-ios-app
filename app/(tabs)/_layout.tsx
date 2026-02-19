/**
 * タブレイアウト（認証ガード付き）
 * 未認証ユーザーはログイン画面にリダイレクトされる
 */
import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../src/theme';
import { useAuth } from '../../src/contexts/AuthContext';

export default function TabLayout() {
    const { isAuthenticated, isLoading } = useAuth();

    // ローディング中
    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    // 🛡️ 認証ガード: 未認証ユーザーはログイン画面へリダイレクト
    // URLを直接入力してもアクセス不可
    if (!isAuthenticated) {
        return <Redirect href="/auth/login" />;
    }

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.textTertiary,
                tabBarLabelStyle: styles.tabLabel,
                tabBarItemStyle: styles.tabItem,
            }}
        >
            <Tabs.Screen
                name="discover"
                options={{
                    title: '探す',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={styles.iconContainer}>
                            {focused && (
                                <LinearGradient
                                    colors={[Colors.primary, Colors.secondary]}
                                    style={styles.activeIndicator}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                />
                            )}
                            <Ionicons
                                name={focused ? 'compass' : 'compass-outline'}
                                size={26}
                                color={color}
                            />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="matches"
                options={{
                    title: 'マッチ',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={styles.iconContainer}>
                            {focused && (
                                <LinearGradient
                                    colors={[Colors.primary, Colors.secondary]}
                                    style={styles.activeIndicator}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                />
                            )}
                            <Ionicons
                                name={focused ? 'heart' : 'heart-outline'}
                                size={26}
                                color={color}
                            />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="messages"
                options={{
                    title: 'メッセージ',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={styles.iconContainer}>
                            {focused && (
                                <LinearGradient
                                    colors={[Colors.primary, Colors.secondary]}
                                    style={styles.activeIndicator}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                />
                            )}
                            <Ionicons
                                name={focused ? 'chatbubbles' : 'chatbubbles-outline'}
                                size={26}
                                color={color}
                            />
                        </View>
                    ),
                    tabBarBadge: 3,
                    tabBarBadgeStyle: styles.badge,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'プロフィール',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={styles.iconContainer}>
                            {focused && (
                                <LinearGradient
                                    colors={[Colors.primary, Colors.secondary]}
                                    style={styles.activeIndicator}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                />
                            )}
                            <Ionicons
                                name={focused ? 'person' : 'person-outline'}
                                size={26}
                                color={color}
                            />
                        </View>
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0A0A1A',
    },
    tabBar: {
        backgroundColor: 'rgba(10, 10, 26, 0.95)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
        height: 88,
        paddingBottom: 30,
        paddingTop: 8,
        backdropFilter: 'blur(20px)',
    },
    tabLabel: {
        fontSize: 10,
        fontWeight: '600',
        marginTop: 2,
    },
    tabItem: {
        gap: 2,
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    activeIndicator: {
        position: 'absolute',
        top: -8,
        width: 24,
        height: 3,
        borderRadius: 2,
    },
    badge: {
        backgroundColor: Colors.secondary,
        fontSize: 10,
        fontWeight: '700',
        minWidth: 18,
        height: 18,
    },
});
