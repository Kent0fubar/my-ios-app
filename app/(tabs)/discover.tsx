import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    Image,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    interpolate,
    Extrapolation,
    runOnJS,
} from 'react-native-reanimated';
import {
    Gesture,
    GestureDetector,
} from 'react-native-gesture-handler';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../../src/theme';
import { InstrumentTag, GenreTag } from '../../src/components/Tag';
import { useAuth } from '../../src/contexts/AuthContext';
import { discoveryService } from '../../src/services/dataService';
import { Profile } from '../../src/types/database';
import { Modal } from 'react-native';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.45;

// スプリングのアニメーション設定（「軽く」感じさせるためにスナップ感を強める）
const SPRING_CONFIG = {
    damping: 20,
    stiffness: 200,
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
};

function SwipeCard({
    user,
    isFirst,
    onSwipeLeft,
    onSwipeRight,
    onSuperLike,
}: {
    user: Profile & { matchScore?: number; distance?: number };
    isFirst: boolean;
    onSwipeLeft: () => void;
    onSwipeRight: () => void;
    onSuperLike: () => void;
}) {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    const panGesture = Gesture.Pan()
        .enabled(isFirst)
        .onUpdate((event) => {
            translateX.value = event.translationX;
            translateY.value = event.translationY;
        })
        .onEnd((event) => {
            if (event.translationX > SWIPE_THRESHOLD || event.velocityX > 800) {
                // LIKE
                translateX.value = withSpring(width * 1.5, SPRING_CONFIG, () => {
                    runOnJS(onSwipeRight)();
                });
            } else if (event.translationX < -SWIPE_THRESHOLD || event.velocityX < -800) {
                // NOPE
                translateX.value = withSpring(-width * 1.5, SPRING_CONFIG, () => {
                    runOnJS(onSwipeLeft)();
                });
            } else if (event.translationY < -150 || event.velocityY < -1000) {
                // SUPER LIKE
                translateY.value = withSpring(-height, SPRING_CONFIG, () => {
                    runOnJS(onSuperLike)();
                });
            } else {
                // Reset
                translateX.value = withSpring(0, SPRING_CONFIG);
                translateY.value = withSpring(0, SPRING_CONFIG);
            }
        });

    const animatedStyle = useAnimatedStyle(() => {
        const rotate = interpolate(
            translateX.value,
            [-width / 2, 0, width / 2],
            [-10, 0, 10],
            Extrapolation.CLAMP
        );

        const scale = isFirst ? 1 : interpolate(
            Math.abs(translateX.value),
            [0, width / 2],
            [0.92, 1],
            Extrapolation.CLAMP
        );

        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { rotate: `${rotate}deg` },
                { scale },
            ],
            zIndex: isFirst ? 10 : 1,
        };
    });

    const likeOpacityStyle = useAnimatedStyle(() => ({
        opacity: interpolate(translateX.value, [10, SWIPE_THRESHOLD / 2], [0, 1], Extrapolation.CLAMP),
    }));

    const nopeOpacityStyle = useAnimatedStyle(() => ({
        opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD / 2, -10], [1, 0], Extrapolation.CLAMP),
    }));

    return (
        <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.card, animatedStyle]}>
                <Image
                    source={user.avatar_url ? { uri: user.avatar_url } : { uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop' }}
                    style={styles.cardImage}
                />

                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
                    locations={[0.3, 0.55, 1]}
                    style={styles.cardGradient}
                />

                {isFirst && (
                    <>
                        <Animated.View style={[styles.stampContainer, styles.likeStamp, likeOpacityStyle]}>
                            <Text style={[styles.stampText, { color: Colors.like }]}>LIKE</Text>
                        </Animated.View>
                        <Animated.View style={[styles.stampContainer, styles.nopeStamp, nopeOpacityStyle]}>
                            <Text style={[styles.stampText, { color: Colors.nope }]}>NOPE</Text>
                        </Animated.View>
                    </>
                )}

                {user.is_premium && (
                    <View style={styles.premiumBadge}>
                        <Ionicons name="star" size={12} color={Colors.gold} />
                        <Text style={styles.premiumText}>PRO</Text>
                    </View>
                )}

                {user.matchScore !== undefined && user.matchScore > 0 && (
                    <View style={[
                        styles.matchScoreBadge,
                        { backgroundColor: user.matchScore >= 60 ? 'rgba(6,214,160,0.9)' : user.matchScore >= 30 ? 'rgba(249,115,22,0.9)' : 'rgba(100,116,139,0.8)' }
                    ]}>
                        <Ionicons name="sparkles" size={12} color="#fff" />
                        <Text style={styles.matchScoreText}>{user.matchScore}%</Text>
                    </View>
                )}

                <View style={styles.cardContent}>
                    <View style={styles.nameRow}>
                        <Text style={styles.userName}>{user.name}</Text>
                        <Text style={styles.userAge}>{user.age ? `, ${user.age}` : ''}</Text>
                        {user.is_verified && (
                            <Ionicons name="checkmark-circle" size={20} color={Colors.accent} />
                        )}
                    </View>

                    <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
                        <Text style={styles.locationText}>
                            {user.location || '不明'} {user.distance ? `• ${user.distance.toFixed(1)}km` : ''}
                        </Text>
                    </View>

                    {user.skill_level && (
                        <View style={styles.skillBadge}>
                            <Text style={styles.skillText}>{user.skill_level.toUpperCase()}</Text>
                        </View>
                    )}

                    <View style={styles.tagRow}>
                        {user.instruments?.slice(0, 3).map((inst) => (
                            <InstrumentTag key={inst} icon="🎸" label={inst} />
                        ))}
                    </View>

                    <View style={styles.tagRow}>
                        {user.genres?.slice(0, 4).map((genre) => (
                            <GenreTag key={genre} label={genre} color={Colors.primary} opacity="30" />
                        ))}
                    </View>

                    <Text style={styles.bio} numberOfLines={2}>
                        {user.bio || '自己紹介はありません'}
                    </Text>
                </View>
            </Animated.View>
        </GestureDetector>
    );
}

