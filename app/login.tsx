/**
 * ログイン画面
 * セキュリティ対策:
 * - 入力バリデーション & サニタイズ
 * - レート制限（authService経由）
 * - 汎用エラーメッセージ（アカウント列挙防止）
 * - パスワード表示トグル
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
import { Colors, Spacing, FontSize, BorderRadius } from '../src/theme';
import { authService } from '../src/services/authService';
import { useAuth } from '../src/contexts/AuthContext';
import {
    validateEmail,
    sanitizeEmail,
    getSecureAuthErrorMessage,
} from '../src/lib/security';
import { ErrorBanner } from '../src/components/ErrorBanner';

export default function LoginScreen() {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

    const passwordRef = useRef<TextInput>(null);

    // 認証済みならタブへリダイレクト
    React.useEffect(() => {
        if (isAuthenticated && !authLoading) {
            router.replace('/');
        }
    }, [isAuthenticated, authLoading]);

    const handleLogin = async () => {
        // バリデーション
        const newErrors: typeof errors = {};

        const emailResult = validateEmail(email);
        if (!emailResult.isValid) {
            newErrors.email = emailResult.error!;
        }

        if (!password || password.length === 0) {
            newErrors.password = 'パスワードを入力してください';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        setIsLoading(true);

        try {
            // メールアドレスをサニタイズしてからログイン
            await authService.signIn({
                email: sanitizeEmail(email),
                password, // パスワードはサニタイズしない（特殊文字を含む場合があるため）
            });

            // 成功 → タブ画面へ遷移
            router.replace('/');
        } catch (error: any) {
            // 汎用エラーメッセージでアカウント列挙を防止
            const message = getSecureAuthErrorMessage(error);
            setErrors({ general: message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAppleLogin = async () => {
        setIsLoading(true);
        setErrors({});
        try {
            const session = await authService.signInWithApple();
            if (session) {
                router.replace('/');
            }
        } catch (error: any) {
            setErrors({ general: 'Appleログインに失敗しました\n' + (error.message || '不明なエラー') });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setErrors({});
        try {
            const session = await authService.signInWithGoogle();
            if (session) {
                router.replace('/');
            }
        } catch (error: any) {
            setErrors({ general: 'Googleログインに失敗しました\n' + (error.message || '不明なエラー') });
        } finally {
            setIsLoading(false);
        }
    };

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
                {/* Header */}
                <View style={styles.header}>
                    <LinearGradient
                        colors={[Colors.primary, Colors.secondary]}
                        style={styles.logoIcon}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Ionicons name="musical-notes" size={32} color="#fff" />
                    </LinearGradient>
                    <Text style={styles.title}>おかえりなさい</Text>
                    <Text style={styles.subtitle}>
                        アカウントにログインして、音楽仲間を見つけましょう
                    </Text>
                </View>

                {/* General error */}
                {errors.general && <ErrorBanner message={errors.general} />}

                {/* Email input */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>メールアドレス</Text>
                    <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
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
                            placeholder="パスワードを入力"
                            placeholderTextColor={Colors.textTertiary}
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                            autoComplete="password"
                            autoCorrect={false}
                            value={password}
                            onChangeText={(text) => {
                                setPassword(text);
                                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                            }}
                            returnKeyType="done"
                            onSubmitEditing={handleLogin}
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
                </View>

                {/* Forgot password */}
                <TouchableOpacity
                    style={styles.forgotButton}
                    onPress={() => router.push('/reset-password')}
                >
                    <Text style={styles.forgotText}>パスワードをお忘れですか？</Text>
                </TouchableOpacity>

                {/* Login button */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleLogin}
                    disabled={isLoading}
                    style={styles.loginButtonWrapper}
                >
                    <LinearGradient
                        colors={isLoading ? [Colors.card, Colors.card] : [Colors.primary, Colors.secondary]}
                        style={styles.loginButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.loginButtonText}>ログイン</Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>または</Text>
                    <View style={styles.dividerLine} />
                </View>

                {/* Social login */}
                <TouchableOpacity
                    style={styles.socialButton}
                    activeOpacity={0.7}
                    onPress={handleAppleLogin}
                    disabled={isLoading}
                >
                    <Ionicons name="logo-apple" size={22} color={Colors.text} />
                    <Text style={styles.socialButtonText}>Appleでログイン</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.socialButton}
                    activeOpacity={0.7}
                    onPress={handleGoogleLogin}
                    disabled={isLoading}
                >
                    <Ionicons name="logo-google" size={20} color={Colors.text} />
                    <Text style={styles.socialButtonText}>Googleでログイン</Text>
                </TouchableOpacity>

                {/* Signup link */}
                <View style={styles.signupRow}>
                    <Text style={styles.signupText}>アカウントをお持ちでない方は</Text>
                    <TouchableOpacity onPress={() => router.replace('/signup')}>
                        <Text style={styles.signupLink}>新規登録</Text>
                    </TouchableOpacity>
                </View>
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
    header: {
        alignItems: 'center',
        marginTop: 80,
        marginBottom: Spacing.xl,
        gap: Spacing.md,
    },
    logoIcon: {
        width: 64,
        height: 64,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
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
        textAlign: 'center',
        lineHeight: 24,
    },
    inputGroup: {
        marginBottom: Spacing.lg,
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
        backgroundColor: 'transparent',
    },
    errorText: {
        fontSize: FontSize.xs,
        color: Colors.error,
        marginTop: 6,
        marginLeft: 4,
    },
    forgotButton: {
        alignSelf: 'flex-end',
        marginBottom: Spacing.xl,
    },
    forgotText: {
        fontSize: FontSize.sm,
        color: Colors.primary,
        fontWeight: '600',
    },
    loginButtonWrapper: {
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
    },
    loginButton: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: BorderRadius.xl,
    },
    loginButtonText: {
        fontSize: FontSize.lg,
        fontWeight: '800',
        color: '#fff',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: Spacing.xl,
        gap: Spacing.md,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.surfaceBorder,
    },
    dividerText: {
        fontSize: FontSize.sm,
        color: Colors.textTertiary,
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.md,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
        marginBottom: Spacing.md,
    },
    socialButtonText: {
        fontSize: FontSize.md,
        fontWeight: '600',
        color: Colors.text,
    },
    signupRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        marginTop: Spacing.lg,
    },
    signupText: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
    },
    signupLink: {
        fontSize: FontSize.sm,
        fontWeight: '700',
        color: Colors.primary,
    },
});
