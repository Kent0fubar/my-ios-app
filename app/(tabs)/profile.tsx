import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../../src/theme';
import { INSTRUMENTS, GENRES, SKILL_LEVELS } from '../../src/data/mockData';
import { useAuth } from '../../src/contexts/AuthContext';
import { authService } from '../../src/services/authService';

export default function ProfileScreen() {
    const { user, profile, isAuthenticated } = useAuth();

    // 🛡️ 認証チェック（二重防御：タブレイアウトでもチェック済み）
    if (!isAuthenticated || !user) {
        router.replace('/auth/login');
        return null;
    }

    // プロフィールデータ（Supabaseから取得、なければデフォルト値）
    const displayProfile = {
        name: profile?.name || user.user_metadata?.name || 'ユーザー',
        age: profile?.age || null,
        location: profile?.location || '未設定',
        bio: profile?.bio || '自己紹介を追加しましょう',
        instruments: profile?.instruments || [],
        genres: profile?.genres || [],
        skillLevel: (profile?.skill_level || 'beginner') as 'beginner' | 'intermediate' | 'advanced' | 'professional',
        imageUrl: profile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop',
        isPremium: profile?.is_premium || false,
    };

    const handleLogout = () => {
        Alert.alert(
            'ログアウト',
            'ログアウトしますか？',
            [
                { text: 'キャンセル', style: 'cancel' },
                {
                    text: 'ログアウト',
                    style: 'destructive',
                    onPress: async () => {
                        await authService.signOut();
                        router.replace('/auth/login');
                    },
                },
            ]
        );
    };

    const userInstruments = displayProfile.instruments
        .map((id) => INSTRUMENTS.find((i) => i.id === id))
        .filter(Boolean);
    const userGenres = displayProfile.genres
        .map((id) => GENRES.find((g) => g.id === id))
        .filter(Boolean);
    const skillLevel = SKILL_LEVELS.find((s) => s.id === displayProfile.skillLevel);

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[Colors.background, Colors.backgroundSecondary]}
                style={StyleSheet.absoluteFill}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>プロフィール</Text>
                    <TouchableOpacity style={styles.settingsButton}>
                        <Ionicons name="settings-outline" size={24} color={Colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Profile card */}
                <View style={styles.profileCard}>
                    <LinearGradient
                        colors={[Colors.primary + '15', Colors.secondary + '15']}
                        style={styles.profileCardGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        {/* Avatar */}
                        <View style={styles.avatarSection}>
                            <View style={styles.avatarContainer}>
                                <LinearGradient
                                    colors={[Colors.primary, Colors.secondary]}
                                    style={styles.avatarBorder}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <Image
                                        source={{ uri: displayProfile.imageUrl }}
                                        style={styles.avatar}
                                    />
                                </LinearGradient>
                                <TouchableOpacity style={styles.editAvatarButton}>
                                    <Ionicons name="camera" size={14} color="#fff" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.nameSection}>
                                <View style={styles.nameRow}>
                                    <Text style={styles.name}>{displayProfile.name}</Text>
                                    {displayProfile.age && <Text style={styles.age}>{displayProfile.age}</Text>}
                                </View>
                                <View style={styles.locationRow}>
                                    <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
                                    <Text style={styles.location}>{displayProfile.location}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Stats */}
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>-</Text>
                                <Text style={styles.statLabel}>いいね</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>-</Text>
                                <Text style={styles.statLabel}>マッチ</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <View style={styles.lockedStat}>
                                    <Ionicons name="lock-closed" size={14} color={Colors.gold} />
                                    <Text style={[styles.statNumber, { color: Colors.gold }]}>?</Text>
                                </View>
                                <Text style={styles.statLabel}>閲覧数</Text>
                            </View>
                        </View>
                    </LinearGradient>
                </View>

                {/* Premium CTA */}
                {!displayProfile.isPremium && (
                    <TouchableOpacity
                        style={styles.premiumCTA}
                        activeOpacity={0.8}
                        onPress={() => router.push('/premium')}
                    >
                        <LinearGradient
                            colors={[Colors.goldGradientStart, Colors.goldGradientEnd]}
                            style={styles.premiumGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Ionicons name="star" size={24} color="#fff" />
                            <View style={styles.premiumTextContainer}>
                                <Text style={styles.premiumTitle}>BandLink Premium</Text>
                                <Text style={styles.premiumSubtitle}>
                                    無制限スワイプ・プロフィールブーストを解放
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
                        </LinearGradient>
                    </TouchableOpacity>
                )}

                {/* Bio */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>自己紹介</Text>
                        <TouchableOpacity>
                            <Ionicons name="pencil" size={16} color={Colors.primary} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.bioText}>{displayProfile.bio}</Text>
                </View>

                {/* Instruments */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>担当楽器</Text>
                        <TouchableOpacity>
                            <Ionicons name="pencil" size={16} color={Colors.primary} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.tagRow}>
                        {userInstruments.map((inst) => (
                            <View key={inst!.id} style={styles.instrumentTag}>
                                <Text style={styles.tagEmoji}>{inst!.icon}</Text>
                                <Text style={styles.tagLabel}>{inst!.label}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Genres */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>好きなジャンル</Text>
                        <TouchableOpacity>
                            <Ionicons name="pencil" size={16} color={Colors.primary} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.tagRow}>
                        {userGenres.map((genre) => (
                            <View
                                key={genre!.id}
                                style={[styles.genreTag, { backgroundColor: genre!.color + '20' }]}
                            >
                                <Text style={[styles.genreLabel, { color: genre!.color }]}>
                                    {genre!.label}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Skill Level */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>スキルレベル</Text>
                        <TouchableOpacity>
                            <Ionicons name="pencil" size={16} color={Colors.primary} />
                        </TouchableOpacity>
                    </View>
                    {skillLevel && (
                        <View style={styles.skillCard}>
                            <Text style={styles.skillEmoji}>{skillLevel.icon}</Text>
                            <View>
                                <Text style={styles.skillName}>{skillLevel.label}</Text>
                                <Text style={styles.skillDesc}>{skillLevel.description}</Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Actions */}
                <View style={styles.actionsSection}>
                    <TouchableOpacity style={styles.actionItem}>
                        <Ionicons name="share-outline" size={20} color={Colors.text} />
                        <Text style={styles.actionText}>プロフィールを共有</Text>
                        <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionItem}>
                        <Ionicons name="help-circle-outline" size={20} color={Colors.text} />
                        <Text style={styles.actionText}>ヘルプ＆サポート</Text>
                        <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionItem} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={20} color={Colors.error} />
                        <Text style={[styles.actionText, { color: Colors.error }]}>ログアウト</Text>
                        <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
                    </TouchableOpacity>
                </View>

                <Text style={styles.version}>BandLink v1.0.0</Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        paddingBottom: 120,
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
    settingsButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileCard: {
        marginHorizontal: Spacing.lg,
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
        marginBottom: Spacing.lg,
    },
    profileCardGradient: {
        padding: Spacing.lg,
        gap: Spacing.lg,
    },
    avatarSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.lg,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatarBorder: {
        width: 88,
        height: 88,
        borderRadius: 44,
        padding: 3,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatar: {
        width: 82,
        height: 82,
        borderRadius: 41,
        borderWidth: 2,
        borderColor: Colors.background,
    },
    editAvatarButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: Colors.background,
    },
    nameSection: {
        flex: 1,
        gap: 4,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: Spacing.sm,
    },
    name: {
        fontSize: FontSize.xxl,
        fontWeight: '800',
        color: Colors.text,
    },
    age: {
        fontSize: FontSize.lg,
        color: Colors.textSecondary,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    location: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: BorderRadius.lg,
        paddingVertical: Spacing.md,
    },
    statItem: {
        alignItems: 'center',
        gap: 4,
    },
    statNumber: {
        fontSize: FontSize.xl,
        fontWeight: '800',
        color: Colors.text,
    },
    statLabel: {
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: Colors.surfaceBorder,
    },
    lockedStat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    premiumCTA: {
        marginHorizontal: Spacing.lg,
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        marginBottom: Spacing.xl,
        ...Shadow.md,
    },
    premiumGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        gap: Spacing.md,
    },
    premiumTextContainer: {
        flex: 1,
    },
    premiumTitle: {
        fontSize: FontSize.lg,
        fontWeight: '800',
        color: '#fff',
    },
    premiumSubtitle: {
        fontSize: FontSize.xs,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
    },
    section: {
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: Colors.text,
    },
    bioText: {
        fontSize: FontSize.md,
        color: Colors.textSecondary,
        lineHeight: 24,
    },
    tagRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    instrumentTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.primary + '20',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: Colors.primary + '30',
    },
    tagEmoji: {
        fontSize: 16,
    },
    tagLabel: {
        fontSize: FontSize.sm,
        fontWeight: '600',
        color: Colors.primaryLight,
    },
    genreTag: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: BorderRadius.full,
    },
    genreLabel: {
        fontSize: FontSize.sm,
        fontWeight: '600',
    },
    skillCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        backgroundColor: Colors.surface,
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
    },
    skillEmoji: {
        fontSize: 28,
    },
    skillName: {
        fontSize: FontSize.md,
        fontWeight: '700',
        color: Colors.text,
    },
    skillDesc: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    actionsSection: {
        marginHorizontal: Spacing.lg,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
        overflow: 'hidden',
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        padding: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.surfaceBorder,
    },
    actionText: {
        flex: 1,
        fontSize: FontSize.md,
        color: Colors.text,
    },
    version: {
        textAlign: 'center',
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
        marginTop: Spacing.xl,
    },
});