export default function DiscoverScreen() {
    const { user: currentUser, profile: myProfile } = useAuth();
    const [discoverUsers, setDiscoverUsers] = useState<(Profile & { matchScore?: number; distance?: number })[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [matchData, setMatchData] = useState<{ matchId: string; opponent: Profile } | null>(null);

    const fetchUsers = useCallback(async () => {
        if (!currentUser) return;
        setIsLoading(true);
        try {
            const users = await discoveryService.getDiscoverUsers(currentUser.id, {
                latitude: myProfile?.latitude || undefined,
                longitude: myProfile?.longitude || undefined,
            });
            setDiscoverUsers(users);
            setCurrentIndex(0);
        } catch (error) {
            console.error('[Discover] Fetch users error:', error);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser, myProfile]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleSwipe = useCallback(async (direction: 'like' | 'nope' | 'superlike') => {
        if (!currentUser || currentIndex >= discoverUsers.length) return;

        const swipedUser = discoverUsers[currentIndex];
        setCurrentIndex((prev) => prev + 1);

        try {
            const result = await discoveryService.swipe(
                currentUser.id,
                swipedUser.id,
                direction,
                myProfile?.is_premium || false
            );

            if (result.matched && result.matchId) {
                setMatchData({
                    matchId: result.matchId,
                    opponent: swipedUser
                });
            }
        } catch (error) {
            console.error('[Discover] Swipe error:', error);
        }
    }, [currentUser, discoverUsers, currentIndex, myProfile]);

    const handleSwipeLeft = () => handleSwipe('nope');
    const handleSwipeRight = () => handleSwipe('like');
    const handleSuperLike = () => handleSwipe('superlike');

    const remainingUsers = discoverUsers.slice(currentIndex);

    if (isLoading && currentIndex === 0) {
        return (
            <View style={styles.loadingContainer}>
                <LinearGradient colors={[Colors.background, Colors.backgroundSecondary]} style={StyleSheet.absoluteFill} />
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[Colors.background, Colors.backgroundSecondary]}
                style={StyleSheet.absoluteFill}
            />

            <View style={styles.header}>
                <View style={styles.logoContainer}>
                    <LinearGradient
                        colors={[Colors.primary, Colors.secondary]}
                        style={styles.logoGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Ionicons name="musical-notes" size={20} color="#fff" />
                    </LinearGradient>
                    <Text style={styles.logoText}>BandLink</Text>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => router.push('/premium')}
                    >
                        <LinearGradient
                            colors={[Colors.goldGradientStart, Colors.goldGradientEnd]}
                            style={styles.premiumButton}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Ionicons name="star" size={16} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerButton} onPress={() => fetchUsers()}>
                        <Ionicons name="refresh" size={22} color={Colors.textSecondary} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.cardStack}>
                {remainingUsers.length > 0 ? (
                    remainingUsers
                        .slice(0, 3)
                        .reverse()
                        .map((user, index) => {
                            const isFirst = index === Math.min(remainingUsers.length, 3) - 1;
                            return (
                                <SwipeCard
                                    key={user.id}
                                    user={user}
                                    isFirst={isFirst}
                                    onSwipeLeft={handleSwipeLeft}
                                    onSwipeRight={handleSwipeRight}
                                    onSuperLike={handleSuperLike}
                                />
                            );
                        })
                ) : (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyEmoji}>🎵</Text>
                        <Text style={styles.emptyTitle}>全員チェック済み！</Text>
                        <Text style={styles.emptyText}>
                            新しいミュージシャンが登録されるまでお待ちください
                        </Text>
                        <TouchableOpacity
                            onPress={fetchUsers}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={[Colors.primary, Colors.secondary]}
                                style={styles.resetButton}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Ionicons name="refresh" size={18} color="#fff" />
                                <Text style={styles.resetText}>再読み込み</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {remainingUsers.length > 0 && (
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.nopeButton]}
                        onPress={handleSwipeLeft}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="close" size={28} color={Colors.nope} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.superLikeButton]}
                        onPress={handleSuperLike}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="star" size={24} color={Colors.superLike} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.likeButton]}
                        onPress={handleSwipeRight}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="heart" size={28} color={Colors.like} />
                    </TouchableOpacity>
                </View>
            )}

            {/* Match Modal */}
            <Modal
                visible={!!matchData}
                transparent
                animationType="fade"
            >
                <View style={styles.modalOverlay}>
                    <LinearGradient
                        colors={['rgba(139, 92, 246, 0.95)', 'rgba(236, 72, 153, 0.95)']}
                        style={styles.matchModalContent}
                    >
                        <Text style={styles.matchTitle}>It's a Match!</Text>
                        <Text style={styles.matchSub}>新しいセッションの予感...</Text>

                        <View style={styles.matchPhotos}>
                            <Image
                                source={myProfile?.avatar_url ? { uri: myProfile.avatar_url } : { uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop' }}
                                style={styles.matchAvatarLarge}
                            />
                            <Ionicons name="heart" size={40} color="#fff" />
                            <Image
                                source={matchData?.opponent.avatar_url ? { uri: matchData.opponent.avatar_url } : { uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop' }}
                                style={styles.matchAvatarLarge}
                            />
                        </View>

                        <Text style={styles.matchInfoText}>{matchData?.opponent.name}さんとマッチしました</Text>

                        <TouchableOpacity
                            style={styles.chatNowButton}
                            onPress={() => {
                                const id = matchData?.opponent.id;
                                setMatchData(null);
                                router.push(`/chat/${id}`);
                            }}
                        >
                            <Text style={styles.chatNowText}>メッセージを送る</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.keepSwipingButton}
                            onPress={() => setMatchData(null)}
                        >
                            <Text style={styles.keepSwipingText}>ディスカバリーを続ける</Text>
                        </TouchableOpacity>
                    </LinearGradient>
                </View>
            </Modal>
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
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    logoGradient: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoText: {
        fontSize: FontSize.xl,
        fontWeight: '800',
        color: Colors.text,
    },
    headerRight: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    headerButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    premiumButton: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardStack: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.md,
    },
    card: {
        position: 'absolute',
        width: width - Spacing.md * 2,
        height: height * 0.62,
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        backgroundColor: Colors.card,
        ...Shadow.lg,
    },
    cardImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    cardGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '70%',
    },
    stampContainer: {
        position: 'absolute',
        top: 50,
        zIndex: 10,
        borderWidth: 4,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
    },
    likeStamp: {
        left: 20,
        borderColor: Colors.like,
        transform: [{ rotate: '-15deg' }],
    },
    nopeStamp: {
        right: 20,
        borderColor: Colors.nope,
        transform: [{ rotate: '15deg' }],
    },
    stampText: {
        fontSize: FontSize.xxxl,
        fontWeight: '900',
        letterSpacing: 4,
    },
    premiumBadge: {
        position: 'absolute',
        top: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: Colors.gold + '40',
    },
    premiumText: {
        color: Colors.gold,
        fontSize: FontSize.xs,
        fontWeight: '700',
    },
    cardContent: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: Spacing.lg,
        gap: Spacing.sm,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    userName: {
        fontSize: FontSize.xxl,
        fontWeight: '800',
        color: Colors.text,
    },
    userAge: {
        fontSize: FontSize.xl,
        fontWeight: '400',
        color: Colors.textSecondary,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    locationText: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
    },
    skillBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
    },
    skillEmoji: {
        fontSize: 12,
    },
    skillText: {
        fontSize: FontSize.xs,
        color: Colors.text,
        fontWeight: '600',
    },
    tagRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    bio: {
        fontSize: FontSize.sm,
        color: 'rgba(255,255,255,0.8)',
        lineHeight: 20,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: Spacing.lg,
        paddingBottom: Spacing.lg,
        paddingTop: Spacing.md,
    },
    actionButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.card,
        borderWidth: 1,
        ...Shadow.md,
    },
    nopeButton: {
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    superLikeButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderColor: 'rgba(59, 130, 246, 0.3)',
    },
    likeButton: {
        borderColor: 'rgba(6, 214, 160, 0.3)',
    },
    emptyState: {
        alignItems: 'center',
        gap: Spacing.md,
    },
    emptyEmoji: {
        fontSize: 64,
    },
    emptyTitle: {
        fontSize: FontSize.xxl,
        fontWeight: '700',
        color: Colors.text,
    },
    emptyText: {
        fontSize: FontSize.md,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
    },
    resetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: 14,
        paddingHorizontal: 28,
        borderRadius: BorderRadius.xl,
        marginTop: Spacing.md,
    },
    resetText: {
        color: Colors.text,
        fontSize: FontSize.md,
        fontWeight: '700',
    },
    matchScoreBadge: {
        position: 'absolute',
        top: 16,
        left: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: BorderRadius.full,
    },
    matchScoreText: {
        color: '#fff',
        fontSize: FontSize.sm,
        fontWeight: '800',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    matchModalContent: {
        width: width * 0.85,
        padding: Spacing.xl,
        borderRadius: BorderRadius.xl,
        alignItems: 'center',
        gap: Spacing.lg,
    },
    matchTitle: {
        fontSize: 40,
        fontWeight: '900',
        color: '#fff',
        fontStyle: 'italic',
    },
    matchSub: {
        fontSize: FontSize.md,
        color: '#fff',
        opacity: 0.9,
    },
    matchPhotos: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
        marginVertical: Spacing.lg,
    },
    matchAvatarLarge: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: '#fff',
    },
    matchInfoText: {
        color: '#fff',
        fontSize: FontSize.md,
        fontWeight: '600',
        textAlign: 'center',
    },
    chatNowButton: {
        backgroundColor: '#fff',
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: BorderRadius.full,
        width: '100%',
        alignItems: 'center',
        marginTop: Spacing.md,
    },
    chatNowText: {
        color: Colors.primary,
        fontSize: FontSize.md,
        fontWeight: '700',
    },
    keepSwipingButton: {
        paddingVertical: 10,
    },
    keepSwipingText: {
        color: '#fff',
        fontSize: FontSize.sm,
        fontWeight: '500',
        opacity: 0.8,
    },
});
