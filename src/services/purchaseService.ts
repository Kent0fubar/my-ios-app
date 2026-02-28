/**
 * アプリ内課金サービス
 * RevenueCat を使用した iOS In-App Purchase 管理
 *
 * RevenueCat の利点:
 * - 月間売上 $2,500 まで無料
 * - Apple IAP の複雑なレシート検証を自動化
 * - サブスクリプション管理ダッシュボード
 * - Webhook でバックエンド（Supabase）と連携可能
 *
 * セットアップ:
 * 1. https://app.revenuecat.com でアカウント作成
 * 2. Appleのアプリ内課金設定（App Store Connect）
 * 3. RevenueCat ダッシュボードでProduct 設定
 * 4. EXPO_PUBLIC_REVENUECAT_API_KEY を設定
 */

import { supabase } from '../lib/supabase';

// RevenueCat のProduct ID
export const PRODUCT_IDS = {
    PREMIUM_MONTHLY: 'bandlink_premium_monthly',      // ¥980/月
    PRO_MONTHLY: 'bandlink_pro_monthly',              // ¥1,980/月
    PREMIUM_YEARLY: 'bandlink_premium_yearly',        // ¥9,800/年 (¥817/月)
    PRO_YEARLY: 'bandlink_pro_yearly',                // ¥19,800/年 (¥1,650/月)
    BOOST_SINGLE: 'bandlink_boost_single',            // ¥500 (単品)
    SUPERLIKE_PACK: 'bandlink_superlike_5pack',       // ¥300 (5回)
};

// Entitlement ID
export const ENTITLEMENTS = {
    PREMIUM: 'premium',
    PRO: 'pro',
};

export interface SubscriptionInfo {
    isActive: boolean;
    plan: 'free' | 'premium' | 'pro';
    expiresAt: string | null;
    willRenew: boolean;
}

/**
 * 課金サービス
 *
 * NOTE: RevenueCat SDK は実機でのみ動作します。
 * Web/シミュレータではモックデータを使用します。
 */
