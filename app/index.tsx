import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '../src/theme';

const { width, height } = Dimensions.get('window');

const ONBOARDING_DATA = [
    {
        icon: 'musical-notes',
        title: 'ミュージシャンを\n見つけよう',
        description: '理想のバンドメンバーやセッション仲間が\nきっと見つかる',
        gradient: [Colors.primary, Colors.secondary] as const,
        emoji: '🎸',
    },
    {
        icon: 'people',
        title: 'スワイプで\nマッチング',
        description: '気になるミュージシャンを右スワイプ！\nお互いにLikeしたらマッチ成立',
        gradient: [Colors.secondary, Colors.gradientEnd] as const,
        emoji: '🤝',
    },
    {
        icon: 'chatbubbles',
        title: 'チャットで\nつながろう',
        description: 'マッチしたらすぐにメッセージ交換\n一緒にスタジオに入ろう！',
        gradient: [Colors.gradientEnd, Colors.accent] as const,
        emoji: '💬',
    },
];

export default function OnboardingScreen() {
    const [currentPage, setCurrentPage] = useState(0);
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const animateTransition = (nextPage: number) => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 0.9,
                duration: 150,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setCurrentPage(nextPage);
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                }),
            ]).start();
        });
    };

    const handleNext = () => {
        if (currentPage < ONBOARDING_DATA.length - 1) {
            animateTransition(currentPage + 1);
        } else {
            router.replace('/(tabs)/discover');
        }
    };

    const handleSkip = () => {
        router.replace('/(tabs)/discover');
    };

    const data = ONBOARDING_DATA[currentPage];

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#0A0A1A', '#13132B', '#1C1C3A']}
                style={StyleSheet.absoluteFill}
            />

            {/* Skip button */}
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                <Text style={styles.skipText}>スキップ</Text>
            </TouchableOpacity>

            {/* Content */}
            <View style={styles.content}>
                <Animated.View
                    style={[
                        styles.emojiContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                >
                    <LinearGradient
                        colors={[...data.gradient]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.emojiCircle}
                    >
                        <Text style={styles.emoji}>{data.emoji}</Text>
                    </LinearGradient>

                    {/* Decorative rings */}
                    <View style={[styles.ring, styles.ring1]} />
                    <View style={[styles.ring, styles.ring2]} />
                    <View style={[styles.ring, styles.ring3]} />
                </Animated.View>

                <Animated.View
                    style={[
                        styles.textContainer,
                        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
                    ]}
                >
                    <Text style={styles.title}>{data.title}</Text>
                    <Text style={styles.description}>{data.description}</Text>
                </Animated.View>
            </View>

            {/* Bottom section */}
            <View style={styles.bottom}>
                {/* Page indicators */}
                <View style={styles.indicators}>
                    {ONBOARDING_DATA.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.indicator,
                                index === currentPage && styles.indicatorActive,
                            ]}
                        />
                    ))}
                </View>

                {/* Next button */}
                <TouchableOpacity onPress={handleNext} activeOpacity={0.8}>
                    <LinearGradient
                        colors={[Colors.primary, Colors.secondary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.nextButton}
                    >
                        <Text style={styles.nextButtonText}>
                            {currentPage === ONBOARDING_DATA.length - 1
                                ? 'はじめる'
                                : '次へ'}
                        </Text>
                        <Ionicons
                            name={
                                currentPage === ONBOARDING_DATA.length - 1
                                    ? 'rocket-outline'
                                    : 'arrow-forward'
                            }
                            size={20}
                            color="#fff"
                        />
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    skipButton: {
        position: 'absolute',
        top: 60,
        right: Spacing.lg,
        zIndex: 10,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
    },
    skipText: {
        color: Colors.textSecondary,
        fontSize: FontSize.md,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
    },
    emojiContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.xxl,
        width: 200,
        height: 200,
    },
    emojiCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    emoji: {
        fontSize: 64,
    },
    ring: {
        position: 'absolute',
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.15)',
    },
    ring1: {
        width: 180,
        height: 180,
    },
    ring2: {
        width: 220,
        height: 220,
        borderColor: 'rgba(139, 92, 246, 0.08)',
    },
    ring3: {
        width: 260,
        height: 260,
        borderColor: 'rgba(139, 92, 246, 0.04)',
    },
    textContainer: {
        alignItems: 'center',
    },
    title: {
        fontSize: FontSize.xxxl,
        fontWeight: '800',
        color: Colors.text,
        textAlign: 'center',
        marginBottom: Spacing.md,
        lineHeight: 44,
    },
    description: {
        fontSize: FontSize.lg,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 26,
    },
    bottom: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: 60,
        gap: Spacing.xl,
    },
    indicators: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: Spacing.sm,
    },
    indicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.surfaceLight,
    },
    indicatorActive: {
        width: 32,
        backgroundColor: Colors.primary,
    },
    nextButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: 18,
        borderRadius: BorderRadius.xl,
    },
    nextButtonText: {
        color: Colors.text,
        fontSize: FontSize.lg,
        fontWeight: '700',
    },
});
