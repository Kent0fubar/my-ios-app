import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../src/theme';

const { width } = Dimensions.get('window');

type PlanId = 'premium' | 'pro';

const PLANS = [
    {
        id: 'premium' as PlanId,
        name: 'Premium',
        price: '¥980',
        period: '/月',
        popular: false,
        features: [
            { text: '無制限スワイプ', icon: 'infinite-outline' as const, included: true },
            { text: '高度なフィルター', icon: 'filter-outline' as const, included: true },
            { text: '全マッチ表示', icon: 'people-outline' as const, included: true },
            { text: 'メッセージの既読', icon: 'checkmark-done-outline' as const, included: true },
            { text: '広告なし', icon: 'eye-off-outline' as const, included: true },
            { text: 'プロフィールブースト', icon: 'rocket-outline' as const, included: false },
            { text: '閲覧数の確認', icon: 'analytics-outline' as const, included: false },
        ],
    },
    {
        id: 'pro' as PlanId,
        name: 'Pro',
        price: '¥1,980',
        period: '/月',
        popular: true,
        features: [
            { text: '無制限スワイプ', icon: 'infinite-outline' as const, included: true },
            { text: '高度なフィルター', icon: 'filter-outline' as const, included: true },
            { text: '全マッチ表示', icon: 'people-outline' as const, included: true },
            { text: 'メッセージの既読', icon: 'checkmark-done-outline' as const, included: true },
            { text: '広告なし', icon: 'eye-off-outline' as const, included: true },
            { text: 'プロフィールブースト', icon: 'rocket-outline' as const, included: true },
            { text: '閲覧数の確認', icon: 'analytics-outline' as const, included: true },
        ],
    },
];

const TESTIMONIALS = [
    { name: 'Yuki', text: 'BandLinkでギタリストを見つけて、今では一緒にライブやってます！', emoji: '🎸' },
    { name: 'Mika', text: 'Premium に課金してから3倍マッチが増えました。ブースト最高！', emoji: '🚀' },
];

