import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';

interface AdBannerProps {
    type?: 'banner' | 'native';
    placement: 'discover' | 'matches' | 'profile';
}

// iOS用のバナー広告ユニットID（本番環境では env から取得）
const AD_UNIT_ID = __DEV__ ? TestIds.BANNER : (process.env.EXPO_PUBLIC_AD_UNIT_ID_IOS || TestIds.BANNER);

/**
 * 広告表示コンポーネント (Google AdMob 実装)
 * プレミアムユーザー（課金適用期間内）には何も表示しない
 */
export const AdBanner: React.FC<AdBannerProps> = ({ type = 'banner', placement }) => {
    const { profile } = useAuth();
    const [adLoaded, setAdLoaded] = useState(false);
    const [adError, setAdError] = useState(false);

    // プレミアム判定（有効期限内かどうか）
    const isPremium = profile?.subscription_expires_at
        ? new Date(profile.subscription_expires_at) > new Date()
        : false;

    // プレミアムユーザーには広告を表示しない
    if (isPremium) return null;

    // 広告読み込みエラー時は一旦表示しない（プレースホルダーを出さない方針）
    if (adError) return null;

    return (
        <View style={[
            styles.container,
            placement === 'discover' && styles.discoverContainer,
        ]}>
            {!adLoaded && (
                <View style={styles.loadingPlaceholder}>
                    <ActivityIndicator size="small" color={Colors.textTertiary} />
                </View>
            )}
            <BannerAd
                unitId={AD_UNIT_ID}
                size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                requestOptions={{
                    requestNonPersonalizedAdsOnly: true, // デフォルトで非パーソナライズ（ATT許可後に変更可能）
                }}
                onAdLoaded={() => setAdLoaded(true)}
                onAdFailedToLoad={(error) => {
                    console.warn('[AdMob] Ad failed to load: ', error);
                    setAdError(true);
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        backgroundColor: Colors.surface,
        marginVertical: Spacing.sm,
        minHeight: 50, // バナーの最小高さ
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    discoverContainer: {
        marginBottom: Spacing.md,
    },
    loadingPlaceholder: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.surface,
        zIndex: 1,
    }
});
