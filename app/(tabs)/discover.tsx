import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    Animated,
    PanResponder,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../../src/theme';
import { MOCK_USERS, INSTRUMENTS, GENRES, SKILL_LEVELS, UserProfile } from '../../src/data/mockData';
import { InstrumentTag, GenreTag } from '../../src/components/Tag';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.3;

function SwipeCard({
    user,
    isFirst,
    onSwipeLeft,
    onSwipeRight,
    onSuperLike,
}: {
    user: UserProfile;
    isFirst: boolean;
    onSwipeLeft: () => void;
    onSwipeRight: () => void;
    onSuperLike: () => void;
}) {
    const position = useRef(new Animated.ValueXY()).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => isFirst,
            onMoveShouldSetPanResponder: (_, gesture) =>
                isFirst && (Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5),
            onPanResponderMove: (_, gesture) => {
                position.setValue({ x: gesture.dx, y: gesture.dy });
                rotateAnim.setValue(gesture.dx);
            },
            onPanResponderRelease: (_, gesture) => {
                if (gesture.dx > SWIPE_THRESHOLD) {
                    Animated.spring(position, {
                        toValue: { x: width + 100, y: gesture.dy },
                        useNativeDriver: true,
                    }).start(onSwipeRight);
                } else if (gesture.dx < -SWIPE_THRESHOLD) {
                    Animated.spring(position, {
                        toValue: { x: -width - 100, y: gesture.dy },
                        useNativeDriver: true,
                    }).start(onSwipeLeft);
                } else if (gesture.dy < -120) {
                    Animated.spring(position, {
                        toValue: { x: 0, y: -height },
                        useNativeDriver: true,
                    }).start(onSuperLike);
                } else {
                    Animated.spring(position, {
                        toValue: { x: 0, y: 0 },
                        friction: 5,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    const rotate = rotateAnim.interpolate({
        inputRange: [-width, 0, width],
        outputRange: ['-12deg', '0deg', '12deg'],
        extrapolate: 'clamp',
    });

    const likeOpacity = position.x.interpolate({
        inputRange: [0, SWIPE_THRESHOLD],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    const nopeOpacity = position.x.interpolate({
        inputRange: [-SWIPE_THRESHOLD, 0],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });

    const nextCardScale = position.x.interpolate({
        inputRange: [-width, 0, width],
        outputRange: [1, 0.92, 1],
        extrapolate: 'clamp',
    });

    const userInstruments = user.instruments
        .map((id) => INSTRUMENTS.find((i) => i.id === id))
        .filter(Boolean);

    const userGenres = user.genres
        .map((id) => GENRES.find((g) => g.id === id))
        .filter(Boolean);

    const skillLevel = SKILL_LEVELS.find((s) => s.id === user.skillLevel);

    const cardStyle = isFirst
        ? {
            transform: [
                { translateX: position.x },
                { translateY: position.y },
                { rotate },
            ],
        }
        : {
            transform: [{ scale: nextCardScale }],
        };

    return (
        <Animated.View
            style={[styles.card, cardStyle]}
            {...(isFirst ? panResponder.panHandlers : {})}
        >
            {/* Background Image */}
            <Image source={{ uri: user.imageUrl }} style={styles.cardImage} />

            {/* Gradient overlay */}
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
                locations={[0.3, 0.55, 1]}
                style={styles.cardGradient}
            />

            {/* LIKE / NOPE overlay */}
            {isFirst && (
                <>
                    <Animated.View style={[styles.stampContainer, styles.likeStamp, { opacity: likeOpacity }]}>
                        <Text style={[styles.stampText, { color: Colors.like }]}>LIKE</Text>
                    </Animated.View>
                    <Animated.View style={[styles.stampContainer, styles.nopeStamp, { opacity: nopeOpacity }]}>
                        <Text style={[styles.stampText, { color: Colors.nope }]}>NOPE</Text>
                    </Animated.View>
                </>
            )}

            {/* Premium badge */}
            {user.isPremium && (
                <View style={styles.premiumBadge}>
                    <Ionicons name="star" size={12} color={Colors.gold} />
                    <Text style={styles.premiumText}>PRO</Text>
                </View>
            )}

            {/* Match Score Badge */}
            {user.matchScore !== undefined && user.matchScore > 0 && (
                <View style={[
                    styles.matchScoreBadge,
                    { backgroundColor: user.matchScore >= 60 ? 'rgba(6,214,160,0.9)' : user.matchScore >= 30 ? 'rgba(249,115,22,0.9)' : 'rgba(100,116,139,0.8)' }
                ]}>
                    <Ionicons name="sparkles" size={12} color="#fff" />
                    <Text style={styles.matchScoreText}>{user.matchScore}%</Text>
                </View>
            )}

            {/* Card content */}
            <View style={styles.cardContent}>
                {/* Name & Age */}
                <View style={styles.nameRow}>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userAge}>{user.age}</Text>
                    {user.isVerified && (
                        <Ionicons name="checkmark-circle" size={20} color={Colors.accent} />
                    )}
                </View>

                {/* Location */}
                <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
                    <Text style={styles.locationText}>
                        {user.location} • {user.distance}km
                    </Text>
                </View>

                {/* Skill level */}
                {skillLevel && (
                    <View style={styles.skillBadge}>
                        <Text style={styles.skillEmoji}>{skillLevel.icon}</Text>
                        <Text style={styles.skillText}>{skillLevel.label}</Text>
                    </View>
                )}

                {/* Instruments */}
                <View style={styles.tagRow}>
                    {userInstruments.slice(0, 3).map((inst) => (
                        <InstrumentTag key={inst!.id} icon={inst!.icon} label={inst!.label} />
                    ))}
                </View>

                {/* Genres */}
                <View style={styles.tagRow}>
                    {userGenres.slice(0, 4).map((genre) => (
                        <GenreTag key={genre!.id} label={genre!.label} color={genre!.color} opacity="30" />
                    ))}
                </View>

                {/* Bio preview */}
                <Text style={styles.bio} numberOfLines={2}>
                    {user.bio}
                </Text>
            </View>
        </Animated.View>
    );
}

export default function DiscoverScreen() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [matches, setMatches] = useState<string[]>([]);

    const handleSwipeLeft = useCallback(() => {
        setCurrentIndex((prev) => prev + 1);
    }, []);

    const handleSwipeRight = useCallback(() => {
        const user = MOCK_USERS[currentIndex];
        if (user) {
            setMatches((prev) => [...prev, user.id]);
        }
        setCurrentIndex((prev) => prev + 1);
    }, [currentIndex]);

    const handleSuperLike = useCallback(() => {
        const user = MOCK_USERS[currentIndex];
        if (user) {
            setMatches((prev) => [...prev, user.id]);
        }
        setCurrentIndex((prev) => prev + 1);
    }, [currentIndex]);

    const remainingUsers = MOCK_USERS.slice(currentIndex);

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[Colors.background, Colors.backgroundSecondary]}
                style={StyleSheet.absoluteFill}
            />

            {/* Header */}
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
                            end={{ x: 1, y: 0 }}
                        >
                            <Ionicons name="star" size={16} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerButton}>
                        <Ionicons name="filter" size={22} color={Colors.textSecondary} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Card stack */}
            <View style={styles.cardStack}>
                {remainingUsers.length > 0 ? (
                    remainingUsers
                        .slice(0, 3)
                        .reverse()
                        .map((user, index) => (
                            <SwipeCard
                                key={user.id}
                                user={user}
                                isFirst={index === remainingUsers.slice(0, 3).length - 1}
                                onSwipeLeft={handleSwipeLeft}
                                onSwipeRight={handleSwipeRight}
                                onSuperLike={handleSuperLike}
                            />
                        ))
                ) : (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyEmoji}>🎵</Text>
                        <Text style={styles.emptyTitle}>全員チェック済み！</Text>
                        <Text style={styles.emptyText}>
                            新しいミュージシャンが登録されるまでお待ちください
                        </Text>
                        <TouchableOpacity
                            onPress={() => setCurrentIndex(0)}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={[Colors.primary, Colors.secondary]}
                                style={styles.resetButton}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Ionicons name="refresh" size={18} color="#fff" />
                                <Text style={styles.resetText}>リセット</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Action buttons */}
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
});
