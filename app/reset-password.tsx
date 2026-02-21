/**
 * パスワードリセット画面
 * セキュリティ対策:
 * - メール存在有無に関わらず同じメッセージを表示（列挙防止）
 * - レート制限適用済み
 */
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '../src/theme';
import { authService } from '../src/services/authService';
import {
    validateEmail,
    sanitizeEmail,
    getSecureAuthErrorMessage,
} from '../src/lib/security';
import { ErrorBanner } from '../src/components/ErrorBanner';

export default function ResetPasswordScreen() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleReset = async () => {
        const emailResult = validateEmail(email);
        if (!emailResult.isValid) {
            setError(emailResult.error);
            return;
        }

        setError(null);
        setIsLoading(true);

        try {
            await authService.resetPassword(sanitizeEmail(email));
        } catch (e: any) {
            // エラーが発生してもレート制限以外は成功メッセージを表示
            // → メールが存在するかどうかを攻撃者に教えない
            const msg = getSecureAuthErrorMessage(e);
            if (msg.includes('しばらく')) {
                setError(msg);
                setIsLoading(false);
                return;
            }
        }

        // 常に成功メッセージを表示（セキュリティ対策）
        setSent(true);
        setIsLoading(false);
    };

    if (sent) {
        return (
            <View style={styles.container}>
                <LinearGradient
                    colors={[Colors.background, '#13102F', Colors.backgroundSecondary]}
                    style={StyleSheet.absoluteFill}
                />
                <View style={styles.successContainer}>
                    <View style={styles.successIcon}>
                        <Ionicons name="shield-checkmark" size={48} color={Colors.accent} />
                    </View>
                    <Text style={styles.successTitle}>メールを確認してください</Text>
                    <Text style={styles.successText}>
                        {sanitizeEmail(email)} にパスワードリセット用の{'\n'}
                        リンクを送信しました。{'\n\n'}
                        メール内のリンクをクリックして{'\n'}
                        新しいパスワードを設定してください。
                    </Text>
                    <Text style={styles.note}>
                        ※ メールが届かない場合は、入力したメールアドレスが正しいか確認するか、
                        迷惑メールフォルダをご覧ください。
                    </Text>
                    <TouchableOpacity
                        style={styles.backButtonFull}
                        activeOpacity={0.8}
                        onPress={() => router.replace('/login')}
                    >
                        <LinearGradient
                            colors={[Colors.primary, Colors.secondary]}
                            style={styles.backGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.backText}>ログイン画面へ</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <LinearGradient
                colors={[Colors.background, '#13102F', Colors.backgroundSecondary]}
                style={StyleSheet.absoluteFill}
            />

            <View style={styles.content}>
                {/* Back button */}
                <TouchableOpacity style={styles.backButton} onPress={() => router.canGoBack() ? router.back() : router.replace('/')}>
                    <Ionicons name="chevron-back" size={24} color={Colors.textSecondary} />
                </TouchableOpacity>

                <View style={styles.header}>
                    <View style={styles.lockIcon}>
                        <Ionicons name="key-outline" size={36} color={Colors.primary} />
                    </View>
                    <Text style={styles.title}>パスワードリセット</Text>
                    <Text style={styles.subtitle}>
                        登録したメールアドレスを入力してください。{'\n'}
                        パスワードリセット用のリンクを送信します。
                    </Text>
                </View>

                {error && <ErrorBanner message={error} />}

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>メールアドレス</Text>
                    <View style={[styles.inputWrapper, error && styles.inputError]}>
                        <Ionicons name="mail-outline" size={20} color={Colors.textTertiary} />
                        <TextInput
                            style={styles.input}
                            placeholder="example@email.com"
                            placeholderTextColor={Colors.textTertiary}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                            autoCorrect={false}
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text);
                                setError(null);
                            }}
                            returnKeyType="done"
                            onSubmitEditing={handleReset}
                        />
                    </View>
                </View>

                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleReset}
                    disabled={isLoading}
                    style={styles.resetButtonWrapper}
                >
                    <LinearGradient
                        colors={isLoading ? [Colors.card, Colors.card] : [Colors.primary, Colors.secondary]}
                        style={styles.resetButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.resetButtonText}>リセットリンクを送信</Text>
                        )}
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
    content: {
        flex: 1,
        paddingHorizontal: Spacing.lg,
    },
    backButton: {
        marginTop: 56,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
    },
    header: {
        alignItems: 'center',
        marginTop: Spacing.xxl,
        marginBottom: Spacing.xl,
        gap: Spacing.md,
    },
    lockIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.primary + '30',
    },
    title: {
        fontSize: FontSize.xxl,
        fontWeight: '900',
        color: Colors.text,
    },
    subtitle: {
        fontSize: FontSize.md,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
    },
    inputGroup: {
        marginBottom: Spacing.xl,
    },
    label: {
        fontSize: FontSize.sm,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginBottom: Spacing.sm,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.md,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
    },
    inputError: {
        borderColor: Colors.error,
    },
    input: {
        flex: 1,
        fontSize: FontSize.md,
        color: Colors.text,
        paddingVertical: 0,
    },
    resetButtonWrapper: {
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
    },
    resetButton: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: BorderRadius.xl,
    },
    resetButtonText: {
        fontSize: FontSize.lg,
        fontWeight: '800',
        color: '#fff',
    },
    // Success
    successContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.xl,
        gap: Spacing.lg,
    },
    successIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.accent + '15',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: Colors.accent + '30',
    },
    successTitle: {
        fontSize: FontSize.xxl,
        fontWeight: '800',
        color: Colors.text,
    },
    successText: {
        fontSize: FontSize.md,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 26,
    },
    note: {
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
        textAlign: 'center',
        lineHeight: 18,
    },
    backButtonFull: {
        marginTop: Spacing.md,
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        width: '100%',
    },
    backGradient: {
        paddingVertical: 16,
        alignItems: 'center',
        borderRadius: BorderRadius.xl,
    },
    backText: {
        fontSize: FontSize.lg,
        fontWeight: '800',
        color: '#fff',
    },
});
