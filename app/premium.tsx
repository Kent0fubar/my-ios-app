import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, {
    FadeInDown,
    FadeInUp,
    FadeIn,
    withRepeat,
    withTiming,
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    Easing,
    interpolateColor,
} from 'react-native-reanimated';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../src/theme';
import { ScreenContainer } from '../src/components/common/ScreenContainer';
import { purchaseService, PRODUCT_IDS, SubscriptionInfo } from '../src/services/purchaseService';
import { useAuth } from '../src/contexts/AuthContext';

const { width } = Dimensions.get('window');

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

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

function PlanCard({
    plan,
    selected,
    onPress,
    index,
}: {
    plan: typeof PLANS[0];
    selected: boolean;
    onPress: () => void;
    index: number;
}) {
    const isSelected = useSharedValue(selected ? 1 : 0);
    const scale = useSharedValue(1);

    useEffect(() => {
        isSelected.value = withTiming(selected ? 1 : 0, { duration: 250 });
        scale.value = withSpring(selected ? 1.03 : 1, {
            damping: 15,
            stiffness: 150,
        });
    }, [selected]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
            borderColor: interpolateColor(
                isSelected.value,
                [0, 1],
                ['rgba(212, 175, 55, 0)', Colors.gold]
            ),
            backgroundColor: interpolateColor(
                isSelected.value,
                [0, 1],
                [Colors.card, 'rgba(212, 175, 55, 0.08)']
            ),
        };
    });

    const glowOpacity = useSharedValue(0.5);
    useEffect(() => {
        if (selected) {
            glowOpacity.value = withRepeat(
                withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
                -1,
                true
            );
        } else {
            glowOpacity.value = withTiming(0, { duration: 300 });
        }
    }, [selected]);

    const glowStyle = useAnimatedStyle(() => {
        return {
            opacity: glowOpacity.value,
        };
    });

    return (
        <Animated.View
            entering={FadeInDown.delay(300 + index * 150).springify().damping(12)}
            style={animatedStyle}
        >
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={onPress}
                style={styles.planCard}
            >
                {/* Soft background glow when selected */}
                <AnimatedLinearGradient
                    colors={['rgba(212, 175, 55, 0)', 'rgba(212, 175, 55, 0.1)']}
                    style={[StyleSheet.absoluteFill, glowStyle]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />

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
                    <Text style={[styles.planName, selected && styles.planNameSelected]}>{plan.name}</Text>
                    <View style={styles.priceRow}>
                        <Text style={styles.planPrice}>{plan.price}</Text>
                        <Text style={styles.planPeriod}>{plan.period}</Text>
                    </View>
                </View>

                {/* Radio button */}
                <View
                    style={[
                        styles.radio,
                        selected && styles.radioSelected,
                    ]}
                >
                    {selected && (
                        <Animated.View entering={FadeIn.duration(200)}>
                            <LinearGradient
                                colors={[Colors.gold, Colors.goldGradientEnd]}
                                style={styles.radioInner}
                            />
                        </Animated.View>
                    )}
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

export default function PremiumScreen() {
    const { refreshProfile } = useAuth();
    const [selectedPlan, setSelectedPlan] = useState<PlanId>('pro');
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [currentSubscription, setCurrentSubscription] = useState<SubscriptionInfo | null>(null);
    const [isCheckingSub, setIsCheckingSub] = useState(true);
    const [offerings, setOfferings] = useState<any>(null);

    const heroRotation = useSharedValue(0);

    useEffect(() => {
        heroRotation.value = withRepeat(
            withTiming(360, { duration: 10000, easing: Easing.linear }),
            -1,
            false
        );

        async function init() {
            try {
                // サブスクリプション状態の確認
                const info = await purchaseService.getSubscriptionInfo();
                setCurrentSubscription(info);
                if (info.isActive) {
                    setSelectedPlan(info.plan === 'pro' ? 'pro' : 'premium');
                }

                // オファリング（商品リスト）の取得
                const offers = await purchaseService.getOfferings();
                setOfferings(offers);
            } catch (error) {
                console.error('Premium init failed:', error);
            } finally {
                setIsCheckingSub(false);
            }
        }
        init();
    }, []);

    const heroIconStyle = useAnimatedStyle(() => {
        return {
            transform: [{ rotate: `${heroRotation.value}deg` }],
        };
    });

    const handlePurchase = async () => {
        if (isPurchasing || !offerings) return;

        setIsPurchasing(true);
        try {
            // 選択中のプランに対応するパッケージを探す
            const packageId = selectedPlan === 'pro' ? PRODUCT_IDS.PRO_MONTHLY : PRODUCT_IDS.PREMIUM_MONTHLY;
            const pkg = offerings.current?.availablePackages?.find(
                (p: any) => p.identifier === packageId || p.product.identifier === packageId
            );

            if (!pkg) {
                throw new Error('選択されたプランの購入情報が見つかりませんでした。');
            }

            const result = await purchaseService.purchasePackage(pkg);

            if (result.success) {
                // プロフィールの状態を更新
                await refreshProfile();

                const planName = selectedPlan === 'pro' ? 'Pro' : 'Premium';
                Alert.alert(
                    '購入完了 🎉',
                    `${planName}プランが有効になりました！すべての機能がご利用いただけます！`,
                    [{ text: 'OK', onPress: () => router.canGoBack() ? router.back() : router.replace('/') }]
                );
            } else {
                Alert.alert('購入キャンセル', result.error || '購入処理が行われませんでした。');
            }
        } catch (error: any) {
            Alert.alert('エラー', error.message || '通信エラーが発生しました。時間をおいて再度お試しください。');
        } finally {
            setIsPurchasing(false);
            // 購入後にもう一度状態を取得して反映
            const info = await purchaseService.getSubscriptionInfo();
            setCurrentSubscription(info);
        }
    };

    const isSubscribed = currentSubscription?.isActive;
    const isCurrentPlan = isSubscribed && currentSubscription?.plan === selectedPlan;
    const canUpgrade = isSubscribed && currentSubscription?.plan === 'premium' && selectedPlan === 'pro';
    const isButtonDisabled = isPurchasing || isCheckingSub || (isSubscribed && !canUpgrade);

    const formatExpiresAt = (isoString?: string | null) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    };

    return (
        <ScreenContainer gradientColors={[Colors.background, '#1A1829', Colors.backgroundSecondary]}>
            {/* Close button */}
            <AnimatedTouchableOpacity
                entering={FadeIn.delay(100)}
                style={styles.closeButton}
                onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
            >
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </AnimatedTouchableOpacity>

            <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Hero section */}
                <Animated.View entering={FadeInDown.springify().damping(12)} style={styles.hero}>
                    <Animated.View style={[styles.heroIconWrapper, heroIconStyle]}>
                        <LinearGradient
                            colors={['#FFD700', '#F7B733', '#FC4A1A']}
                            style={styles.heroIcon}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Ionicons name="star" size={36} color="#fff" style={{ transform: [{ rotate: '-15deg' }] }} />
                        </LinearGradient>
                    </Animated.View>
                    <Text style={styles.heroTitle}>BandLink Premium</Text>
                    <Text style={styles.heroSubtitle}>
                        さらに多くのミュージシャンに出会おう
                    </Text>
                </Animated.View>

                {/* Active subscription banner */}
                {isSubscribed && (
                    <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.activeSubBanner}>
                        <View style={styles.activeSubHeader}>
                            <Ionicons name="sparkles" size={20} color={Colors.gold} />
                            <Text style={styles.activeSubText}>
                                現在 {currentSubscription.plan === 'pro' ? 'Pro' : 'Premium'} プランを利用中です ✨
                            </Text>
                        </View>
                        {currentSubscription.expiresAt && (
                            <Text style={styles.activeSubExpiresText}>
                                有効期限: {formatExpiresAt(currentSubscription.expiresAt)}
                            </Text>
                        )}
                    </Animated.View>
                )}

                {/* Stats highlight */}
                <Animated.View entering={FadeInDown.delay(150).springify().damping(12)} style={styles.statsBar}>
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
                </Animated.View>

                {/* Plans */}
                <View style={styles.plansContainer}>
                    {PLANS.map((plan, index) => (
                        <PlanCard
                            key={plan.id}
                            plan={plan}
                            index={index}
                            selected={selectedPlan === plan.id}
                            onPress={() => setSelectedPlan(plan.id)}
                        />
                    ))}
                </View>

                {/* Features */}
                <Animated.View entering={FadeInUp.delay(500).springify()} style={styles.featuresSection}>
                    <Text style={styles.featuresTitle}>含まれる機能</Text>
                    {PLANS.find((p) => p.id === selectedPlan)?.features.map((feature, index) => (
                        <Animated.View
                            key={`${selectedPlan}-${index}`}
                            entering={FadeInDown.delay(50 * index)}
                            style={styles.featureItem}
                        >
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
                        </Animated.View>
                    ))}
                </Animated.View>

                {/* Testimonials */}
                <Animated.View entering={FadeInUp.delay(700).springify()} style={styles.testimonialSection}>
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
                </Animated.View>

                {/* Free trial note */}
                <Animated.View entering={FadeIn.delay(900)} style={styles.trialNote}>
                    <Ionicons name="shield-checkmark" size={20} color={Colors.accent} />
                    <Text style={styles.trialText}>
                        7日間の無料トライアル付き。いつでもキャンセル可能。
                    </Text>
                </Animated.View>
            </Animated.ScrollView>

            {/* Subscribe button (fixed at bottom) */}
            <Animated.View entering={FadeInUp.delay(1000).springify().damping(15)} style={styles.subscribeContainer}>
                <LinearGradient
                    colors={['transparent', 'rgba(10, 10, 26, 0.95)', 'rgba(10, 10, 26, 1)']}
                    style={StyleSheet.absoluteFill}
                    pointerEvents="none"
                />
                <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.subscribeWrapper, isButtonDisabled && styles.subscribeWrapperDisabled]}
                    onPress={isButtonDisabled ? undefined : handlePurchase}
                    disabled={isButtonDisabled}
                >
                    <LinearGradient
                        colors={isButtonDisabled ? [Colors.surface, Colors.surface] : [Colors.goldGradientStart, Colors.goldGradientEnd]}
                        style={styles.subscribeButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        {isPurchasing || isCheckingSub ? (
                            <ActivityIndicator color={Colors.gold} style={styles.loader} />
                        ) : isSubscribed && !canUpgrade ? (
                            <Text style={[styles.subscribeText, { color: Colors.gold, fontSize: isCurrentPlan ? FontSize.lg : FontSize.md }]}>
                                {isCurrentPlan ? '現在のプラン' : '下位プランを選択中'}
                            </Text>
                        ) : (
                            <>
                                <Text style={styles.subscribeText}>
                                    {canUpgrade ? 'Proにアップグレード' : '無料トライアルを開始'}
                                </Text>
                                <Text style={styles.subscribeSubtext}>
                                    {selectedPlan === 'pro' ? '¥1,980/月' : '¥980/月'}
                                    {canUpgrade ? '' : ' • 7日間無料'}
                                </Text>
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
                <Text style={styles.termsText}>
                    購読はいつでもキャンセルできます。利用規約に同意します。
                </Text>
            </Animated.View>
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    closeButton: {
        position: 'absolute',
        top: 56,
        right: Spacing.lg,
        zIndex: 10,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadow.sm,
    },
    scrollContent: {
        paddingBottom: 220,
    },
    hero: {
        alignItems: 'center',
        paddingTop: 80,
        paddingBottom: Spacing.xl,
        gap: Spacing.md,
    },
    heroIconWrapper: {
        ...Shadow.glow,
        shadowColor: Colors.gold,
    },
    heroIcon: {
        width: 88,
        height: 88,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroTitle: {
        fontSize: FontSize.xxxl,
        fontWeight: '900',
        color: Colors.text,
        letterSpacing: -0.5,
        marginTop: Spacing.sm,
    },
    heroSubtitle: {
        fontSize: FontSize.lg,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    activeSubBanner: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.xl,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
    },
    activeSubHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
    },
    activeSubText: {
        fontSize: FontSize.md,
        fontWeight: '700',
        color: Colors.gold,
    },
    activeSubExpiresText: {
        fontSize: FontSize.xs,
        color: 'rgba(212, 175, 55, 0.8)',
        fontWeight: '500',
    },
    statsBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginHorizontal: Spacing.lg,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: BorderRadius.xl,
        paddingVertical: Spacing.lg,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        marginBottom: Spacing.xl,
        ...Shadow.md,
    },
    statHighlight: {
        alignItems: 'center',
        gap: 4,
    },
    statValue: {
        fontSize: 28,
        fontWeight: '900',
        color: Colors.gold,
        letterSpacing: -1,
    },
    statDesc: {
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        borderWidth: 2,
        borderColor: 'transparent',
        position: 'relative',
        overflow: 'hidden',
        ...Shadow.sm,
    },
    popularBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderBottomLeftRadius: BorderRadius.lg,
        zIndex: 2,
        ...Shadow.md,
        shadowColor: Colors.gold,
    },
    popularText: {
        fontSize: FontSize.xs,
        fontWeight: '800',
        color: '#222',
        letterSpacing: 0.5,
    },
    planHeader: {
        flex: 1,
        zIndex: 2,
    },
    planName: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: Colors.textSecondary,
        marginBottom: 6,
    },
    planNameSelected: {
        color: Colors.text,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    planPrice: {
        fontSize: 32,
        fontWeight: '900',
        color: Colors.gold,
        letterSpacing: -1,
    },
    planPeriod: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        fontWeight: '500',
        marginLeft: 2,
    },
    radio: {
        width: 26,
        height: 26,
        borderRadius: 13,
        borderWidth: 2,
        borderColor: Colors.textTertiary,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: Spacing.md,
        zIndex: 2,
    },
    radioSelected: {
        borderColor: Colors.gold,
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
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
        fontWeight: '800',
        color: Colors.text,
        marginBottom: Spacing.md,
        letterSpacing: -0.3,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    featureIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureIconIncluded: {
        backgroundColor: 'rgba(52, 199, 89, 0.15)',
    },
    featureIconExcluded: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    featureText: {
        fontSize: FontSize.md,
        color: Colors.text,
        fontWeight: '600',
    },
    featureTextExcluded: {
        color: Colors.textTertiary,
        textDecorationLine: 'line-through',
        fontWeight: '400',
    },
    testimonialSection: {
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.xl,
    },
    testimonialTitle: {
        fontSize: FontSize.lg,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: Spacing.md,
        letterSpacing: -0.3,
    },
    testimonialCard: {
        flexDirection: 'row',
        gap: Spacing.md,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        marginBottom: Spacing.md,
    },
    testimonialEmoji: {
        fontSize: 32,
    },
    testimonialContent: {
        flex: 1,
        gap: 8,
    },
    testimonialText: {
        fontSize: FontSize.sm,
        color: 'rgba(255, 255, 255, 0.85)',
        fontStyle: 'italic',
        lineHeight: 22,
    },
    testimonialName: {
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    trialNote: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.xl,
        backgroundColor: 'rgba(52, 199, 89, 0.08)',
        paddingVertical: 12,
        borderRadius: BorderRadius.md,
        marginHorizontal: Spacing.lg,
    },
    trialText: {
        flex: 1,
        fontSize: FontSize.sm,
        color: Colors.text,
        fontWeight: '500',
    },
    subscribeContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.xl,
        paddingBottom: 40,
        gap: Spacing.md,
    },
    subscribeWrapper: {
        borderRadius: BorderRadius.full,
        overflow: 'hidden',
        ...Shadow.glow,
        shadowColor: Colors.gold,
    },
    subscribeWrapperDisabled: {
        opacity: 0.8,
        shadowOpacity: 0,
    },
    subscribeButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        minHeight: 80,
        gap: 4,
    },
    loader: {
        paddingVertical: 4,
    },
    subscribeText: {
        fontSize: FontSize.lg,
        fontWeight: '900',
        color: '#111',
        letterSpacing: 0.5,
    },
    subscribeSubtext: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(0, 0, 0, 0.6)',
    },
    termsText: {
        fontSize: 10,
        color: Colors.textTertiary,
        textAlign: 'center',
        fontWeight: '500',
    },
});

