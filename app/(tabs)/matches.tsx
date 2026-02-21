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
import { InstrumentTag, GenreTag } from '../../src/components/Tag';

export default function MatchesScreen() {
    const { user } = useAuth();
    const [matches, setMatches] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchMatches = async () => {
        if (!user) return;
        try {
            const data = await matchService.getMatches(user.id);
            setMatches(data);
            console.log('[Matches] Fetched data:', JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('[Matches] Fetch error:', error);
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
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    // 分類
    const newMatches = matches.filter(m => !m.lastMessage);
    const activeMatches = matches.filter(m => !!m.lastMessage);

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[Colors.background, Colors.backgroundSecondary]}
                style={StyleSheet.absoluteFill}
            />

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
                        <View style={styles.emptyContainer}>
                            <Ionicons name="chatbubbles-outline" size={48} color={Colors.textTertiary} />
                            <Text style={styles.emptyText}>メッセージはまだありません</Text>
                            <Text style={styles.emptySubText}>新しいマッチ相手にあいさつしてみましょう！</Text>
                        </View>
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
        </View>
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
});