export default function PremiumScreen() {
    const [selectedPlan, setSelectedPlan] = useState<PlanId>('pro');

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[Colors.background, '#13102F', Colors.backgroundSecondary]}
                style={StyleSheet.absoluteFill}
            />

            {/* Close button */}
            <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Hero section */}
                <View style={styles.hero}>
                    <LinearGradient
                        colors={[Colors.goldGradientStart, Colors.goldGradientEnd]}
                        style={styles.heroIcon}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Ionicons name="star" size={36} color="#fff" />
                    </LinearGradient>
                    <Text style={styles.heroTitle}>BandLink Premium</Text>
                    <Text style={styles.heroSubtitle}>
                        もっと多くのミュージシャンと出会おう
                    </Text>
                </View>

                {/* Stats highlight */}
                <View style={styles.statsBar}>
                    <View style={styles.statHighlight}>
                        <Text style={styles.statValue}>3x</Text>
                        <Text style={styles.statDesc}>マッチ率UP</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statHighlight}>
                        <Text style={styles.statValue}>∞</Text>
                        <Text style={styles.statDesc}>スワイプ</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statHighlight}>
                        <Text style={styles.statValue}>5x</Text>
                        <Text style={styles.statDesc}>表示回数UP</Text>
                    </View>
                </View>

                {/* Plans */}
                <View style={styles.plansContainer}>
                    {PLANS.map((plan) => (
                        <TouchableOpacity
                            key={plan.id}
                            style={[
                                styles.planCard,
                                selectedPlan === plan.id && styles.planCardSelected,
                            ]}
                            activeOpacity={0.8}
                            onPress={() => setSelectedPlan(plan.id)}
                        >
                            {plan.popular && (
                                <LinearGradient
                                    colors={[Colors.goldGradientStart, Colors.goldGradientEnd]}
                                    style={styles.popularBadge}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    <Text style={styles.popularText}>人気No.1</Text>
                                </LinearGradient>
                            )}
                            <View style={styles.planHeader}>
                                <Text style={styles.planName}>{plan.name}</Text>
                                <View style={styles.priceRow}>
                                    <Text style={styles.planPrice}>{plan.price}</Text>
                                    <Text style={styles.planPeriod}>{plan.period}</Text>
                                </View>
                            </View>

                            {/* Radio button */}
                            <View
                                style={[
                                    styles.radio,
                                    selectedPlan === plan.id && styles.radioSelected,
                                ]}
                            >
                                {selectedPlan === plan.id && (
                                    <LinearGradient
                                        colors={[Colors.primary, Colors.secondary]}
                                        style={styles.radioInner}
                                    />
                                )}
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Features */}
                <View style={styles.featuresSection}>
                    <Text style={styles.featuresTitle}>含まれる機能</Text>
                    {PLANS.find((p) => p.id === selectedPlan)?.features.map((feature, index) => (
                        <View key={index} style={styles.featureItem}>
                            <View
                                style={[
                                    styles.featureIcon,
                                    feature.included
                                        ? styles.featureIconIncluded
                                        : styles.featureIconExcluded,
                                ]}
                            >
                                <Ionicons
                                    name={feature.included ? 'checkmark' : 'close'}
                                    size={16}
                                    color={feature.included ? Colors.accent : Colors.textTertiary}
                                />
                            </View>
                            <Text
                                style={[
                                    styles.featureText,
                                    !feature.included && styles.featureTextExcluded,
                                ]}
                            >
                                {feature.text}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Testimonials */}
                <View style={styles.testimonialSection}>
                    <Text style={styles.testimonialTitle}>ユーザーの声 💬</Text>
                    {TESTIMONIALS.map((t, index) => (
                        <View key={index} style={styles.testimonialCard}>
                            <Text style={styles.testimonialEmoji}>{t.emoji}</Text>
                            <View style={styles.testimonialContent}>
                                <Text style={styles.testimonialText}>"{t.text}"</Text>
                                <Text style={styles.testimonialName}>— {t.name}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Free trial note */}
                <View style={styles.trialNote}>
                    <Ionicons name="shield-checkmark" size={20} color={Colors.accent} />
                    <Text style={styles.trialText}>
                        7日間の無料トライアル付き。いつでもキャンセル可能。
                    </Text>
                </View>
            </ScrollView>

            {/* Subscribe button (fixed at bottom) */}
            <View style={styles.subscribeContainer}>
                <TouchableOpacity activeOpacity={0.8} style={styles.subscribeWrapper}>
                    <LinearGradient
                        colors={[Colors.goldGradientStart, Colors.goldGradientEnd]}
                        style={styles.subscribeButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Text style={styles.subscribeText}>
                            無料トライアルを開始
                        </Text>
                        <Text style={styles.subscribeSubtext}>
                            {selectedPlan === 'pro' ? '¥1,980/月' : '¥980/月'} • 7日間無料
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
                <Text style={styles.termsText}>
                    購読はいつでもキャンセルできます。利用規約に同意します。
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    closeButton: {
        position: 'absolute',
        top: 56,
        right: Spacing.lg,
        zIndex: 10,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        paddingBottom: 180,
    },
    hero: {
        alignItems: 'center',
        paddingTop: 80,
        paddingBottom: Spacing.xl,
        gap: Spacing.md,
    },
    heroIcon: {
        width: 80,
        height: 80,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadow.glow,
        shadowColor: Colors.gold,
    },
    heroTitle: {
        fontSize: FontSize.xxxl,
        fontWeight: '900',
        color: Colors.text,
        letterSpacing: -0.5,
    },
    heroSubtitle: {
        fontSize: FontSize.lg,
        color: Colors.textSecondary,
    },
    statsBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginHorizontal: Spacing.lg,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        paddingVertical: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
        marginBottom: Spacing.xl,
    },
    statHighlight: {
        alignItems: 'center',
        gap: 4,
    },
    statValue: {
        fontSize: FontSize.xxl,
        fontWeight: '900',
        color: Colors.gold,
    },
    statDesc: {
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: Colors.surfaceBorder,
    },
    plansContainer: {
        paddingHorizontal: Spacing.lg,
        gap: Spacing.md,
        marginBottom: Spacing.xl,
    },
    planCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.card,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        borderWidth: 2,
        borderColor: 'transparent',
        position: 'relative',
        overflow: 'hidden',
    },
    planCardSelected: {
        borderColor: Colors.gold,
        backgroundColor: Colors.gold + '08',
    },
    popularBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderBottomLeftRadius: BorderRadius.md,
    },
    popularText: {
        fontSize: FontSize.xs,
        fontWeight: '800',
        color: '#fff',
    },
    planHeader: {
        flex: 1,
    },
    planName: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 4,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    planPrice: {
        fontSize: FontSize.xxl,
        fontWeight: '900',
        color: Colors.gold,
    },
    planPeriod: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
    },
    radio: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: Colors.textTertiary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioSelected: {
        borderColor: Colors.gold,
    },
    radioInner: {
        width: 14,
        height: 14,
        borderRadius: 7,
    },
    featuresSection: {
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.xl,
    },
    featuresTitle: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: Spacing.md,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingVertical: 10,
    },
    featureIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureIconIncluded: {
        backgroundColor: Colors.accent + '20',
    },
    featureIconExcluded: {
        backgroundColor: Colors.surface,
    },
    featureText: {
        fontSize: FontSize.md,
        color: Colors.text,
        fontWeight: '500',
    },
    featureTextExcluded: {
        color: Colors.textTertiary,
        textDecorationLine: 'line-through',
    },
    testimonialSection: {
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.xl,
    },
    testimonialTitle: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: Spacing.md,
    },
    testimonialCard: {
        flexDirection: 'row',
        gap: Spacing.md,
        backgroundColor: Colors.surface,
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
        marginBottom: Spacing.sm,
    },
    testimonialEmoji: {
        fontSize: 28,
    },
    testimonialContent: {
        flex: 1,
        gap: 6,
    },
    testimonialText: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        fontStyle: 'italic',
        lineHeight: 22,
    },
    testimonialName: {
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
        fontWeight: '600',
    },
    trialNote: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
    },
    trialText: {
        flex: 1,
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        lineHeight: 20,
    },
    subscribeContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        paddingBottom: 40,
        backgroundColor: 'rgba(10, 10, 26, 0.95)',
        borderTopWidth: 1,
        borderTopColor: Colors.surfaceBorder,
        gap: Spacing.sm,
    },
    subscribeWrapper: {
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        ...Shadow.lg,
        shadowColor: Colors.gold,
    },
    subscribeButton: {
        alignItems: 'center',
        paddingVertical: 18,
        gap: 2,
    },
    subscribeText: {
        fontSize: FontSize.lg,
        fontWeight: '800',
        color: '#fff',
    },
    subscribeSubtext: {
        fontSize: FontSize.xs,
        color: 'rgba(255,255,255,0.7)',
    },
    termsText: {
        fontSize: 10,
        color: Colors.textTertiary,
        textAlign: 'center',
    },
});
