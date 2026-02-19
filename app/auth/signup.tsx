/**
 * 新規登録画面
 * セキュリティ対策:
 * - パスワード強度インジケーター
 * - パスワード確認フィールド
 * - 入力バリデーション & サニタイズ
 * - レート制限（authService経由、1時間3回まで）
 * - 汎用エラーメッセージ（既存アカウントでも「確認メール送信済み」と表示）
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
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/theme';
import { authService } from '../../src/services/authService';
import {
    validateEmail,
    validatePassword,
    validateName,
    validatePasswordConfirm,
    sanitizeEmail,
    sanitizeName,
    getPasswordStrength,
    getSecureAuthErrorMessage,
} from '../../src/lib/security';

export default function SignupScreen() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errors, setErrors] = useState<{
        name?: string;
        email?: string;
        password?: string;
        confirmPassword?: string;
        general?: string;
    }>({});

    const emailRef = useRef<TextInput>(null);
    const passwordRef = useRef<TextInput>(null);
    const confirmRef = useRef<TextInput>(null);

    const passwordStrength = getPasswordStrength(password);

    const handleSignup = async () => {
        // 全フィールドのバリデーション
        const newErrors: typeof errors = {};

        const nameResult = validateName(name);
        if (!nameResult.isValid) newErrors.name = nameResult.error!;

        const emailResult = validateEmail(email);
        if (!emailResult.isValid) newErrors.email = emailResult.error!;

        const passwordResult = validatePassword(password);
        if (!passwordResult.isValid) newErrors.password = passwordResult.error!;

        const confirmResult = validatePasswordConfirm(password, confirmPassword);
        if (!confirmResult.isValid) newErrors.confirmPassword = confirmResult.error!;

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        setIsLoading(true);

        try {
            await authService.signUp({
                email: sanitizeEmail(email),
                password,
                name: sanitizeName(name),
            });

            // 常に同じメッセージを表示（既存アカウントでも同じ）
            // → アカウント列挙攻撃を防止
            setSuccess(true);
        } catch (error: any) {
            const message = getSecureAuthErrorMessage(error);

            // 「既に登録済み」の場合でも成功メッセージを表示（セキュリティ対策）
            if (message.includes('確認メール')) {
                setSuccess(true);
            } else {
                setErrors({ general: message });
            }
        } finally {
            setIsLoading(false);
        }
    };

    // 成功メッセージ画面
    if (success) {
        return (
            <View style={styles.container}>
                <LinearGradient
                    colors={[Colors.background, '#13102F', Colors.backgroundSecondary]}
                    style={StyleSheet.absoluteFill}
                />
                <View style={styles.successContainer}>
                    <View style={styles.successIcon}>
                        <Ionicons name="mail-outline" size={48} color={Colors.accent} />
                    </View>
                    <Text style={styles.successTitle}>確認メールを送信しました ✉️</Text>
                    <Text style={styles.successText}>
                        {sanitizeEmail(email)} に確認メールを送信しました。{'\n'}
                        メール内のリンクをクリックして{'\n'}
                        アカウントの認証を完了してください。
                    </Text>
                    <Text style={styles.successNote}>
                        ※ メールが届かない場合は、迷惑メールフォルダを確認してください
                    </Text>
                    <TouchableOpacity
                        style={styles.backToLoginButton}
                        activeOpacity={0.8}
                        onPress={() => router.replace('/auth/login')}
                    >
                        <LinearGradient
                            colors={[Colors.primary, Colors.secondary]}
                            style={styles.backToLoginGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.backToLoginText}>ログイン画面へ</Text>
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
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color={Colors.textSecondary} />
                </TouchableOpacity>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>アカウント作成</Text>
                    <Text style={styles.subtitle}>
                        BandLinkで音楽仲間を見つけましょう
                    </Text>
                </View>

                {/* General error */}
                {errors.general && (
                    <View style={styles.errorBanner}>
                        <Ionicons name="alert-circle" size={18} color={Colors.error} />
                        <Text style={styles.errorBannerText}>{errors.general}</Text>
                    </View>
                )}

                {/* Name input */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>名前</Text>
                    <View style={[styles.inputWrapper, errors.name && styles.inputError]}>
                        <Ionicons name="person-outline" size={20} color={Colors.textTertiary} />
                        <TextInput
                            style={styles.input}
                            placeholder="あなたの名前"
                            placeholderTextColor={Colors.textTertiary}
                            autoCapitalize="words"
                            autoCorrect={false}
                            value={name}
                            onChangeText={(text) => {
                                setName(text);
                                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                            }}
                            returnKeyType="next"
                            onSubmitEditing={() => emailRef.current?.focus()}
                            maxLength={50}
                        />
                    </View>
                    {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                </View>

                {/* Email input */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>メールアドレス</Text>
                    <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
                        <Ionicons name="mail-outline" size={20} color={Colors.textTertiary} />
                        <TextInput
                            ref={emailRef}
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
                                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                            }}
                            returnKeyType="next"
                            onSubmitEditing={() => passwordRef.current?.focus()}
                        />
                    </View>
                    {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                </View>

                {/* Password input */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>パスワード</Text>
                    <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
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
                                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
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
                    {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

                    {/* Password strength indicator */}
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

                    {/* Password requirements */}
                    {password.length > 0 && (
                        <View style={styles.requirements}>
                            <PasswordRequirement met={password.length >= 8} text="8文字以上" />
                            <PasswordRequirement met={/[A-Z]/.test(password)} text="大文字を含む" />
                            <PasswordRequirement met={/[a-z]/.test(password)} text="小文字を含む" />
                            <PasswordRequirement met={/[0-9]/.test(password)} text="数字を含む" />
                            <PasswordRequirement
                                met={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)}
                                text="特殊文字を含む"
                            />
                        </View>
                    )}
                </View>

                {/* Confirm password */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>パスワード（確認）</Text>
                    <View style={[styles.inputWrapper, errors.confirmPassword && styles.inputError]}>
                        <Ionicons name="lock-closed-outline" size={20} color={Colors.textTertiary} />
                        <TextInput
                            ref={confirmRef}
                            style={styles.input}
                            placeholder="パスワードを再入力"
                            placeholderTextColor={Colors.textTertiary}
                            secureTextEntry={!showConfirmPassword}
                            autoCapitalize="none"
                            autoCorrect={false}
                            value={confirmPassword}
                            onChangeText={(text) => {
                                setConfirmPassword(text);
                                if (errors.confirmPassword)
                                    setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                            }}
                            returnKeyType="done"
                            onSubmitEditing={handleSignup}
                        />
                        <TouchableOpacity
                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons
                                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                                size={20}
                                color={Colors.textTertiary}
                            />
                        </TouchableOpacity>
                    </View>
                    {errors.confirmPassword && (
                        <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                    )}
                </View>

                {/* Terms */}
                <Text style={styles.termsText}>
                    新規登録をすることで、
                    <Text style={styles.termsLink}>利用規約</Text>
                    と
                    <Text style={styles.termsLink}>プライバシーポリシー</Text>
                    に同意したものとみなされます。
                </Text>

                {/* Signup button */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleSignup}
                    disabled={isLoading}
                    style={styles.signupButtonWrapper}
                >
                    <LinearGradient
                        colors={isLoading ? [Colors.card, Colors.card] : [Colors.primary, Colors.secondary]}
                        style={styles.signupButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.signupButtonText}>アカウントを作成</Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                {/* Login link */}
                <View style={styles.loginRow}>
                    <Text style={styles.loginText}>すでにアカウントをお持ちの方は</Text>
                    <TouchableOpacity onPress={() => router.replace('/auth/login')}>
                        <Text style={styles.loginLink}>ログイン</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

// パスワード要件コンポーネント
function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
    return (
        <View style={reqStyles.container}>
            <Ionicons
                name={met ? 'checkmark-circle' : 'ellipse-outline'}
                size={14}
                color={met ? Colors.accent : Colors.textTertiary}
            />
            <Text style={[reqStyles.text, met && reqStyles.textMet]}>{text}</Text>
        </View>
    );
}

const reqStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    text: {
        fontSize: 12,
        color: Colors.textTertiary,
    },
    textMet: {
        color: Colors.accent,
    },
});

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
    header: {
        marginTop: Spacing.lg,
        marginBottom: Spacing.xl,
        gap: Spacing.sm,
    },
    title: {
        fontSize: FontSize.xxxl,
        fontWeight: '900',
        color: Colors.text,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: FontSize.md,
        color: Colors.textSecondary,
        lineHeight: 24,
    },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.error + '15',
        borderWidth: 1,
        borderColor: Colors.error + '30',
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.lg,
    },
    errorBannerText: {
        flex: 1,
        fontSize: FontSize.sm,
        color: Colors.error,
        lineHeight: 20,
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
    errorText: {
        fontSize: FontSize.xs,
        color: Colors.error,
        marginTop: 6,
        marginLeft: 4,
    },
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
    requirements: {
        marginTop: 10,
        gap: 4,
    },
    termsText: {
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
        lineHeight: 20,
        marginBottom: Spacing.lg,
    },
    termsLink: {
        color: Colors.primary,
        fontWeight: '600',
    },
    signupButtonWrapper: {
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
    },
    signupButton: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: BorderRadius.xl,
    },
    signupButtonText: {
        fontSize: FontSize.lg,
        fontWeight: '800',
        color: '#fff',
    },
    loginRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        marginTop: Spacing.xl,
    },
    loginText: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
    },
    loginLink: {
        fontSize: FontSize.sm,
        fontWeight: '700',
        color: Colors.primary,
    },
    // Success screen
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
        textAlign: 'center',
    },
    successText: {
        fontSize: FontSize.md,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 26,
    },
    successNote: {
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
        textAlign: 'center',
    },
    backToLoginButton: {
        marginTop: Spacing.md,
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        width: '100%',
    },
    backToLoginGradient: {
        paddingVertical: 16,
        alignItems: 'center',
        borderRadius: BorderRadius.xl,
    },
    backToLoginText: {
        fontSize: FontSize.lg,
        fontWeight: '800',
        color: '#fff',
    },
});
