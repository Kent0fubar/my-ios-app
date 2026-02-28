/**
 * パスワードリセット画面（OTPコード方式）
 * ステップ1: メールアドレス入力 → リセットメール送信
 * ステップ2: 6桁OTPコード入力 → 検証
 * ステップ3: 新パスワード設定 → 完了
 */
import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '../src/theme';
import { authService } from '../src/services/authService';
import {
    validateEmail,
    validatePassword,
    validatePasswordConfirm,
    sanitizeEmail,
    getSecureAuthErrorMessage,
    getPasswordStrength,
} from '../src/lib/security';
import { ErrorBanner } from '../src/components/ErrorBanner';

type Step = 'email' | 'otp' | 'password' | 'done';

export default function ResetPasswordScreen() {
    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const passwordRef = useRef<TextInput>(null);
    const confirmRef = useRef<TextInput>(null);

    const passwordStrength = getPasswordStrength(password);

    // ステップ1: メール送信
    const handleSendEmail = async () => {
        const emailResult = validateEmail(email);
        if (!emailResult.isValid) {
            setError(emailResult.error!);
            return;
        }

        setError(null);
        setIsLoading(true);

        try {
            await authService.resetPassword(sanitizeEmail(email));
        } catch (e: any) {
            const msg = getSecureAuthErrorMessage(e);
            if (msg.includes('しばらく')) {
                setError(msg);
                setIsLoading(false);
                return;
            }
        }

        setIsLoading(false);
        setStep('otp');
    };

    // ステップ2: OTP検証 → ステップ3へ
    const handleVerifyOtp = () => {
        if (otpCode.length < 6) {
            setError('認証コードを入力してください');
            return;
        }
        setError(null);
        setStep('password');
    };

    // ステップ3: パスワード更新
    const handleUpdatePassword = async () => {
        const passwordResult = validatePassword(password);
        if (!passwordResult.isValid) {
            setError(passwordResult.error!);
            return;
        }

        const confirmResult = validatePasswordConfirm(password, confirmPassword);
        if (!confirmResult.isValid) {
            setError(confirmResult.error!);
            return;
        }

        setError(null);
        setIsLoading(true);

        try {
            await authService.verifyOtpAndUpdatePassword(
                sanitizeEmail(email),
                otpCode,
                password
            );
            setStep('done');
        } catch (e: any) {
            setError(e.message || 'パスワードの更新に失敗しました。コードが無効か期限切れの可能性があります。');
        } finally {
            setIsLoading(false);
        }
    };

    // 再送信
    const handleResend = async () => {
        setError(null);
        setIsLoading(true);
        try {
            await authService.resetPassword(sanitizeEmail(email));
            setOtpCode('');
            setError(null);
        } catch (e: any) {
            setError('しばらくしてからもう一度お試しください。');
        } finally {
            setIsLoading(false);
        }
    };

    // ==================== 完了画面 ====================
    if (step === 'done') {
        return (
            <View style={styles.container}>
                <LinearGradient
                    colors={[Colors.background, '#13102F', Colors.backgroundSecondary]}
                    style={StyleSheet.absoluteFill}
                />
                <View style={styles.centerContainer}>
                    <View style={styles.successIcon}>
                        <Ionicons name="checkmark-circle" size={48} color={Colors.accent} />
                    </View>
                    <Text style={styles.title}>パスワードを更新しました 🎉</Text>
                    <Text style={styles.subtitle}>
                        新しいパスワードが設定されました。{'\n'}
                        次回から新しいパスワードでログインできます。
                    </Text>
                    <TouchableOpacity
                        style={styles.fullButton}
                        activeOpacity={0.8}
                        onPress={() => router.replace('/login')}
                    >
                        <LinearGradient
                            colors={[Colors.primary, Colors.secondary]}
                            style={styles.fullButtonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.fullButtonText}>ログイン画面へ</Text>
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

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Back button */}
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => {
                        if (step === 'otp') setStep('email');
                        else if (step === 'password') setStep('otp');
                        else router.canGoBack() ? router.back() : router.replace('/');
                    }}
                >
                    <Ionicons name="chevron-back" size={24} color={Colors.textSecondary} />
                </TouchableOpacity>

                {/* Step indicator */}
                <View style={styles.stepIndicator}>
                    {['email', 'otp', 'password'].map((s, i) => (
                        <View
                            key={s}
                            style={[
                                styles.stepDot,
                                (step === s || ['email', 'otp', 'password'].indexOf(step) > i) &&
                                styles.stepDotActive,
                            ]}
                        />
                    ))}
                </View>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.lockIcon}>
                        <Ionicons
                            name={
                                step === 'email'
                                    ? 'key-outline'
                                    : step === 'otp'
                                        ? 'keypad-outline'
                                        : 'lock-open-outline'
                            }
                            size={36}
                            color={Colors.primary}
                        />
                    </View>
                    <Text style={styles.title}>
                        {step === 'email'
                            ? 'パスワードリセット'
                            : step === 'otp'
                                ? '認証コードを入力'
                                : '新しいパスワード'}
                    </Text>
                    <Text style={styles.subtitle}>
                        {step === 'email'
                            ? '登録したメールアドレスを入力してください。\n認証コードを送信します。'
                            : step === 'otp'
                                ? `${sanitizeEmail(email)} に送信した\n認証コードを入力してください。`
                                : '安全な新しいパスワードを設定してください。'}
                    </Text>
                </View>

                {error && <ErrorBanner message={error} />}

                {/* ==================== ステップ1: メール入力 ==================== */}
                {step === 'email' && (
                    <>
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
                                    onSubmitEditing={handleSendEmail}
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={handleSendEmail}
                            disabled={isLoading}
                            style={styles.actionButtonWrapper}
                        >
                            <LinearGradient
                                colors={isLoading ? [Colors.card, Colors.card] : [Colors.primary, Colors.secondary]}
                                style={styles.actionButton}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.actionButtonText}>認証コードを送信</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </>
                )}

                {/* ==================== ステップ2: OTP入力 ==================== */}
                {step === 'otp' && (
                    <>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>認証コード</Text>
                            <View style={[styles.inputWrapper, error && styles.inputError]}>
                                <Ionicons name="keypad-outline" size={20} color={Colors.textTertiary} />
                                <TextInput
                                    style={[styles.input, { letterSpacing: 3, fontSize: 18, fontWeight: '800' }]}
                                    placeholder="メールに届いたコードを入力"
                                    placeholderTextColor={Colors.textTertiary}
                                    keyboardType="number-pad"
                                    autoFocus
                                    value={otpCode}
                                    onChangeText={(text) => {
                                        setOtpCode(text.replace(/[^0-9]/g, ''));
                                        setError(null);
                                    }}
                                    returnKeyType="done"
                                    onSubmitEditing={handleVerifyOtp}
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={handleVerifyOtp}
                            disabled={isLoading || otpCode.length < 6}
                            style={styles.actionButtonWrapper}
                        >
                            <LinearGradient
                                colors={
                                    otpCode.length < 6
                                        ? [Colors.card, Colors.card]
                                        : [Colors.primary, Colors.secondary]
                                }
                                style={styles.actionButton}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.actionButtonText}>確認</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.resendButton}
                            onPress={handleResend}
                            disabled={isLoading}
                        >
                            <Text style={styles.resendText}>
                                {isLoading ? '送信中...' : 'コードを再送信'}
                            </Text>
                        </TouchableOpacity>

                        <Text style={styles.noteText}>
                            ※ メールが届かない場合は迷惑メールフォルダをご確認ください。
                        </Text>
                    </>
                )}

                {/* ==================== ステップ3: 新パスワード ==================== */}
                {step === 'password' && (
                    <>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>新しいパスワード</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="lock-closed-outline" size={20} color={Colors.textTertiary} />
                                <TextInput
                                    ref={passwordRef}
                                    style={styles.input}
                                    placeholder="8文字以上の安全なパスワード"
                                    placeholderTextColor={Colors.textTertiary}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                    autoComplete="new-password"
                                    autoCorrect={false}
                                    value={password}
                                    onChangeText={(text) => {
                                        setPassword(text);
                                        setError(null);
                                    }}
                                    returnKeyType="next"
                                    onSubmitEditing={() => confirmRef.current?.focus()}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Ionicons
                                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                        size={20}
                                        color={Colors.textTertiary}
                                    />
                                </TouchableOpacity>
                            </View>

                            {password.length > 0 && (
                                <View style={styles.strengthContainer}>
                                    <View style={styles.strengthBar}>
                                        {[0, 1, 2, 3, 4].map((i) => (
                                            <View
                                                key={i}
                                                style={[
                                                    styles.strengthSegment,
                                                    {
                                                        backgroundColor:
                                                            i <= passwordStrength.score
                                                                ? passwordStrength.color
                                                                : Colors.surfaceBorder,
                                                    },
                                                ]}
                                            />
                                        ))}
                                    </View>
                                    <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                                        {passwordStrength.label}
                                    </Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>パスワード（確認）</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="lock-closed-outline" size={20} color={Colors.textTertiary} />
                                <TextInput
                                    ref={confirmRef}
                                    style={styles.input}
                                    placeholder="パスワードを再入力"
                                    placeholderTextColor={Colors.textTertiary}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    value={confirmPassword}
                                    onChangeText={(text) => {
                                        setConfirmPassword(text);
                                        setError(null);
                                    }}
                                    returnKeyType="done"
                                    onSubmitEditing={handleUpdatePassword}
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={handleUpdatePassword}
                            disabled={isLoading}
                            style={styles.actionButtonWrapper}
                        >
                            <LinearGradient
                                colors={isLoading ? [Colors.card, Colors.card] : [Colors.primary, Colors.secondary]}
                                style={styles.actionButton}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.actionButtonText}>パスワードを更新</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: Spacing.lg,
        paddingBottom: 40,
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
    stepIndicator: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginTop: Spacing.lg,
    },
    stepDot: {
        width: 32,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.surfaceBorder,
    },
    stepDotActive: {
        backgroundColor: Colors.primary,
    },
    header: {
        alignItems: 'center',
        marginTop: Spacing.xl,
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
        marginBottom: Spacing.md,
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
        backgroundColor: '#1E1E24',
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
        backgroundColor: '#1E1E24',
    },
    // OTP
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
        marginBottom: Spacing.xl,
    },
    otpInput: {
        width: 48,
        height: 56,
        borderRadius: BorderRadius.lg,
        backgroundColor: '#1E1E24',
        borderWidth: 2,
        borderColor: Colors.surfaceBorder,
        textAlign: 'center',
        fontSize: 24,
        fontWeight: '800',
        color: Colors.text,
    },
    otpInputFilled: {
        borderColor: Colors.primary,
    },
    resendButton: {
        alignItems: 'center',
        marginTop: Spacing.lg,
        padding: Spacing.md,
    },
    resendText: {
        fontSize: FontSize.sm,
        color: Colors.primary,
        fontWeight: '600',
    },
    noteText: {
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
        textAlign: 'center',
        marginTop: Spacing.sm,
        lineHeight: 18,
    },
    // Password strength
    strengthContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginTop: 8,
    },
    strengthBar: {
        flex: 1,
        flexDirection: 'row',
        gap: 4,
    },
    strengthSegment: {
        flex: 1,
        height: 4,
        borderRadius: 2,
    },
    strengthLabel: {
        fontSize: 11,
        fontWeight: '600',
        minWidth: 60,
        textAlign: 'right',
    },
    // Action button
    actionButtonWrapper: {
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        marginTop: Spacing.sm,
    },
    actionButton: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: BorderRadius.xl,
    },
    actionButtonText: {
        fontSize: FontSize.lg,
        fontWeight: '800',
        color: '#fff',
    },
    // Done
    centerContainer: {
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
    fullButton: {
        marginTop: Spacing.md,
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        width: '100%',
    },
    fullButtonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
        borderRadius: BorderRadius.xl,
    },
    fullButtonText: {
        fontSize: FontSize.lg,
        fontWeight: '800',
        color: '#fff',
    },
});
