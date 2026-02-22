import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { messageService, matchService, profileService } from '../../src/services/dataService';

interface Message {
    id: string;
    text: string;
    sender: 'me' | 'other';
    timestamp: string;
}

export default function ChatScreen() {
    const { id: otherUserId } = useLocalSearchParams<{ id: string }>();
    const { user: currentUser } = useAuth();

    const [otherProfile, setOtherProfile] = useState<any>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [matchId, setMatchId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const flatListRef = React.useRef<FlatList>(null);

    // 初期データのロードとリアルタイム購読
    useEffect(() => {
        if (!currentUser || !otherUserId) return;

        let channel: any;

        const initChat = async () => {
            console.log('[Chat] initChat started with otherUserId:', otherUserId, 'currentUser:', currentUser.id);
            try {
                // 相手のプロフィールを取得
                const profile = await profileService.getProfile(otherUserId, currentUser.id);
                setOtherProfile(profile);

                // マッチの取得または作成
                const match = await matchService.getOrCreateMatch(currentUser.id, otherUserId);
                if (!match) return;

                setMatchId(match.id);

                // 過去のメッセージを取得
                const loadedMessages = await messageService.getMessages(match.id);

                // 自分が受信者となっている全メッセージを既読にする
                await messageService.markAsRead(match.id, currentUser.id);

                // UI用にフォーマット変換
                const formattedMessages: Message[] = loadedMessages.map(m => ({
                    id: m.id,
                    text: m.content || '',
                    sender: m.sender_id === currentUser.id ? 'me' : 'other',
                    timestamp: new Date(m.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
                }));

                setMessages(formattedMessages);

                // リアルタイム購読の設定
                channel = messageService.subscribeToMessages(match.id, (newMessage) => {
                    const newMsg = newMessage;
                    // 自分が送ったものは handleSend で追加するので、相手のものだけ購読で受ける
                    if (newMsg && newMsg.sender_id !== currentUser.id) {
                        setMessages(prev => [...prev, {
                            id: newMsg.id,
                            text: newMsg.content || '',
                            sender: 'other',
                            timestamp: new Date(newMsg.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
                        }]);

                        // 開いている間に届いたメッセージも即座に既読扱いにする
                        messageService.markAsRead(match.id, currentUser.id);

                        setTimeout(() => {
                            flatListRef.current?.scrollToEnd({ animated: true });
                        }, 100);
                    }
                });
            } catch (error: any) {
                console.error('[Chat] Init error:', error.message || error);
            } finally {
                setIsLoading(false);
            }
        };

        initChat();

        return () => {
            if (channel) {
                channel.unsubscribe();
            }
        };
    }, [currentUser, otherUserId]);

    // 初回ロード時にスクロール
    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: false });
            }, 300);
        }
    }, [messages.length]);

    const handleSend = async () => {
        if (!inputText.trim() || !currentUser || !matchId) return;

        const textToSend = inputText.trim();
        setInputText('');

        // Supabaseへ保存
        const savedMsg = await messageService.sendMessage(matchId, currentUser.id, textToSend);

        if (savedMsg) {
            // UI更新
            setMessages((prev) => [...prev, {
                id: savedMsg.id,
                text: savedMsg.content || '',
                sender: 'me',
                timestamp: new Date(savedMsg.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
            }]);

            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isMe = item.sender === 'me';
        return (
            <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
                {!isMe && (
                    <Image
                        source={otherProfile?.avatar_url ? { uri: otherProfile.avatar_url } : { uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop' }}
                        style={styles.messageAvatar}
                        contentFit="cover"
                        transition={200}
                    />
                )}
                <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.otherBubble]}>
                    {isMe ? (
                        <LinearGradient
                            colors={[Colors.primary, Colors.secondary]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.myBubbleGradient}
                        >
                            <Text style={styles.messageText}>{item.text}</Text>
                            <Text style={styles.timestamp}>{item.timestamp}</Text>
                        </LinearGradient>
                    ) : (
                        <>
                            <Text style={[styles.messageText, styles.otherText]}>{item.text}</Text>
                            <Text style={[styles.timestamp, styles.otherTimestamp]}>{item.timestamp}</Text>
                        </>
                    )}
                </View>
            </View>
        );
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            <LinearGradient
                colors={[Colors.background, Colors.backgroundSecondary]}
                style={StyleSheet.absoluteFill}
            />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/matches')}>
                    <Ionicons name="chevron-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.userInfo} onPress={() => router.push(`/profile/${otherUserId}`)}>
                    <Image
                        source={otherProfile?.avatar_url ? { uri: otherProfile.avatar_url } : { uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop' }}
                        style={styles.headerAvatar}
                        contentFit="cover"
                        transition={200}
                    />
                    <View>
                        <Text style={styles.headerName}>{otherProfile?.name || 'Loading...'}</Text>
                        <Text style={styles.headerSub}>
                            {otherProfile?.instruments?.[0] || '楽器未設定'} • オンライン
                        </Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.moreButton}>
                    <Ionicons name="ellipsis-vertical" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
            </View>

            {/* Messages */}
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messagesList}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            {/* Input */}
            <View style={styles.inputContainer}>
                <TouchableOpacity style={styles.attachButton}>
                    <Ionicons name="add-circle-outline" size={28} color={Colors.textSecondary} />
                </TouchableOpacity>
                <View style={styles.inputWrapper}>
                    <TextInput
                        style={styles.textInput}
                        placeholder="メッセージを入力..."
                        placeholderTextColor={Colors.textTertiary}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                    />
                </View>
                <TouchableOpacity onPress={handleSend} activeOpacity={0.7}>
                    <LinearGradient
                        colors={inputText.trim() ? [Colors.primary, Colors.secondary] : [Colors.card, Colors.card]}
                        style={styles.sendButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Ionicons
                            name="send"
                            size={18}
                            color={inputText.trim() ? '#fff' : Colors.textTertiary}
                        />
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 56,
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.surfaceBorder,
        gap: Spacing.sm,
        backgroundColor: Colors.background,
    },
    backButton: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    userInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    headerName: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: Colors.text,
    },
    headerSub: {
        fontSize: FontSize.xs,
        color: Colors.accent,
    },
    moreButton: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    messagesList: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        gap: Spacing.sm,
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: Spacing.sm,
        maxWidth: '80%',
    },
    messageRowMe: {
        alignSelf: 'flex-end',
    },
    messageAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
    },
    messageBubble: {
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        maxWidth: '100%',
    },
    myBubble: {},
    myBubbleGradient: {
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    otherBubble: {
        backgroundColor: Colors.card,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    messageText: {
        fontSize: FontSize.md,
        color: '#fff',
        lineHeight: 22,
    },
    otherText: {
        color: Colors.text,
    },
    timestamp: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.7)',
        alignSelf: 'flex-end',
        marginTop: 4,
    },
    otherTimestamp: {
        color: Colors.textTertiary,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.sm,
        gap: Spacing.sm,
        borderTopWidth: 1,
        borderTopColor: Colors.surfaceBorder,
        backgroundColor: Colors.background,
    },
    attachButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: Colors.card,
        borderRadius: BorderRadius.xl,
        paddingHorizontal: Spacing.md,
        paddingVertical: 8,
        minHeight: 40,
        maxHeight: 100,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
    },
    textInput: {
        flex: 1,
        fontSize: FontSize.md,
        color: Colors.text,
        paddingVertical: 0,
        lineHeight: 22,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
