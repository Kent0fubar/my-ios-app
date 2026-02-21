import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { matchService } from '../../src/services/dataService';

export default function MessagesScreen() {
    const { user } = useAuth();
    const [matches, setMatches] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchMatches = async () => {
        if (!user) return;
        try {
            const data = await matchService.getMatches(user.id);
            setMatches(data);
        } catch (error) {
            console.error('[Messages] Fetch error:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchMatches();
    }, [user]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchMatches();
    };

    if (isLoading && !refreshing) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    // 会話（メッセージがあるもの）
    const activeMatches = matches.filter(m => !!m.lastMessage);

    // オンライン中のユーザー（とりあえずマッチした人を表示）
    const onlineMatches = matches.filter(m => m.otherProfile).slice(0, 10);

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[Colors.background, Colors.backgroundSecondary]}
                style={StyleSheet.absoluteFill}
            />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>メッセージ</Text>
                <TouchableOpacity style={styles.searchButton}>
                    <Ionicons name="search" size={22} color={Colors.textSecondary} />
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                }
            >
                {/* Online now */}
                {onlineMatches.length > 0 && (
                    <View style={styles.onlineSection}>
                        <Text style={styles.sectionTitle}>つながり</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.onlineList}
                        >
                            {onlineMatches.map((match) => {
                                const profile = match.otherProfile;
                                return (
                                    <TouchableOpacity
                                        key={match.id}
                                        style={styles.onlineUser}
                                        activeOpacity={0.8}
                                        onPress={() => router.push(`/chat/${profile.id}`)}
                                    >
                                        <View style={styles.onlineAvatarContainer}>
                                            <Image
                                                source={profile.avatar_url ? { uri: profile.avatar_url } : { uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop' }}
                                                style={styles.onlineAvatar}
                                            />
                                            {profile.is_verified && <View style={styles.onlineDot} />}
                                        </View>
                                        <Text style={styles.onlineName} numberOfLines={1}>
                                            {profile.name}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                )}

                {/* Conversations */}
                <View style={styles.conversationsSection}>
                    <Text style={styles.sectionTitle}>会話</Text>
                    {activeMatches.length === 0 ? (
                        <Text style={styles.emptyText}>メッセージはまだありません。</Text>
                    ) : (
                        activeMatches.map((match, index) => {
                            const profile = match.otherProfile;
                            const unreadCount = match.unreadCount || 0;

                            // 簡易的な時間表示
                            const time = match.lastMessage ? new Date(match.lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

                            return (
                                <TouchableOpacity
                                    key={match.id}
                                    style={styles.conversationItem}
                                    activeOpacity={0.7}
                                    onPress={() => router.push(`/chat/${profile.id}`)}
                                >
                                    <View style={styles.avatarContainer}>
                                        <Image
                                            source={profile.avatar_url ? { uri: profile.avatar_url } : { uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop' }}
                                            style={styles.avatar}
                                        />
                                        {profile.is_verified && <View style={styles.onlineDotSmall} />}
                                    </View>
                                    <View style={styles.conversationContent}>
                                        <View style={styles.conversationHeader}>
                                            <View style={styles.nameWithInstrument}>
                                                <Text style={styles.conversationName}>
                                                    {profile.name}
                                                </Text>
                                                {profile.instruments && profile.instruments.length > 0 && (
                                                    <Text style={styles.instrumentEmoji}>
                                                        🎵
                                                    </Text>
                                                )}
                                            </View>
                                            <Text
                                                style={[
                                                    styles.time,
                                                    unreadCount > 0 && styles.timeActive,
                                                ]}
                                            >
                                                {time}
                                            </Text>
                                        </View>
                                        <View style={styles.messageRow}>
                                            <Text
                                                style={[
                                                    styles.lastMessage,
                                                    unreadCount > 0 && styles.lastMessageUnread,
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {match.lastMessage?.content || 'メッセージを送りましょう'}
                                            </Text>
                                            {unreadCount > 0 && (
                                                <View style={styles.unreadBadge}>
                                                    <Text style={styles.unreadText}>{unreadCount}</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </View>

                {/* Premium upsell */}
                <TouchableOpacity
                    style={styles.premiumBanner}
                    activeOpacity={0.8}
                    onPress={() => router.push('/premium')}
                >
                    <LinearGradient
                        colors={[Colors.primary + '20', Colors.secondary + '20']}
                        style={styles.premiumBannerGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <View style={styles.premiumBannerContent}>
                            <Ionicons name="checkmark-circle" size={24} color={Colors.accent} />
                            <View style={styles.premiumBannerText}>
                                <Text style={styles.premiumBannerTitle}>
                                    既読機能をアンロック
                                </Text>
                                <Text style={styles.premiumBannerSub}>
                                    Premiumでメッセージの既読を確認
                                </Text>
                            </View>
                            <Ionicons
                                name="chevron-forward"
                                size={20}
                                color={Colors.textSecondary}
                            />
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
    },
    headerTitle: {
        fontSize: FontSize.xxl,
        fontWeight: '800',
        color: Colors.text,
    },
    searchButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        paddingBottom: 100,
    },
    onlineSection: {
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        fontSize: FontSize.sm,
        fontWeight: '600',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
    },
    onlineList: {
        paddingHorizontal: Spacing.lg,
        gap: Spacing.lg,
    },
    onlineUser: {
        alignItems: 'center',
        gap: 6,
    },
    onlineAvatarContainer: {
        position: 'relative',
    },
    onlineAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 2,
        borderColor: Colors.card,
    },
    onlineDot: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: Colors.success,
        borderWidth: 2,
        borderColor: Colors.background,
    },
    onlineName: {
        fontSize: FontSize.xs,
        color: Colors.text,
        fontWeight: '500',
        width: 56,
        textAlign: 'center',
    },
    conversationsSection: {
        marginBottom: Spacing.lg,
    },
    conversationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: 14,
        gap: Spacing.md,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
    },
    onlineDotSmall: {
        position: 'absolute',
        bottom: 1,
        right: 1,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: Colors.success,
        borderWidth: 2,
        borderColor: Colors.background,
    },
    conversationContent: {
        flex: 1,
        gap: 4,
    },
    conversationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    nameWithInstrument: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    conversationName: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: Colors.text,
    },
    instrumentEmoji: {
        fontSize: 14,
    },
    time: {
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
    },
    timeActive: {
        color: Colors.primary,
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    lastMessage: {
        flex: 1,
        fontSize: FontSize.sm,
        color: Colors.textTertiary,
    },
    lastMessageUnread: {
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    unreadBadge: {
        backgroundColor: Colors.primary,
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
    },
    unreadText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },
    premiumBanner: {
        marginHorizontal: Spacing.lg,
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
    },
    premiumBannerGradient: {
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
    },
    premiumBannerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    premiumBannerText: {
        flex: 1,
    },
    premiumBannerTitle: {
        fontSize: FontSize.md,
        fontWeight: '700',
        color: Colors.text,
    },
    premiumBannerSub: {
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    emptyText: {
        textAlign: 'center',
        color: Colors.textTertiary,
        paddingVertical: Spacing.xl,
    }
});
