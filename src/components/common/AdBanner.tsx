import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';

interface AdBannerProps {
    type?: 'banner' | 'native';
    placement: 'discover' | 'matches' | 'profile';
}

/**
 * 広告表示コンポーネント
 * プレミアムユーザー（課金適用期間内）には何も表示しない
 */
export const AdBanner: React.FC<AdBannerProps> = ({ type = 'banner', placement }) => {
    const { profile } = useAuth();
    const isDiscover = placement === 'discover';

    // プレミアム判定（有効期限内かどうか）
    const isPremium = profile?.subscription_expires_at
        ? new Date(profile.subscription_expires_at) > new Date()
        : false;

    // プレミアムユーザーには広告を表示しない
    if (isPremium) return null;

    const handleAdPress = () => {
        // 本来は広告URLへ飛ばすが、ここではデモとしてプレミアム案内へ
        Linking.openURL('https://example.com/ads');
    };

    return (
        <TouchableOpacity
            style={[
                styles.container,
                type === 'native' && styles.nativeContainer,
                isDiscover && styles.discoverContainer
            ]}
            onPress={handleAdPress}
            activeOpacity={0.9}
        >
            <View style={styles.content}>
                <View style={styles.adBadge}>
                    <Text style={styles.adBadgeText}>AD</Text>
                </View>

                <View style={styles.textContainer}>
                    <Text style={[styles.title, isDiscover && styles.discoverTitle]} numberOfLines={1}>
                        {isDiscover ? 'Premiumで広告を非表示' : 'Premiumプランで広告を非表示に'}
                    </Text>
                    {!isDiscover && (
                        <Text style={styles.description} numberOfLines={1}>
                            今なら初月50%OFF！快適なマッチング体験を。
                        </Text>
                    )}
                </View>

                <Ionicons name="chevron-forward" size={isDiscover ? 16 : 20} color={Colors.textTertiary} />
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.surface,
        marginHorizontal: Spacing.lg,
        marginVertical: Spacing.sm,
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
        // 軽いシャドウ
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    discoverContainer: {
        marginHorizontal: Spacing.md,
        marginTop: 4,
        marginBottom: Spacing.md, // カードとの間に隙間を作る
        padding: Spacing.sm,
        borderRadius: BorderRadius.md,
    },
    nativeContainer: {
        padding: Spacing.lg,
        minHeight: 100,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    adBadge: {
        backgroundColor: Colors.textTertiary + '22',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 0.5,
        borderColor: Colors.textTertiary + '44',
    },
    adBadgeText: {
        fontSize: 10,
        color: Colors.textTertiary,
        fontWeight: 'bold',
    },
    textContainer: {
        flex: 1,
        gap: 2,
    },
    title: {
        fontSize: FontSize.sm,
        fontWeight: '700',
        color: Colors.text,
    },
    discoverTitle: {
        fontSize: 12,
    },
    description: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
});
