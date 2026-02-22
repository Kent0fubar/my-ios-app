import React, { useState, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    ActivityIndicator,
    Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withSequence,
    withTiming,
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
import { locationService } from '../../src/services/locationService';
import { Profile } from '../../src/types/database';
import { Modal, Alert } from 'react-native';
import { log } from '../../src/lib/logger';
import { INSTRUMENTS, GENRES, SKILL_LEVELS } from '../../src/data/mockData';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';
import { Badge } from '../../src/components/common/Badge';
import { EmptyState } from '../../src/components/common/EmptyState';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.45;
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop';

const SPRING_CONFIG = {
    damping: 20,
    stiffness: 200,
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
};

export type SwipeCardRef = {
    swipeLeft: () => void;
    swipeRight: () => void;
    swipeUp: () => void;
};

const SwipeCard = forwardRef(({
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
}, ref) => {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const cardScale = useSharedValue(1);

    useImperativeHandle(ref, () => ({
        swipeLeft: () => {
            translateX.value = withSpring(-width * 1.5, SPRING_CONFIG, (finished) => {
                if (finished) runOnJS(onSwipeLeft)();
            });
        },
        swipeRight: () => {
            // マッチタブ（画面下部やや左）に向かって飛んでいく演出
            translateX.value = withTiming(-width * 0.15, { duration: 300 });
            translateY.value = withTiming(height / 2, { duration: 300 });
            cardScale.value = withTiming(0.1, { duration: 300 }, (finished) => {
                if (finished) runOnJS(onSwipeRight)();
            });
        },
        swipeUp: () => {
            translateY.value = withSpring(-height, SPRING_CONFIG, (finished) => {
                if (finished) runOnJS(onSuperLike)();
            });
        },
    }));

    // バッジやタグ用の固定背景色（可読性重視）
    const badgeBackground = 'rgba(255, 255, 255, 0.15)';
    const badgeText = Colors.text;

    const panGesture = Gesture.Pan()
        .enabled(isFirst)
        .onUpdate((event) => {
            translateX.value = event.translationX;
            translateY.value = event.translationY;
        })
        .onEnd((event) => {
            if (event.translationX > SWIPE_THRESHOLD || event.velocityX > 800) {
                // LIKE (マッチタブに向かって飛んでいく)
                translateX.value = withTiming(-width * 0.15, { duration: 300 });
                translateY.value = withTiming(height / 2, { duration: 300 });
                cardScale.value = withTiming(0.1, { duration: 300 }, (finished) => {
                    if (finished) runOnJS(onSwipeRight)();
                });
            } else if (event.translationX < -SWIPE_THRESHOLD || event.velocityX < -800) {
                // NOPE
                translateX.value = withSpring(-width * 1.5, SPRING_CONFIG, (finished) => {
                    if (finished) runOnJS(onSwipeLeft)();
                });
            } else if (event.translationY < -150 || event.velocityY < -1000) {
                // SUPER LIKE
                translateY.value = withSpring(-height, SPRING_CONFIG, (finished) => {
                    if (finished) runOnJS(onSuperLike)();
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

        const scale = isFirst ? cardScale.value : interpolate(
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
                <View style={styles.cardInner}>
                    <View style={{ flex: 1, width: '100%', position: 'relative' }}>
                        <Image
                            source={{ uri: user.avatar_url || DEFAULT_AVATAR }}
                            style={styles.cardImage}
                            contentFit="cover"
                            transition={200}
                        />
                        {/* 画像の下部境界をぼかしてテキストエリアに完全に溶け込ませるためのグラデーション */}
                        <LinearGradient
                            colors={['transparent', Colors.card]}
                            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 }}
                        />
                    </View>

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
                        <Badge
                            label="PRO"
                            icon="star"
                            variant="premium"
                            style={styles.premiumBadge}
                        />
                    )}

                    {user.matchScore !== undefined && user.matchScore > 0 && (
                        <LinearGradient
                            colors={[Colors.primary, Colors.secondary]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.matchScoreBadge}
                        >
                            <Ionicons name="sparkles" size={12} color="#fff" />
                            <Text style={styles.matchScoreText}>{user.matchScore}% Match</Text>
                        </LinearGradient>
                    )}

                    <View style={[styles.cardContent]}>
                        <View style={styles.nameRow}>
                            <Text style={styles.userName}>{user.name}</Text>
                            {user.age && (
                                <Text style={styles.userAge}>{user.age}</Text>
                            )}
                            {user.is_verified && (
                                <Ionicons name="checkmark-circle" size={20} color={Colors.accent} />
                            )}
                            {(user.location || user.distance !== undefined) && (
                                <View style={styles.locationContainer}>
                                    <Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
                                    <Text style={styles.locationText}>
                                        {`${user.location || '不明'}${user.distance !== undefined ? ` • ${user.distance.toFixed(1)}km` : ''}`}
                                    </Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.infoRow}>

                            {user.skill_level && (
                                <Badge
                                    label={SKILL_LEVELS.find(s => s.id === user.skill_level)?.label || user.skill_level.toUpperCase()}
                                    variant="primary"
                                    backgroundColor={badgeBackground}
                                />
                            )}
                        </View>

                        <View style={styles.tagRow}>
                            {user.instruments?.slice(0, 3).map((instIdOrLabel) => {
                                const instData = INSTRUMENTS.find(i => i.id === instIdOrLabel || i.label === instIdOrLabel);
                                return (
                                    <InstrumentTag
                                        key={instIdOrLabel}
                                        icon={instData?.icon || 'custom'}
                                        label={instData?.label || instIdOrLabel}
                                        backgroundColor={badgeBackground}
                                    />
                                );
                            })}
                        </View>

                        <View style={styles.tagRow}>
                            {user.genres?.slice(0, 4).map((genreIdOrLabel) => {
                                const genreData = GENRES.find(g => g.id === genreIdOrLabel || g.label === genreIdOrLabel);
                                return (
                                    <GenreTag
                                        key={genreIdOrLabel}
                                        label={genreData?.label || genreIdOrLabel}
                                        color={genreData?.color || Colors.primary}
                                        opacity="30"
                                    />
                                );
                            })}
                        </View>

                        <Text style={styles.bio} numberOfLines={2}>
                            {user.bio || '自己紹介はありません'}
                        </Text>
                    </View>
                </View>
            </Animated.View>
        </GestureDetector>
    );
});

export default function DiscoverScreen() {
    const { user: currentUser, profile: myProfile } = useAuth();
    const [discoverUsers, setDiscoverUsers] = useState<(Profile & { matchScore?: number; distance?: number })[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [matchData, setMatchData] = useState<{ matchId: string; opponent: Profile } | null>(null);

    const cardRef = React.useRef<SwipeCardRef>(null);

    // LIKEボタンのアニメーション用
    const globalLikeScale = useSharedValue(1);
    const globalLikeStyle = useAnimatedStyle(() => ({
        transform: [{ scale: globalLikeScale.value }]
    }));

    const fetchUsers = useCallback(async () => {
        if (!currentUser) return;
        setIsLoading(true);
        try {
            // 位置情報の取得は並行して行い、完了を待たずに検索を開始する（既存のプロフィール情報を優先）
            // これによりGPS取得で画面が止まるのを防ぐ
            const lat = myProfile?.latitude || undefined;
            const lon = myProfile?.longitude || undefined;

            // 非同期で位置情報を更新（バックグラウンドで実行）
            locationService.updateProfileLocation(currentUser.id).catch(err => {
                if (__DEV__) console.warn('[Discover] Background location update failed:', err);
            });

            const users = await discoveryService.getDiscoverUsers(currentUser.id, {
                latitude: lat,
                longitude: lon,
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

        // LIKEの時はボタンをポップさせる
        if (direction === 'like') {
            globalLikeScale.value = withSequence(
                withTiming(1.3, { duration: 150 }),
                withSpring(1, { damping: 8, stiffness: 200 })
            );
        }

        const swipedUser = discoverUsers[currentIndex];
        setCurrentIndex((prev) => prev + 1);

        log.info(`[Discover] Swipe Target -> swiper_id: ${currentUser.id}, swiped_id: ${swipedUser.id}, direction: ${direction}`);

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
        } catch (error: any) {
            log.error('[Discover] Swipe error:', error);
            // エラーの種類に応じてアラート表示
            const isSupabaseError = error?.code || error?.message?.includes('violates');
            Alert.alert(
                'スワイプエラー',
                isSupabaseError
                    ? `データベースのアクセス制限、または既存のスワイプデータとの競合が発生しました。\n詳細: ${error?.message || error?.code}`
                    : `エラーが発生しました。\n詳細: ${error?.message || '不明なエラー'}`
            );
            // 失敗時はカードの位置を戻す等の処理が必要になる場合がありますが、現状はそのまま
        }
    }, [currentUser, discoverUsers, currentIndex, myProfile]);

    const handleSwipeLeft = () => {
        if (cardRef.current) {
            cardRef.current.swipeLeft();
        } else {
            handleSwipe('nope');
        }
    };

    const handleSwipeRight = () => {
        if (cardRef.current) {
            cardRef.current.swipeRight();
        } else {
            handleSwipe('like');
        }
    };

    const handleSuperLike = () => {
        if (cardRef.current) {
            cardRef.current.swipeUp();
        } else {
            handleSwipe('superlike');
        }
    };

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
        <ScreenContainer>
            <View style={styles.header}>
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../../assets/icon.png')}
                        style={styles.logoImage}
                    />
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
                                    ref={isFirst ? cardRef : null}
                                    user={user}
                                    isFirst={isFirst}
                                    onSwipeLeft={() => handleSwipe('nope')}
                                    onSwipeRight={() => handleSwipe('like')}
                                    onSuperLike={() => handleSwipe('superlike')}
                                />
                            );
                        })
                ) : (
                    <EmptyState
                        emoji="🎵"
                        title="全員チェック済み！"
                        description="新しいミュージシャンが登録されるまでお待ちください"
                        onButtonPress={fetchUsers}
                        buttonText="再読み込み"
                        buttonIcon="refresh"
                    />
                )}
            </View>

            {remainingUsers.length > 0 && (
                <View style={styles.actions}>
                    <Pressable
                        onPress={handleSwipeLeft}
                        style={({ pressed }) => [
                            styles.actionButton,
                            styles.nopeButton,
                            pressed && { backgroundColor: Colors.nope + '33', transform: [{ scale: 0.95 }] },
                        ]}
                    >
                        <Ionicons name="close" size={28} color={Colors.nope} />
                    </Pressable>

                    <Pressable
                        onPress={handleSuperLike}
                        style={({ pressed }) => [
                            styles.actionButton,
                            styles.superLikeButton,
                            pressed && { backgroundColor: Colors.superLike + '33', transform: [{ scale: 0.95 }] },
                        ]}
                    >
                        <Ionicons name="star" size={24} color={Colors.superLike} />
                    </Pressable>

                    <Animated.View style={globalLikeStyle}>
                        <Pressable
                            onPress={handleSwipeRight}
                            style={({ pressed }) => [
                                styles.actionButton,
                                styles.likeButton,
                                pressed && { backgroundColor: Colors.like + '33', transform: [{ scale: 0.95 }] },
                            ]}
                        >
                            <Ionicons name="heart" size={28} color={Colors.like} />
                        </Pressable>
                    </Animated.View>
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
                        colors={[Colors.backgroundTertiary, 'rgba(212, 175, 55, 0.8)']}
                        style={styles.matchModalContent}
                    >
                        <Text style={styles.matchTitle}>It's a Match!</Text>
                        <Text style={styles.matchSub}>新しいセッションの予感...</Text>

                        <View style={styles.matchPhotos}>
                            <Image
                                source={{ uri: myProfile?.avatar_url || DEFAULT_AVATAR }}
                                style={styles.matchAvatarLarge}
                            />
                            <Ionicons name="heart" size={40} color="#fff" />
                            <Image
                                source={{ uri: matchData?.opponent.avatar_url || DEFAULT_AVATAR }}
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
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    // --- Container & Layout ---
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
    logoImage: {
        width: 36,
        height: 36,
        borderRadius: 12,
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

    // --- Card Stack & Base Card ---
    cardStack: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.md,
    },
    card: {
        position: 'absolute',
        width: width - Spacing.md * 2,
        height: height * 0.63,
        justifyContent: 'flex-start',
        backgroundColor: Colors.background,
        borderRadius: 32,
        // 白い影とボーダーの適用
        // 白い影とボーダーの適用（主張を抑えめに設定）
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    cardInner: {
        flex: 1,
        borderRadius: 32,
        overflow: 'hidden', // iOSで影が消えないように内側のViewで画像をクリップ
        backgroundColor: Colors.background,
    },
    cardImage: {
        width: '100%',
        flex: 1,
        resizeMode: 'cover',
        backgroundColor: Colors.card,
    },
    // --- Card Content & Badges ---
    cardContent: {
        padding: Spacing.md,
        paddingHorizontal: Spacing.lg,
        gap: 8,
        backgroundColor: Colors.card, // 上のグラデーションの終点カラーと完全に一致させる
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
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    userAge: {
        fontSize: FontSize.xl,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginLeft: 2,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        marginLeft: 4,
    },
    locationText: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        flexWrap: 'wrap',
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

    // --- Action Buttons ---
    actions: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: Spacing.lg,
        paddingBottom: Spacing.lg,
        paddingTop: Spacing.md,
    },
    actionButton: {
        width: 68,
        height: 68,
        borderRadius: 34,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.1)',
        ...Shadow.lg,
    },
    nopeButton: {
        borderColor: Colors.nope + '66',
    },
    superLikeButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderColor: Colors.superLike + '66',
    },
    likeButton: {
        borderColor: Colors.like + '66',
    },

    // --- Stamps & Badges (Overlay) ---
    matchScoreBadge: {
        position: 'absolute',
        top: 20,
        left: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: BorderRadius.full,
        ...Shadow.md,
    },
    matchScoreText: {
        color: '#fff',
        fontSize: FontSize.xs,
        fontWeight: '900',
        letterSpacing: 0.5,
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

    // --- Empty State ---
    // Badge コンポーネントに統合されたため削除可能ですが、独自のアニメーションなどが必要な場合に備えて予約または削除

    // --- Modal ---
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
