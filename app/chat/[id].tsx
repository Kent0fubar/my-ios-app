import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    TextInput,
    FlatList,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/theme';
import { MOCK_USERS, INSTRUMENTS } from '../../src/data/mockData';

interface Message {
    id: string;
    text: string;
    sender: 'me' | 'other';
    timestamp: string;
}

const DEMO_MESSAGES: Message[] = [
    { id: '1', text: 'こんにちは！プロフィール見ました 🎵', sender: 'other', timestamp: '21:00' },
    { id: '2', text: 'ありがとうございます！よろしくお願いします 😊', sender: 'me', timestamp: '21:01' },
    { id: '3', text: 'ロック系のバンドを組みたいと思ってるんですが、興味ありますか？', sender: 'other', timestamp: '21:02' },
    { id: '4', text: 'めっちゃ興味あります！どんなバンドをイメージしてますか？🎸', sender: 'me', timestamp: '21:03' },
    { id: '5', text: 'ONE OK ROCKみたいな感じを目指してます！今はギターとドラムがいるんですけど、ベースとボーカルを探してて', sender: 'other', timestamp: '21:05' },
    { id: '6', text: 'いいですね！一度スタジオでセッションしませんか？', sender: 'me', timestamp: '21:06' },
];

export default function ChatScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const user = MOCK_USERS.find((u) => u.id === id) || MOCK_USERS[0];
    const [messages, setMessages] = useState<Message[]>(DEMO_MESSAGES);
    const [inputText, setInputText] = useState('');

    const mainInstrument = INSTRUMENTS.find((i) => i.id === user.instruments[0]);

    const handleSend = () => {
        if (!inputText.trim()) return;
        const newMessage: Message = {
            id: Date.now().toString(),
            text: inputText.trim(),
            sender: 'me',
            timestamp: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, newMessage]);
        setInputText('');
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isMe = item.sender === 'me';
        return (
            <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
                {!isMe && (
                    <Image source={{ uri: user.imageUrl }} style={styles.messageAvatar} />
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

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <LinearGradient
                colors={[Colors.background, Colors.backgroundSecondary]}
                style={StyleSheet.absoluteFill}
            />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.userInfo}>
                    <Image source={{ uri: user.imageUrl }} style={styles.headerAvatar} />
                    <View>
                        <Text style={styles.headerName}>{user.name}</Text>
                        <Text style={styles.headerSub}>
                            {mainInstrument?.icon} {mainInstrument?.label} • オンライン
                        </Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.moreButton}>
                    <Ionicons name="ellipsis-vertical" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
            </View>

            {/* Messages */}
            <FlatList
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messagesList}
                showsVerticalScrollIndicator={false}
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
                    <TouchableOpacity style={styles.emojiButton}>
                        <Ionicons name="happy-outline" size={22} color={Colors.textSecondary} />
                    </TouchableOpacity>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 56,
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.surfaceBorder,
        gap: Spacing.sm,
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
        color: Colors.text,
        lineHeight: 22,
    },
    otherText: {
        color: Colors.text,
    },
    timestamp: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.5)',
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
        paddingBottom: 34,
        gap: Spacing.sm,
        borderTopWidth: 1,
        borderTopColor: Colors.surfaceBorder,
        backgroundColor: 'rgba(10, 10, 26, 0.95)',
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
    emojiButton: {
        width: 28,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
