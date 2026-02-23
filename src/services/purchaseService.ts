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
        // RevenueCat SDK のインポートは動的に行う（Web対応）
        try {
            // 実際のRevenueCat実装
            // const Purchases = require('react-native-purchases').default;
            // const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;
            // if (apiKey) {
            //   Purchases.configure({ apiKey });
            //   this._initialized = true;
            // }
            console.log('[Purchase] Initialized (mock mode)');
        } catch (e) {
            console.log('[Purchase] RevenueCat not available, using mock mode');
        }
    },

    /**
     * ユーザーIDを RevenueCat に紐付け
     */
    async identify(userId: string): Promise<void> {
        if (!this._initialized) return;
        // Purchases.logIn(userId);
        console.log('[Purchase] Identified user:', userId);
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
                            },
                        },
                        {
                            identifier: PRODUCT_IDS.PRO_MONTHLY,
                            product: {
                                title: 'BandLink Pro',
                                description: '全機能アンロック + プロフィールブースト',
                                priceString: '¥1,980',
                                price: 1980,
                            },
                        },
                    ],
                },
            };
        }
        // return await Purchases.getOfferings();
        return null;
    },

    /**
     * 購入フローを開始
     */
    async purchasePackage(packageId: string): Promise<{ success: boolean; error?: string }> {
        if (!this._initialized) {
            // モック: 開発中は常に成功とする
            console.log('[Purchase] Mock purchase:', packageId);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const planType = packageId === PRODUCT_IDS.PRO_MONTHLY || packageId === PRODUCT_IDS.PRO_YEARLY ? 'pro' : 'premium';

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
                            subscription_plan: planType,
                            is_premium: true,
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
            // const { customerInfo } = await Purchases.purchasePackage(package);
            // return { success: true };
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
                        .select('subscription_plan, is_premium, subscription_expires_at')
                        .eq('id', user.id)
                        .single();

                    if (!error && data) {
                        const plan = data.subscription_plan as 'free' | 'premium' | 'pro' | null;
                        const isLegacyPremium = data.is_premium && !plan;
                        const expiresAt = data.subscription_expires_at;
                        const now = new Date().toISOString();

                        // 期間内かどうかの判定 (レガシーのis_premiumがtrueの場合は旧仕様として特別に有効とする)
                        const isValidSubscription = !!plan && !!expiresAt && expiresAt > now;
                        const isActive = isValidSubscription || !!isLegacyPremium;
                        const activePlan = isValidSubscription ? plan : (isLegacyPremium ? 'premium' : 'free');

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
            // const customerInfo = await Purchases.getCustomerInfo();
            // const isPremium = customerInfo.entitlements.active[ENTITLEMENTS.PREMIUM];
            // const isPro = customerInfo.entitlements.active[ENTITLEMENTS.PRO];
            return {
                isActive: false,
                plan: 'free',
                expiresAt: null,
                willRenew: false,
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
            // const customerInfo = await Purchases.restorePurchases();
            return this.getSubscriptionInfo();
        } catch (e: any) {
            throw new Error('購入の復元に失敗しました: ' + e.message);
        }
    },
};
