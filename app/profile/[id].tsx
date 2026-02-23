import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../../src/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { profileService, reportService, moderationService } from '../../src/services/dataService';
import { InstrumentTag, GenreTag } from '../../src/components/Tag';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';

const { width } = Dimensions.get('window');

export default function PublicProfileScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user: currentUser } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!id || !currentUser) return;

        const fetchProfile = async () => {
            try {
                const data = await profileService.getProfile(id, currentUser.id);
                setProfile(data);
            } catch (error) {
                console.error('[PublicProfile] Fetch error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [id, currentUser]);

    const handleMoreOptions = () => {
        Alert.alert(
            'ユーザー設定',
            'このユーザーに対してどのアクションを行いますか？',
            [
                { text: '通報する', style: 'destructive', onPress: handleReport },
                { text: 'ブロック・マッチ解除', style: 'destructive', onPress: confirmBlock },
                { text: 'キャンセル', style: 'cancel' },
            ]
        );
    };

    const handleReport = () => {
        Alert.alert(
            '通報理由を選択',
            '通報の理由を選んでください。',
            [
                { text: '不適切な発言', onPress: () => submitReport('inappropriate_language') },
                { text: '嫌がらせ・ストーカー', onPress: () => submitReport('harassment') },
                { text: 'なりすまし', onPress: () => submitReport('impersonation') },
                { text: 'その他', onPress: () => submitReport('other') },
                { text: 'キャンセル', style: 'cancel' },
            ]
        );
    };

    const submitReport = async (reason: string) => {
        if (!currentUser || !id) return;
        try {
            await reportService.reportUser(currentUser.id, id, reason);
            Alert.alert('送信完了', '通報ありがとうございます。運営チームが内容を確認いたします。');
        } catch (error: any) {
            const errorMsg = error.message || '送信に失敗しました。';
            Alert.alert('エラー', errorMsg);
        }
    };

    const confirmBlock = () => {
        Alert.alert(
            'ブロックの確認',
            'このユーザーをブロックしてマッチを解除しますか？この操作は取り消せません。',
            [
                { text: 'キャンセル', style: 'cancel' },
                {
                    text: 'ブロックする',
                    style: 'destructive',
                    onPress: async () => {
                        if (!currentUser || !id) return;
                        try {
                            await moderationService.blockUser(currentUser.id, id);
                            Alert.alert('完了', 'ユーザーをブロックしました。');
                            router.replace('/(tabs)/matches');
                        } catch (error: any) {
                            const errorMsg = error.message || 'ブロックに失敗しました。';
                            Alert.alert('エラー', errorMsg);
                        }
                    }
                },
            ]
        );
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (!profile) {
        return (
            <ScreenContainer>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>ユーザーが見つかりませんでした</Text>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Text style={styles.backButtonText}>戻る</Text>
                    </TouchableOpacity>
                </View>
            </ScreenContainer>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                {/* Hero Image Section */}
                <View style={styles.heroSection}>
                    <Image
                        source={profile.avatar_url ? { uri: profile.avatar_url } : { uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=800&h=800&fit=crop' }}
                        style={styles.heroImage}
                        contentFit="cover"
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(26,26,30,0.8)', Colors.background]}
                        style={styles.heroGradient}
                    />

                    {/* Header Overlay */}
                    <View style={styles.headerOverlay}>
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => router.back()}
                        >
                            <Ionicons name="chevron-back" size={28} color={Colors.text} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={handleMoreOptions}
                        >
                            <Ionicons name="ellipsis-vertical" size={24} color={Colors.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Basic Info Overlay */}
                    <View style={styles.basicInfoOverlay}>
                        <View style={styles.nameRow}>
                            <Text style={styles.nameText}>{profile.name}, {profile.age}</Text>
                            {profile.is_verified && (
                                <Ionicons name="checkmark-circle" size={24} color={Colors.accent} />
                            )}
                        </View>
                        <View style={styles.locationRow}>
                            <Ionicons name="location-sharp" size={16} color={Colors.textSecondary} />
                            <Text style={styles.locationText}>{profile.location}</Text>
                        </View>
                    </View>
                </View>

                {/* Content Section */}
                <View style={styles.content}>
                    {/* Bio */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>自己紹介</Text>
                        <Text style={styles.bioText}>{profile.bio || '自己紹介文はまだありません。'}</Text>
                    </View>

                    {/* Instruments */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>担当楽器</Text>
                        <View style={styles.tagContainer}>
                            {profile.instruments?.map((inst: string, index: number) => (
                                <InstrumentTag key={index} icon={inst} label={inst} />
                            ))}
                        </View>
                    </View>

                    {/* Genres */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>好きなジャンル</Text>
                        <View style={styles.tagContainer}>
                            {profile.genres?.map((genre: string, index: number) => (
                                <GenreTag key={index} label={genre} color={Colors.primary} />
                            ))}
                        </View>
                    </View>

                    {/* Additional Details */}
                    <View style={styles.detailsGrid}>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>スキルレベル</Text>
                            <Text style={styles.detailValue}>
                                {profile.skill_level === 'beginner' ? '初心者' :
                                    profile.skill_level === 'intermediate' ? '中級者' :
                                        profile.skill_level === 'advanced' ? '上級者' :
                                            profile.skill_level === 'professional' ? 'プロフェッショナル' : '未設定'}
                            </Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>募集内容</Text>
                            <Text style={styles.detailValue}>
                                {profile.looking_for?.join(', ') || '未設定'}
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.chatButton}
                        onPress={() => router.back()}
                    >
                        <LinearGradient
                            colors={[Colors.primary, Colors.secondary]}
                            style={styles.chatButtonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Ionicons name="chatbubbles" size={20} color="#fff" />
                            <Text style={styles.chatButtonText}>チャットに戻る</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={{ height: 60 }} />
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
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    errorText: {
        fontSize: FontSize.lg,
        color: Colors.textSecondary,
        marginBottom: Spacing.lg,
    },
    backButton: {
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.surface,
    },
    backButtonText: {
        color: Colors.primary,
        fontWeight: '700',
    },
    heroSection: {
        width: width,
        height: width * 1.25,
        position: 'relative',
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    heroGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50%',
    },
    headerOverlay: {
        position: 'absolute',
        top: 50,
        left: Spacing.lg,
        right: Spacing.lg,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    basicInfoOverlay: {
        position: 'absolute',
        bottom: Spacing.xl,
        left: Spacing.lg,
        right: Spacing.lg,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 4,
    },
    nameText: {
        fontSize: 32,
        fontWeight: '800',
        color: '#fff',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    locationText: {
        fontSize: FontSize.md,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    content: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
    },
    section: {
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        fontSize: FontSize.lg,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: Spacing.md,
    },
    bioText: {
        fontSize: FontSize.md,
        color: Colors.textSecondary,
        lineHeight: 24,
    },
    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    detailsGrid: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginBottom: Spacing.xxl,
    },
    detailItem: {
        flex: 1,
        backgroundColor: Colors.card,
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
    },
    detailLabel: {
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
        marginBottom: 4,
        textTransform: 'uppercase',
        fontWeight: '700',
    },
    detailValue: {
        fontSize: FontSize.sm,
        color: Colors.text,
        fontWeight: '600',
    },
    chatButton: {
        width: '100%',
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        ...Shadow.md,
    },
    chatButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        gap: 10,
    },
    chatButtonText: {
        color: '#fff',
        fontSize: width < 380 ? FontSize.md : FontSize.lg,
        fontWeight: '800',
    },
});