export const purchaseService = {
    _initialized: false,
    _mockPremium: false, // 開発用モック

    /**
     * RevenueCat を初期化
     * アプリ起動時に1回だけ呼び出す
     */
    async initialize(): Promise<void> {
        try {
            const Purchases = require('react-native-purchases').default;
            const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;

            if (apiKey) {
                // 開発中は詳細ログを抑制（商品未登録の警告を非表示にする）
                // 本番では LOG_LEVEL.ERROR のみに絞る
                if (__DEV__) {
                    Purchases.setLogLevel(require('react-native-purchases').LOG_LEVEL.ERROR);
                }
                Purchases.configure({ apiKey });
                this._initialized = true;
                console.log('[Purchase] RevenueCat Initialized');
            } else {
                console.warn('[Purchase] RevenueCat API Key is missing. Running in mock mode.');
            }
        } catch (e) {
            console.log('[Purchase] RevenueCat not available, using mock mode');
        }
    },

    /**
     * ユーザーIDを RevenueCat に紐付け
     */
    async identify(userId: string): Promise<void> {
        if (!this._initialized) return;
        const Purchases = require('react-native-purchases').default;
        await Purchases.logIn(userId);
        console.log('[Purchase] Identified user in RevenueCat:', userId);
    },

    /**
     * 利用可能なパッケージを取得
     */
    async getOfferings(): Promise<any> {
        if (!this._initialized) {
            // モックデータを返す
            return {
                current: {
                    availablePackages: [
                        {
                            identifier: PRODUCT_IDS.PREMIUM_MONTHLY,
                            product: {
                                title: 'BandLink Premium',
                                description: '無制限スワイプ、高度なフィルター',
                                priceString: '¥980',
                                price: 980,
                                introductoryPrice: {
                                    period: 'P7D',
                                    periodUnit: 'DAY',
                                    periodNumberOfUnits: 7,
                                    price: 0,
                                    priceString: '無料',
                                    type: 'TRIAL',
                                }
                            },
                        },
                        {
                            identifier: PRODUCT_IDS.PRO_MONTHLY,
                            product: {
                                title: 'BandLink Pro',
                                description: '全機能アンロック + プロフィールブースト',
                                priceString: '¥1,980',
                                price: 1980,
                                introductoryPrice: {
                                    period: 'P7D',
                                    periodUnit: 'DAY',
                                    periodNumberOfUnits: 7,
                                    price: 0,
                                    priceString: '無料',
                                    type: 'TRIAL',
                                }
                            },
                        },
                    ],
                },
            };
        }
        const Purchases = require('react-native-purchases').default;
        return await Purchases.getOfferings();
    },

    /**
     * 購入フローを開始
     */
    async purchasePackage(packageObj: any): Promise<{ success: boolean; error?: string }> {
        if (!this._initialized) {
            // モック: 開発中は常に成功とする
            const packageId = packageObj.identifier || packageObj;
            console.log('[Purchase] Mock purchase:', packageId);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const planType = packageId === PRODUCT_IDS.PRO_MONTHLY || packageId === PRODUCT_IDS.PRO_YEARLY ? 'pro' : 'premium';
                    const isPro = planType === 'pro';

                    const now = new Date();
                    const startedAt = now.toISOString();

                    // モック: 有効期限を計算
                    const isYearly = packageId === PRODUCT_IDS.PRO_YEARLY || packageId === PRODUCT_IDS.PREMIUM_YEARLY;
                    const expiresAtDate = new Date();
                    if (isYearly) {
                        expiresAtDate.setFullYear(expiresAtDate.getFullYear() + 1);
                    } else {
                        expiresAtDate.setMonth(expiresAtDate.getMonth() + 1);
                    }
                    const expiresAt = expiresAtDate.toISOString();

                    const { error } = await supabase
                        .from('profiles')
                        .update({
                            is_premium: true,
                            is_pro: isPro,
                            subscription_started_at: startedAt,
                            subscription_expires_at: expiresAt
                        })
                        .eq('id', user.id);

                    if (error) throw error;
                    this._mockPremium = true;
                    return { success: true };
                }
            } catch (error: any) {
                return { success: false, error: 'DB保存エラー: ' + error.message };
            }
        }

        try {
            const Purchases = require('react-native-purchases').default;
            const { customerInfo } = await Purchases.purchasePackage(packageObj);

            // 購入成功後、DBを更新（Webhook連携が理想だが、ここではクライアント側でも行う）
            const isPremium = !!customerInfo.entitlements.active[ENTITLEMENTS.PREMIUM];
            const isPro = !!customerInfo.entitlements.active[ENTITLEMENTS.PRO];

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase
                    .from('profiles')
                    .update({
                        is_premium: isPremium,
                        is_pro: isPro,
                        // expires_at などの詳細は RevenueCat 側がマスターデータを持つ
                        subscription_expires_at: isPro
                            ? customerInfo.entitlements.active[ENTITLEMENTS.PRO]?.expirationDate
                            : customerInfo.entitlements.active[ENTITLEMENTS.PREMIUM]?.expirationDate
                    })
                    .eq('id', user.id);
            }

            return { success: true };
        } catch (e: any) {
            if (e.userCancelled) {
                return { success: false, error: 'キャンセルされました' };
            }
            return { success: false, error: e.message };
        }
    },

    /**
     * サブスクリプション状態を確認
     */
    async getSubscriptionInfo(): Promise<SubscriptionInfo> {
        if (!this._initialized) {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('is_premium, is_pro, subscription_expires_at')
                        .eq('id', user.id)
                        .single();

                    if (!error && data) {
                        const isPro = data.is_pro;
                        const isPremium = data.is_premium;
                        const expiresAt = data.subscription_expires_at;
                        const now = new Date().toISOString();

                        // 期間内かどうかの判定
                        const isValidSubscription = !!expiresAt && expiresAt > now;
                        const isActive = isValidSubscription && (isPremium || isPro);
                        const activePlan = !isValidSubscription ? 'free' : (isPro ? 'pro' : 'premium');

                        return {
                            isActive: isActive,
                            plan: activePlan,
                            expiresAt: expiresAt || null,
                            willRenew: false,
                        };
                    }
                }
            } catch (error) {
                console.error('[Purchase] Error fetching subscription from DB:', error);
            }

            return {
                isActive: this._mockPremium,
                plan: this._mockPremium ? 'premium' : 'free',
                expiresAt: null,
                willRenew: false,
            };
        }

        try {
            const Purchases = require('react-native-purchases').default;
            const customerInfo = await Purchases.getCustomerInfo();
            const premiumEntitlement = customerInfo.entitlements.active[ENTITLEMENTS.PREMIUM];
            const proEntitlement = customerInfo.entitlements.active[ENTITLEMENTS.PRO];

            const isPro = !!proEntitlement;
            const isPremium = !!premiumEntitlement;

            return {
                isActive: isPro || isPremium,
                plan: isPro ? 'pro' : (isPremium ? 'premium' : 'free'),
                expiresAt: isPro ? proEntitlement.expirationDate : (isPremium ? premiumEntitlement.expirationDate : null),
                willRenew: isPro ? proEntitlement.willRenew : (isPremium ? premiumEntitlement.willRenew : false),
            };
        } catch {
            return {
                isActive: false,
                plan: 'free',
                expiresAt: null,
                willRenew: false,
            };
        }
    },

    /**
     * 購入を復元（機種変更時など）
     */
    async restorePurchases(): Promise<SubscriptionInfo> {
        if (!this._initialized) {
            return this.getSubscriptionInfo();
        }

        try {
            const Purchases = require('react-native-purchases').default;
            await Purchases.restorePurchases();
            return this.getSubscriptionInfo();
        } catch (e: any) {
            throw new Error('購入の復元に失敗しました: ' + e.message);
        }
    },

    /**
     * サブスクリプション状態をDBと同期
     * 通信時などに呼び出して有効期限切れをチェック
     */
    async syncSubscriptionStatus(): Promise<void> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile, error } = await supabase
                .from('profiles')
                .select('subscription_expires_at, is_premium, is_pro')
                .eq('id', user.id)
                .single();

            if (error || !profile) return;

            const now = new Date();
            const expiresAt = profile.subscription_expires_at ? new Date(profile.subscription_expires_at) : null;

            // クリーンアップが必要な条件:
            // 1. 期限切れである
            // 2. プレミアム/Proなのに期限が設定されていない
            const isExpired = expiresAt && expiresAt < now;
            const isMissingExpiry = (profile.is_premium || profile.is_pro) && !expiresAt;

            if (isExpired || isMissingExpiry) {
                console.log('[Purchase] Subscription status cleanup needed. Updating DB...');
                await supabase
                    .from('profiles')
                    .update({
                        is_premium: false,
                        is_pro: false
                    })
                    .eq('id', user.id);
            }
        } catch (err) {
            console.error('[Purchase] syncSubscriptionStatus error:', err);
        }
    },
};
