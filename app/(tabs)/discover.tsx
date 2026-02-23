import React, { useState, useCallback, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    ActivityIndicator,
    Pressable,
    ScrollView,
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
    ReduceMotion,
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
import { ActionModal } from '../../src/components/common/ActionModal';
import { LocationData } from '../../src/services/locationService';
import { purchaseService } from '../../src/services/purchaseService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.45;
const DAILY_SWIPE_LIMIT = 30;
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop';

const SPRING_CONFIG = {
    damping: 20,
    stiffness: 200,
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
    reduceMotion: ReduceMotion.Never,
};

export type SwipeCardRef = {
    swipeLeft: () => void;
    swipeRight: () => void;
    swipeUp: () => void;
};

const SwipeCard = forwardRef(({
    user,
    isFirst,
    isSwipeDisabled,
    onLimitReached,
    onSwipeLeft,
    onSwipeRight,
    onSuperLike,
}: {
    user: Profile & { matchScore?: number; distance?: number };
    isFirst: boolean;
    isSwipeDisabled: boolean;
    onLimitReached: () => void;
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
            translateX.value = withTiming(-width * 0.15, { duration: 300, reduceMotion: ReduceMotion.Never });
            translateY.value = withTiming(height / 2, { duration: 300, reduceMotion: ReduceMotion.Never });
            cardScale.value = withTiming(0.1, { duration: 300, reduceMotion: ReduceMotion.Never }, (finished) => {
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
            if (isSwipeDisabled) {
                // 制限到達時は少しだけ動かせるが重くする
                translateX.value = event.translationX * 0.15;
                translateY.value = event.translationY * 0.15;
                return;
            }
            translateX.value = event.translationX;
            translateY.value = event.translationY;
        })
        .onEnd((event) => {
            if (isSwipeDisabled) {
                translateX.value = withSpring(0, SPRING_CONFIG);
                translateY.value = withSpring(0, SPRING_CONFIG);
                runOnJS(onLimitReached)();
                return;
            }
            if (event.translationX > SWIPE_THRESHOLD || event.velocityX > 800) {
                // LIKE (マッチタブに向かって飛んでいく)
                translateX.value = withTiming(-width * 0.15, { duration: 300, reduceMotion: ReduceMotion.Never });
                translateY.value = withTiming(height / 2, { duration: 300, reduceMotion: ReduceMotion.Never });
                cardScale.value = withTiming(0.1, { duration: 300, reduceMotion: ReduceMotion.Never }, (finished) => {
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

    const superLikeOpacityStyle = useAnimatedStyle(() => ({
        opacity: interpolate(translateY.value, [-120, -40], [1, 0], Extrapolation.CLAMP),
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
                            <Animated.View style={[styles.stampContainer, styles.superLikeStamp, superLikeOpacityStyle]}>
                                <Text style={[styles.stampText, { color: Colors.superLike }]}>SUPER LIKE</Text>
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
    const { user: currentUser, profile: myProfile, refreshProfile } = useAuth();
    const [discoverUsers, setDiscoverUsers] = useState<(Profile & { matchScore?: number; distance?: number })[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [matchData, setMatchData] = useState<{ matchId: string; opponent: Profile } | null>(null);
    const [isLocationModalVisible, setLocationModalVisible] = useState(false);
    const [pendingLocationData, setPendingLocationData] = useState<LocationData | null>(null);
    const [locationModalType, setLocationModalType] = useState<'update' | 'initial'>('update');

    // スワイプ制限管理用 state
    const [swipeCount, setSwipeCount] = useState(0);
    const [isPremium, setIsPremium] = useState(false);
    const [limitModalVisible, setLimitModalVisible] = useState(false);
    const [filterLimitModalVisible, setFilterLimitModalVisible] = useState(false);

    // フィルター用 state
    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const [filters, setFilters] = useState<{
        instruments: string[];
        genres: string[];
        radiusKm: number;
    }>({
        instruments: [],
        genres: [],
        radiusKm: 50,
    });

    const cardRef = React.useRef<SwipeCardRef>(null);
    const hasCheckedLocation = React.useRef(false);
    const lastProfileLocation = useRef<string | null>(myProfile?.location || null);

    // LIKEボタンのアニメーション用
    const globalLikeScale = useSharedValue(1);
    const globalLikeStyle = useAnimatedStyle(() => ({
        transform: [{ scale: globalLikeScale.value }]
    }));

    /**
     * 活動拠点と現在地の不一致をチェック
     */
    const checkLocationMismatch = useCallback(async () => {
        if (!currentUser || !myProfile) {
            log.debug('[Discover] Skip check: user or profile missing');
            return false;
        }

        try {
            log.info('[Discover] Starting location check...');
            const currentLocation = await locationService.getCurrentLocation();
            if (!currentLocation) {
                log.warn('[Discover] Could not get current location');
                return false;
            }

            const currentLat = currentLocation.latitude;
            const currentLon = currentLocation.longitude;
            const profileLat = myProfile.latitude;
            const profileLon = myProfile.longitude;

            log.info(`[Discover] Current: ${currentLat}, ${currentLon} | Profile: ${profileLat}, ${profileLon}`);

            if (profileLat && profileLon) {
                const distance = locationService.calculateDistance(
                    profileLat,
                    profileLon,
                    currentLat,
                    currentLon
                );

                log.info(`[Discover] Location mismatch distance: ${distance}km`);

                // 10km以上離れている場合に警告を表示
                if (distance > 10) {
                    setPendingLocationData(currentLocation);
                    setLocationModalType('update');
                    setLocationModalVisible(true);
                }
            } else {
                // 拠点未登録の場合も確認する
                setPendingLocationData(currentLocation);
                setLocationModalType('initial');
                setLocationModalVisible(true);
            }
            return true; // チェック成功
        } catch (err) {
            log.error('[Discover] Location check error:', err);
            return false;
        }
    }, [currentUser, myProfile, refreshProfile]);

    const fetchUsers = useCallback(async (isInitial = false) => {
        if (!currentUser) return;
        setIsLoading(true);
        try {
            // 初回読み込み時かつ未チェックの場合に位置情報を確認
            if (isInitial && !hasCheckedLocation.current && myProfile) {
                checkLocationMismatch().then(success => {
                    if (success) {
                        hasCheckedLocation.current = true;
                    }
                });
            }

            const lat = myProfile?.latitude || undefined;
            const lon = myProfile?.longitude || undefined;

            const users = await discoveryService.getDiscoverUsers(currentUser.id, {
                latitude: lat,
                longitude: lon,
                instruments: isPremium ? filters.instruments : [],
                genres: isPremium ? filters.genres : [],
                radiusKm: isPremium ? filters.radiusKm : undefined,
            });
            setDiscoverUsers(users);
            setCurrentIndex(0);
        } catch (error) {
            console.error('[Discover] Fetch users error:', error);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser, myProfile, checkLocationMismatch]);

    useEffect(() => {
        fetchUsers(true);
    }, [fetchUsers]);

    // プロフィールとスワイプ回数のロード
    const checkSubscriptionAndSwipeCount = useCallback(async () => {
        if (!currentUser) return;
        try {
            const info = await purchaseService.getSubscriptionInfo();
            setIsPremium(info.isActive);

            if (!info.isActive) {
                const today = new Date().toISOString().split('T')[0];
                const key = `swipeCount_${currentUser.id}_${today}`;
                const stored = await AsyncStorage.getItem(key);
                setSwipeCount(stored ? parseInt(stored) : 0);
            }
        } catch (e) {
            console.error('[Discover] Failed to check sub/swipe count', e);
        }
    }, [currentUser]);

    // 画面にフォーカスが戻った際にプロフィールと課金情報を最新化する
    useFocusEffect(
        useCallback(() => {
            refreshProfile();
            checkSubscriptionAndSwipeCount();
        }, [refreshProfile, checkSubscriptionAndSwipeCount])
    );

    // プロフィールの位置情報（文字列）が変わった場合にカードを再取得する
    useEffect(() => {
        if (myProfile?.location !== lastProfileLocation.current) {
            log.info(`[Discover] Location changed from ${lastProfileLocation.current} to ${myProfile?.location}. Refreshing users...`);
            lastProfileLocation.current = myProfile?.location || null;
            fetchUsers(false);
        }
    }, [myProfile?.location, fetchUsers]);

    const handleSwipe = useCallback(async (direction: 'like' | 'nope' | 'superlike') => {
        if (!currentUser || currentIndex >= discoverUsers.length) return;

        // LIKEの時はボタンをポップさせる
        if (direction === 'like') {
            globalLikeScale.value = withSequence(
                withTiming(1.3, { duration: 150 }),
                withSpring(1, { damping: 8, stiffness: 200 })
            );
        }

        if (!isPremium) {
            const newCount = swipeCount + 1;
            setSwipeCount(newCount);
            const today = new Date().toISOString().split('T')[0];
            const key = `swipeCount_${currentUser.id}_${today}`;
            AsyncStorage.setItem(key, newCount.toString());
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
    }, [currentUser, discoverUsers, currentIndex, myProfile, isPremium, swipeCount]);

    const isSwipeDisabled = !isPremium && swipeCount >= DAILY_SWIPE_LIMIT;
    const handleLimitReached = () => {
        setLimitModalVisible(true);
    };

    const handleSwipeLeft = () => {
        if (isSwipeDisabled) { handleLimitReached(); return; }
        if (cardRef.current) {
            cardRef.current.swipeLeft();
        } else {
            handleSwipe('nope');
        }
    };

    const handleSwipeRight = () => {
        if (isSwipeDisabled) { handleLimitReached(); return; }
        if (cardRef.current) {
            cardRef.current.swipeRight();
        } else {
            handleSwipe('like');
        }
    };

    const handleSuperLike = () => {
        if (isSwipeDisabled) { handleLimitReached(); return; }
        if (cardRef.current) {
            cardRef.current.swipeUp();
        } else {
            handleSwipe('superlike');
        }
    };

    const remainingUsers = discoverUsers.slice(currentIndex);

    // Initial loading is now effectively handled by the global LoadingScreen in _layout.tsx
    // But we still want to handle the case where we have no users yet after global loading


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
                        onPress={() => {
                            if (isPremium) {
                                setIsFilterVisible(true);
                            } else {
                                setFilterLimitModalVisible(true);
                            }
                        }}
                    >
                        <Ionicons
                            name="options"
                            size={24}
                            color={isPremium ? Colors.primary : Colors.textTertiary}
                        />
                        {isPremium && (filters.instruments.length > 0 || filters.genres.length > 0) && (
                            <View style={styles.filterBadge} />
                        )}
                    </TouchableOpacity>
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
                                    isSwipeDisabled={isSwipeDisabled}
                                    onLimitReached={handleLimitReached}
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
                            pressed && { backgroundColor: Colors.superLike + '22', transform: [{ scale: 0.95 }] },
                        ]}
                    >
                        <LinearGradient
                            colors={[Colors.superLike + '44', 'transparent']}
                            style={styles.superLikeInner}
                        >
                            <Ionicons name="star" size={26} color={Colors.superLike} />
                        </LinearGradient>
                    </Pressable>

                    <Animated.View style={globalLikeStyle}>
                        <Pressable
                            onPress={handleSwipeRight}
                            style={({ pressed }) => [
                                styles.actionButton,
                                styles.likeButton,
                                pressed && { backgroundColor: Colors.like + '22', transform: [{ scale: 0.95 }] },
                            ]}
                        >
                            <Ionicons name="heart" size={30} color={Colors.like} />
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

            {/* Location Mismatch Modal */}
            <ActionModal
                visible={isLocationModalVisible}
                onClose={() => setLocationModalVisible(false)}
                onConfirm={async () => {
                    setLocationModalVisible(false);
                    setIsLoading(true);
                    try {
                        await locationService.updateProfileLocation(currentUser!.id);
                        await refreshProfile();
                        fetchUsers();
                    } catch (e) {
                        log.error('[Discover] Failed to update location via modal', e);
                    } finally {
                        setIsLoading(false);
                    }
                }}
                title={locationModalType === 'update' ? '活動拠点の更新' : '活動拠点の登録'}
                message={locationModalType === 'update'
                    ? `現在の場所（${pendingLocationData?.displayName}）は、登録されている活動拠点（${myProfile?.location || '不明'}）から離れています。\n\n活動拠点を現在の場所に更新しますか？`
                    : `現在の場所（${pendingLocationData?.displayName}）を活動拠点として登録しますか？`
                }
                confirmText={locationModalType === 'update' ? '更新する' : '登録する'}
                icon="location"
                iconColor={Colors.primary}
            />

            {/* Swipe Limit Modal */}
            <ActionModal
                visible={limitModalVisible}
                onClose={() => setLimitModalVisible(false)}
                onConfirm={() => {
                    setLimitModalVisible(false);
                    router.push('/premium');
                }}
                title="本日の制限に到達しました"
                message={`無料プランでは1日${DAILY_SWIPE_LIMIT}回までのスワイプ制限があります。\n明日の0時になると回数はリセットされます。\n\nBandLink Premiumに加入すると、この制限がなくなり無制限にスワイプできます！`}
                confirmText="Premiumを見る"
                cancelText="閉じる"
                icon="star"
                iconColor={Colors.gold}
            />

            {/* Filter Premium Promotion Modal */}
            <ActionModal
                visible={filterLimitModalVisible}
                onClose={() => setFilterLimitModalVisible(false)}
                onConfirm={() => {
                    setFilterLimitModalVisible(false);
                    router.push('/premium');
                }}
                title="高度なフィルター"
                message="特定の楽器やジャンル、距離を指定してミュージシャンを探せる「高度なフィルター」はPremium限定の機能です。Premiumに加入して、理想のメンバーをより効率的に見つけましょう！"
                confirmText="Premiumの詳細"
                cancelText="閉じる"
                icon="options"
                iconColor={Colors.primary}
            />

            {/* Premium Filter Modal */}
            <Modal
                visible={isFilterVisible}
                animationType="slide"
                transparent={true}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.filterModalContent}>
                        <View style={styles.filterHeader}>
                            <Text style={styles.filterTitle}>高度なフィルター</Text>
                            <TouchableOpacity onPress={() => setIsFilterVisible(false)}>
                                <Ionicons name="close" size={24} color={Colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.filterSection}>
                                <Text style={styles.filterSectionTitle}>検索範囲: {filters.radiusKm}km</Text>
                                <View style={styles.radiusContainer}>
                                    {[10, 30, 50, 100].map((radius) => (
                                        <TouchableOpacity
                                            key={radius}
                                            style={[
                                                styles.radiusOption,
                                                filters.radiusKm === radius && styles.selectedFilterOption
                                            ]}
                                            onPress={() => setFilters(prev => ({ ...prev, radiusKm: radius }))}
                                        >
                                            <Text style={[
                                                styles.radiusText,
                                                filters.radiusKm === radius && styles.selectedFilterText
                                            ]}>{radius}km</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.filterSection}>
                                <Text style={styles.filterSectionTitle}>楽器で絞り込む</Text>
                                <View style={styles.filterTagRow}>
                                    {INSTRUMENTS.map((inst) => (
                                        <TouchableOpacity
                                            key={inst.id}
                                            style={[
                                                styles.filterTag,
                                                filters.instruments.includes(inst.id) && styles.selectedFilterOption
                                            ]}
                                            onPress={() => {
                                                const newInsts = filters.instruments.includes(inst.id)
                                                    ? filters.instruments.filter(id => id !== inst.id)
                                                    : [...filters.instruments, inst.id];
                                                setFilters(prev => ({ ...prev, instruments: newInsts }));
                                            }}
                                        >
                                            <Text style={[
                                                styles.filterTagText,
                                                filters.instruments.includes(inst.id) && styles.selectedFilterText
                                            ]}>{inst.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.filterSection}>
                                <Text style={styles.filterSectionTitle}>ジャンルで絞り込む</Text>
                                <View style={styles.filterTagRow}>
                                    {GENRES.map((genre) => (
                                        <TouchableOpacity
                                            key={genre.id}
                                            style={[
                                                styles.filterTag,
                                                filters.genres.includes(genre.id) && styles.selectedFilterOption
                                            ]}
                                            onPress={() => {
                                                const newGenres = filters.genres.includes(genre.id)
                                                    ? filters.genres.filter(id => id !== genre.id)
                                                    : [...filters.genres, genre.id];
                                                setFilters(prev => ({ ...prev, genres: newGenres }));
                                            }}
                                        >
                                            <Text style={[
                                                styles.filterTagText,
                                                filters.genres.includes(genre.id) && styles.selectedFilterText
                                            ]}>{genre.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </ScrollView>

                        <View style={styles.filterActions}>
                            <TouchableOpacity
                                style={styles.resetButton}
                                onPress={() => {
                                    setFilters({ instruments: [], genres: [], radiusKm: 50 });
                                }}
                            >
                                <Text style={styles.resetButtonText}>リセット</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.applyButton}
                                onPress={() => {
                                    setIsFilterVisible(false);
                                    fetchUsers();
                                }}
                            >
                                <Text style={styles.applyButtonText}>適用する</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
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
        alignItems: 'center',
        gap: Spacing.sm,
    },
    filterBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.error,
        borderWidth: 1,
        borderColor: Colors.background,
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
        paddingBottom: Spacing.lg + 10,
        paddingTop: Spacing.lg,
    },
    actionButton: {
        width: 68,
        height: 68,
        borderRadius: 34,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1E1E22',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.08)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2, // 0.4 から 0.2 へ低減
        shadowRadius: 6,    // 10 から 6 へ低減
        elevation: 4,       // 8 から 4 へ低減
    },
    nopeButton: {
        shadowColor: Colors.nope,
        borderColor: Colors.nope + '33',
    },
    superLikeButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        shadowColor: Colors.superLike,
        borderColor: Colors.superLike + '66',
    },
    superLikeInner: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 28,
    },
    likeButton: {
        shadowColor: Colors.like,
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
    superLikeStamp: {
        bottom: 200,
        alignSelf: 'center',
        borderColor: Colors.superLike,
        transform: [{ rotate: '-10deg' }],
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

    // --- Filter Modal ---
    filterModalContent: {
        width: width,
        height: height * 0.8,
        backgroundColor: Colors.background,
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
        padding: Spacing.lg,
        position: 'absolute',
        bottom: 0,
    },
    filterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    filterTitle: {
        fontSize: FontSize.xl,
        fontWeight: '800',
        color: Colors.text,
    },
    filterSection: {
        marginBottom: Spacing.xl,
    },
    filterSectionTitle: {
        fontSize: FontSize.md,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: Spacing.md,
    },
    radiusContainer: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    radiusOption: {
        flex: 1,
        paddingVertical: 10,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
    },
    radiusText: {
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    filterTagRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    filterTag: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
    },
    filterTagText: {
        color: Colors.textSecondary,
        fontSize: FontSize.sm,
    },
    selectedFilterOption: {
        backgroundColor: Colors.primary + '20',
        borderColor: Colors.primary,
    },
    selectedFilterText: {
        color: Colors.primary,
        fontWeight: '700',
    },
    filterActions: {
        flexDirection: 'row',
        gap: Spacing.md,
        paddingTop: Spacing.lg,
        borderTopWidth: 1,
        borderTopColor: Colors.surfaceBorder,
    },
    resetButton: {
        flex: 1,
        paddingVertical: 15,
        alignItems: 'center',
    },
    resetButtonText: {
        color: Colors.textTertiary,
        fontWeight: '600',
    },
    applyButton: {
        flex: 2,
        backgroundColor: Colors.primary,
        paddingVertical: 15,
        borderRadius: BorderRadius.full,
        alignItems: 'center',
    },
    applyButtonText: {
        color: '#fff',
        fontWeight: '700',
    },
});
