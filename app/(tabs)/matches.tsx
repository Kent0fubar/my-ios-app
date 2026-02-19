import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../../src/theme';
import { MOCK_USERS, INSTRUMENTS, GENRES } from '../../src/data/mockData';

const { width } = Dimensions.get('window');

// マッチしたユーザー（デモ用に最初の3人）
const MATCHED_USERS = MOCK_USERS.slice(0, 3);
const NEW_MATCHES = MOCK_USERS.slice(0, 2);

export default function MatchesScreen() {
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
                    <Text style={styles.matchCountText}>{MATCHED_USERS.length}</Text>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* New matches - horizontal scroll */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>新しいマッチ 🎉</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.newMatchesList}
                    >
                        {NEW_MATCHES.map((user) => {
                            const mainInstrument = INSTRUMENTS.find(
                                (i) => i.id === user.instruments[0]
                            );
                            return (
                                <TouchableOpacity
                                    key={user.id}
                                    style={styles.newMatchCard}
                                    activeOpacity={0.8}
                                    onPress={() => router.push(`/chat/${user.id}`)}
                                >
                                    <LinearGradient
                                        colors={[Colors.primary, Colors.secondary]}
                                        style={styles.newMatchGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                    >
                                        <Image
                                            source={{ uri: user.imageUrl }}
                                            style={styles.newMatchImage}
                                        />
                                    </LinearGradient>
                                    <Text style={styles.newMatchName}>{user.name}</Text>
                                    <Text style={styles.newMatchInstrument}>
                                        {mainInstrument?.icon} {mainInstrument?.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}

                        {/* Premium upsell card */}
                        <TouchableOpacity
                            style={styles.premiumUpsellCard}
                            activeOpacity={0.8}
                            onPress={() => router.push('/premium')}
                        >
                            <LinearGradient
                                colors={[Colors.goldGradientStart, Colors.goldGradientEnd]}
                                style={styles.premiumUpsellGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Ionicons name="lock-closed" size={32} color="#fff" />
                            </LinearGradient>
                            <Text style={styles.premiumUpsellText}>もっと見る</Text>
                            <Text style={styles.premiumUpsellSub}>Premium</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                {/* All matches */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>すべてのマッチ</Text>
                    {MATCHED_USERS.map((user) => {
                        const userInstruments = user.instruments
                            .map((id) => INSTRUMENTS.find((i) => i.id === id))
                            .filter(Boolean);
                        const userGenres = user.genres
                            .map((id) => GENRES.find((g) => g.id === id))
                            .filter(Boolean);

                        return (
                            <TouchableOpacity
                                key={user.id}
                                style={styles.matchItem}
                                activeOpacity={0.7}
                                onPress={() => router.push(`/chat/${user.id}`)}
                            >
                                <Image
                                    source={{ uri: user.imageUrl }}
                                    style={styles.matchAvatar}
                                />
                                <View style={styles.matchInfo}>
                                    <View style={styles.matchNameRow}>
                                        <Text style={styles.matchName}>{user.name}</Text>
                                        {user.isVerified && (
                                            <Ionicons
                                                name="checkmark-circle"
                                                size={16}
                                                color={Colors.accent}
                                            />
                                        )}
                                        {user.isPremium && (
                                            <Ionicons name="star" size={14} color={Colors.gold} />
                                        )}
                                    </View>
                                    <View style={styles.matchTags}>
                                        {userInstruments.slice(0, 2).map((inst) => (
                                            <Text key={inst!.id} style={styles.matchTagText}>
                                                {inst!.icon} {inst!.label}
                                            </Text>
                                        ))}
                                    </View>
                                    <View style={styles.matchGenres}>
                                        {userGenres.slice(0, 3).map((genre) => (
                                            <View
                                                key={genre!.id}
                                                style={[
                                                    styles.matchGenreTag,
                                                    { backgroundColor: genre!.color + '20' },
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.matchGenreText,
                                                        { color: genre!.color },
                                                    ]}
                                                >
                                                    {genre!.label}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                                <TouchableOpacity style={styles.chatButton}>
                                    <Ionicons
                                        name="chatbubble"
                                        size={18}
                                        color={Colors.primary}
                                    />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        );
                    })}
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
    premiumUpsellCard: {
        alignItems: 'center',
        gap: 6,
    },
    premiumUpsellGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    premiumUpsellText: {
        fontSize: FontSize.sm,
        fontWeight: '600',
        color: Colors.gold,
    },
    premiumUpsellSub: {
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
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
    matchAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
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
    matchTags: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    matchTagText: {
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
    },
    matchGenres: {
        flexDirection: 'row',
        gap: 4,
    },
    matchGenreTag: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: BorderRadius.full,
    },
    matchGenreText: {
        fontSize: 10,
        fontWeight: '600',
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
});
