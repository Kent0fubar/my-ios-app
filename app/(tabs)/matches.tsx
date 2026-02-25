import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { matchService, messageService } from '../../src/services/dataService';
import { InstrumentTag, GenreTag } from '../../src/components/Tag';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';
import { EmptyState } from '../../src/components/common/EmptyState';
import { ActionModal } from '../../src/components/common/ActionModal';
import { AdBanner } from '../../src/components/common/AdBanner';

export default function MatchesScreen() {
    const { user, profile, refreshProfile } = useAuth();
    // 判定ロジック: is_premium または is_pro フラグが true ならプレミアム特典を有効にする
    const isPremium = profile?.is_premium === true || profile?.is_pro === true;

    const [matches, setMatches] = useState<any[]>([]);
    const [likesYou, setLikesYou] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isUpgradeModalVisible, setIsUpgradeModalVisible] = useState(false);

    const fetchMatches = async () => {
        if (!user) {
            console.log('[Matches] Skip fetch: No user');
            return;
        }
        try {
            console.log('[Matches] Fetching matches and likes...');
            const [matchesData, likesData] = await Promise.all([
                matchService.getMatches(user.id),
                matchService.getLikesYou(user.id)
            ]);
            console.log(`[Matches] Fetched ${matchesData.length} matches and ${likesData.length} likes`);
            setMatches(matchesData);
            setLikesYou(likesData);
        } catch (error) {
            console.error('[Matches] Fetch Error Details:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (!user) return;

        console.log('[Matches] Initializing screen and subscriptions for user:', user.id);
        fetchMatches();

        // 1. 新着メッセージをリアルタイムで監視
        const messageChannel = messageService.subscribeToAllMessages(user.id, (payload) => {
            console.log('[Matches] Message event received:', payload.eventType, payload.new?.id);
            fetchMatches();
        });

        // 2. 新しいマッチをリアルタイムで監視
        const matchChannel = matchService.subscribeToMatches(user.id, (payload) => {
            console.log('[Matches] Match event received:', payload.eventType, payload.new?.id);
            fetchMatches();
        });

        return () => {
            console.log('[Matches] Cleaning up subscriptions');
            if (messageChannel) messageChannel.unsubscribe();
            if (matchChannel) matchChannel.unsubscribe();
        };
    }, [user]);

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([
            fetchMatches(),
            refreshProfile()
        ]);
    };

    if (isLoading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    // 分類
    const newMatches = matches.filter(m => !m.lastMessage);
    const activeMatches = matches.filter(m => !!m.lastMessage);

    return (
        <ScreenContainer>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>マッチ</Text>
                <View style={styles.matchCount}>
                    <Ionicons name="heart" size={14} color={Colors.secondary} />
                    <Text style={styles.matchCountText}>{matches.length}</Text>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                }
            >
                {/* Likes You / Fans Section (Premium features) */}
                <View style={[styles.section, { marginBottom: Spacing.lg }]}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>あなたへの「いいね」</Text>
                        <View style={styles.likesCountBadge}>
                            <Text style={styles.likesCountText}>{likesYou.length}</Text>
                        </View>
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.likesYouList}
                    >
                        {likesYou.length > 0 ? (
                            likesYou.map((fan, index) => (
                                <TouchableOpacity
                                    key={fan.id}
                                    style={styles.likeCard}
                                    activeOpacity={isPremium ? 0.8 : 1}
                                    onPress={() => {
                                        console.log('[Matches] Liker Tapped. isPremium:', isPremium, 'LikerID:', fan.id);
                                        if (isPremium) {
                                            router.push(`/chat/${fan.id}`);
                                        } else {
                                            setIsUpgradeModalVisible(true);
                                        }
                                    }}
                                >
                                    <View style={styles.likeAvatarContainer}>
                                        <Image
                                            source={fan.avatar_url ? { uri: fan.avatar_url } : { uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop' }}
                                            style={styles.likeAvatar}
                                        />
                                        {!isPremium && (
                                            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill}>
                                                <View style={styles.lockOverlay}>
                                                    <Ionicons name="lock-closed" size={20} color="#fff" />
                                                </View>
                                            </BlurView>
                                        )}
                                    </View>
                                    <Text style={styles.likeName} numberOfLines={1}>
                                        {isPremium ? fan.name : '????'}
                                    </Text>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <View style={styles.emptyLikesContainer}>
                                <Text style={styles.emptyLikesText}>まだ「いいね」はありません</Text>
                            </View>
                        )}
                        {!isPremium && likesYou.length > 0 && (
                            <TouchableOpacity
                                style={styles.revealAllCard}
                                onPress={() => setIsUpgradeModalVisible(true)}
                            >
                                <LinearGradient
                                    colors={[Colors.primary + '33', Colors.secondary + '33']}
                                    style={styles.revealAllGradient}
                                >
                                    <Ionicons name="eye-outline" size={24} color={Colors.primary} />
                                    <Text style={styles.revealAllText}>全員見る</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                </View>

                {/* 広告セクション（無料会員のみ） */}
                <AdBanner placement="matches" />

                {/* New matches - horizontal scroll */}
                {newMatches.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>新しいマッチ 🎉</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.newMatchesList}
                        >
                            {newMatches.map((match) => {
                                const p = match.otherProfile;
                                return (
                                    <TouchableOpacity
                                        key={match.id}
                                        style={styles.newMatchCard}
                                        activeOpacity={0.8}
                                        onPress={() => router.push(`/chat/${p.id}`)}
                                    >
                                        <LinearGradient
                                            colors={[Colors.primary, Colors.secondary]}
                                            style={styles.newMatchGradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                        >
                                            <Image
                                                source={p.avatar_url ? { uri: p.avatar_url } : { uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop' }}
                                                style={styles.newMatchImage}
                                                contentFit="cover"
                                                transition={200}
                                            />
                                        </LinearGradient>
                                        <Text style={styles.newMatchName}>{p.name}</Text>
                                        <Text style={styles.newMatchInstrument}>
                                            {p.instruments?.[0] || '楽器未設定'}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                )}

                {/* Active matches */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>最近のメッセージ</Text>
                    {activeMatches.length === 0 ? (
                        <EmptyState
                            icon="chatbubbles-outline"
                            title="メッセージはまだありません"
                            description="新しいマッチ相手にあいさつしてみましょう！"
                        />
                    ) : (
                        activeMatches.map((match) => {
                            const p = match.otherProfile;
                            return (
                                <TouchableOpacity
                                    key={match.id}
                                    style={styles.matchItem}
                                    activeOpacity={0.7}
                                    onPress={() => router.push(`/chat/${p.id}`)}
                                >
                                    <View style={styles.avatarContainer}>
                                        <Image
                                            source={p.avatar_url ? { uri: p.avatar_url } : { uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop' }}
                                            style={styles.matchAvatar}
                                            contentFit="cover"
                                            transition={200}
                                        />
                                        {p.is_online && <View style={styles.onlineBadge} />}
                                    </View>
                                    <View style={styles.matchInfo}>
                                        <View style={styles.matchNameRow}>
                                            <Text style={styles.matchName}>{p.name}</Text>
                                            {p.is_verified && (
                                                <Ionicons
                                                    name="checkmark-circle"
                                                    size={16}
                                                    color={Colors.accent}
                                                />
                                            )}
                                        </View>
                                        <Text style={styles.lastMessage} numberOfLines={1}>
                                            {match.lastMessage?.content || '新しいマッチです！メッセージを送ってみましょう'}
                                        </Text>
                                    </View>
                                    <View style={styles.chatButton}>
                                        <Ionicons
                                            name="chatbubble"
                                            size={18}
                                            color={Colors.primary}
                                        />
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </View>
            </ScrollView>

            <ActionModal
                visible={isUpgradeModalVisible}
                onClose={() => setIsUpgradeModalVisible(false)}
                onConfirm={() => {
                    setIsUpgradeModalVisible(false);
                    router.push('/premium');
                }}
                title="Premium機能"
                message="あなたに「いいね」してくれたユーザーを全員確認するには、Premiumプランへの登録が必要です。"
                confirmText="詳しく見る"
                icon="heart"
                iconColor={Colors.secondary}
            />
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
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
    matchCount: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.card,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: BorderRadius.full,
    },
    matchCountText: {
        color: Colors.secondary,
        fontSize: FontSize.sm,
        fontWeight: '700',
    },
    scrollContent: {
        paddingBottom: 100,
    },
    section: {
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: Colors.text,
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
    },
    newMatchesList: {
        paddingHorizontal: Spacing.lg,
        gap: Spacing.md,
    },
    newMatchCard: {
        alignItems: 'center',
        gap: 6,
    },
    newMatchGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        padding: 3,
        alignItems: 'center',
        justifyContent: 'center',
    },
    newMatchImage: {
        width: 74,
        height: 74,
        borderRadius: 37,
        borderWidth: 2,
        borderColor: Colors.background,
    },
    newMatchName: {
        fontSize: FontSize.sm,
        fontWeight: '600',
        color: Colors.text,
    },
    newMatchInstrument: {
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
    },
    matchItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        gap: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.surfaceBorder,
    },
    avatarContainer: {
        position: 'relative',
    },
    matchAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    onlineBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#10B981',
        borderWidth: 2,
        borderColor: Colors.background,
    },
    matchInfo: {
        flex: 1,
        gap: 4,
    },
    matchNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    matchName: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: Colors.text,
    },
    lastMessage: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
    },
    chatButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.2)',
    },
    emptyContainer: {
        paddingVertical: 60,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.md,
    },
    emptyText: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: Colors.textSecondary,
    },
    emptySubText: {
        fontSize: FontSize.md,
        color: Colors.textTertiary,
        textAlign: 'center',
        paddingHorizontal: Spacing.xl,
    },

    // --- Likes You Section ---
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
    },
    likesCountBadge: {
        backgroundColor: Colors.secondary + '33',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: BorderRadius.sm,
    },
    likesCountText: {
        color: Colors.secondary,
        fontSize: FontSize.xs,
        fontWeight: '700',
    },
    likesYouList: {
        paddingHorizontal: Spacing.lg,
        gap: Spacing.md,
        minHeight: 110,
    },
    likeCard: {
        width: 80,
        gap: 6,
        alignItems: 'center',
    },
    likeAvatarContainer: {
        width: 80,
        height: 80,
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        backgroundColor: Colors.surface,
    },
    likeAvatar: {
        width: '100%',
        height: '100%',
    },
    lockOverlay: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    likeName: {
        fontSize: FontSize.xs,
        color: Colors.text,
        fontWeight: '600',
    },
    revealAllCard: {
        width: 80,
        height: 80,
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
    },
    revealAllGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    revealAllText: {
        fontSize: 10,
        color: Colors.primary,
        fontWeight: '700',
    },
    emptyLikesContainer: {
        height: 80,
        justifyContent: 'center',
        paddingHorizontal: Spacing.md,
    },
    emptyLikesText: {
        color: Colors.textTertiary,
        fontSize: FontSize.sm,
        fontStyle: 'italic',
    },
});
