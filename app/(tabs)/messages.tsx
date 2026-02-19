import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/theme';
import { MOCK_USERS, INSTRUMENTS } from '../../src/data/mockData';

// デモ用のメッセージデータ
const CONVERSATIONS = [
    {
        user: MOCK_USERS[0],
        lastMessage: 'こんにちは！ロックバンド結成に興味があります 🎸',
        time: '2分前',
        unread: 2,
    },
    {
        user: MOCK_USERS[1],
        lastMessage: '今週末セッションしませんか？🎹',
        time: '15分前',
        unread: 1,
    },
    {
        user: MOCK_USERS[3],
        lastMessage: 'オリジナル曲、聴いてもらえますか？',
        time: '1時間前',
        unread: 0,
    },
];

export default function MessagesScreen() {
    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[Colors.background, Colors.backgroundSecondary]}
                style={StyleSheet.absoluteFill}
            />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>メッセージ</Text>
                <TouchableOpacity style={styles.searchButton}>
                    <Ionicons name="search" size={22} color={Colors.textSecondary} />
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Online now */}
                <View style={styles.onlineSection}>
                    <Text style={styles.sectionTitle}>オンライン中</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.onlineList}
                    >
                        {MOCK_USERS.slice(0, 4).map((user) => (
                            <TouchableOpacity
                                key={user.id}
                                style={styles.onlineUser}
                                activeOpacity={0.8}
                                onPress={() => router.push(`/chat/${user.id}`)}
                            >
                                <View style={styles.onlineAvatarContainer}>
                                    <Image
                                        source={{ uri: user.imageUrl }}
                                        style={styles.onlineAvatar}
                                    />
                                    <View style={styles.onlineDot} />
                                </View>
                                <Text style={styles.onlineName} numberOfLines={1}>
                                    {user.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Conversations */}
                <View style={styles.conversationsSection}>
                    <Text style={styles.sectionTitle}>会話</Text>
                    {CONVERSATIONS.map((conv, index) => {
                        const mainInstrument = INSTRUMENTS.find(
                            (i) => i.id === conv.user.instruments[0]
                        );
                        return (
                            <TouchableOpacity
                                key={conv.user.id}
                                style={styles.conversationItem}
                                activeOpacity={0.7}
                                onPress={() => router.push(`/chat/${conv.user.id}`)}
                            >
                                <View style={styles.avatarContainer}>
                                    <Image
                                        source={{ uri: conv.user.imageUrl }}
                                        style={styles.avatar}
                                    />
                                    {index < 2 && <View style={styles.onlineDotSmall} />}
                                </View>
                                <View style={styles.conversationContent}>
                                    <View style={styles.conversationHeader}>
                                        <View style={styles.nameWithInstrument}>
                                            <Text style={styles.conversationName}>
                                                {conv.user.name}
                                            </Text>
                                            <Text style={styles.instrumentEmoji}>
                                                {mainInstrument?.icon}
                                            </Text>
                                        </View>
                                        <Text
                                            style={[
                                                styles.time,
                                                conv.unread > 0 && styles.timeActive,
                                            ]}
                                        >
                                            {conv.time}
                                        </Text>
                                    </View>
                                    <View style={styles.messageRow}>
                                        <Text
                                            style={[
                                                styles.lastMessage,
                                                conv.unread > 0 && styles.lastMessageUnread,
                                            ]}
                                            numberOfLines={1}
                                        >
                                            {conv.lastMessage}
                                        </Text>
                                        {conv.unread > 0 && (
                                            <View style={styles.unreadBadge}>
                                                <Text style={styles.unreadText}>{conv.unread}</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Premium upsell */}
                <TouchableOpacity
                    style={styles.premiumBanner}
                    activeOpacity={0.8}
                    onPress={() => router.push('/premium')}
                >
                    <LinearGradient
                        colors={[Colors.primary + '20', Colors.secondary + '20']}
                        style={styles.premiumBannerGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <View style={styles.premiumBannerContent}>
                            <Ionicons name="checkmark-circle" size={24} color={Colors.accent} />
                            <View style={styles.premiumBannerText}>
                                <Text style={styles.premiumBannerTitle}>
                                    既読機能をアンロック
                                </Text>
                                <Text style={styles.premiumBannerSub}>
                                    Premiumでメッセージの既読を確認
                                </Text>
                            </View>
                            <Ionicons
                                name="chevron-forward"
                                size={20}
                                color={Colors.textSecondary}
                            />
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </ScrollView>
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
    headerTitle: {
        fontSize: FontSize.xxl,
        fontWeight: '800',
        color: Colors.text,
    },
    searchButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        paddingBottom: 100,
    },
    onlineSection: {
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        fontSize: FontSize.sm,
        fontWeight: '600',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
    },
    onlineList: {
        paddingHorizontal: Spacing.lg,
        gap: Spacing.lg,
    },
    onlineUser: {
        alignItems: 'center',
        gap: 6,
    },
    onlineAvatarContainer: {
        position: 'relative',
    },
    onlineAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 2,
        borderColor: Colors.card,
    },
    onlineDot: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: Colors.success,
        borderWidth: 2,
        borderColor: Colors.background,
    },
    onlineName: {
        fontSize: FontSize.xs,
        color: Colors.text,
        fontWeight: '500',
        width: 56,
        textAlign: 'center',
    },
    conversationsSection: {
        marginBottom: Spacing.lg,
    },
    conversationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: 14,
        gap: Spacing.md,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
    },
    onlineDotSmall: {
        position: 'absolute',
        bottom: 1,
        right: 1,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: Colors.success,
        borderWidth: 2,
        borderColor: Colors.background,
    },
    conversationContent: {
        flex: 1,
        gap: 4,
    },
    conversationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    nameWithInstrument: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    conversationName: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: Colors.text,
    },
    instrumentEmoji: {
        fontSize: 14,
    },
    time: {
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
    },
    timeActive: {
        color: Colors.primary,
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    lastMessage: {
        flex: 1,
        fontSize: FontSize.sm,
        color: Colors.textTertiary,
    },
    lastMessageUnread: {
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    unreadBadge: {
        backgroundColor: Colors.primary,
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
    },
    unreadText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },
    premiumBanner: {
        marginHorizontal: Spacing.lg,
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
    },
    premiumBannerGradient: {
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
    },
    premiumBannerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    premiumBannerText: {
        flex: 1,
    },
    premiumBannerTitle: {
        fontSize: FontSize.md,
        fontWeight: '700',
        color: Colors.text,
    },
    premiumBannerSub: {
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
        marginTop: 2,
    },
});
