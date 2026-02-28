/**
 * 新しいパスワード設定画面
 * パスワードリセットリンクからアプリに戻った後に表示される
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
import { supabase } from '../src/lib/supabase';
import {
    validatePassword,
    validatePasswordConfirm,
    getPasswordStrength,
} from '../src/lib/security';
import { ErrorBanner } from '../src/components/ErrorBanner';

export default function UpdatePasswordScreen() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<{
        password?: string;
        confirmPassword?: string;
        general?: string;
    }>({});
    const [success, setSuccess] = useState(false);

    const confirmRef = useRef<TextInput>(null);

    const passwordStrength = getPasswordStrength(password);

    const handleUpdate = async () => {
        const newErrors: typeof errors = {};

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
            const { error } = await supabase.auth.updateUser({
                password,
            });

            if (error) throw error;

            setSuccess(true);
        } catch (error: any) {
            setErrors({
                general: error.message || 'パスワードの更新に失敗しました。もう一度お試しください。',
            });
        } finally {
            setIsLoading(false);
        }
    };

    // 成功画面
    if (success) {
        return (
            <View style={styles.container}>
                <LinearGradient
                    colors={[Colors.background, '#13102F', Colors.backgroundSecondary]}
                    style={StyleSheet.absoluteFill}
                />
                <View style={styles.successContainer}>
                    <View style={styles.successIcon}>
                        <Ionicons name="checkmark-circle" size={48} color={Colors.accent} />
                    </View>
                    <Text style={styles.successTitle}>パスワードを更新しました 🎉</Text>
                    <Text style={styles.successText}>
                        新しいパスワードが正常に設定されました。{'\n'}
                        次回から新しいパスワードでログインできます。
                    </Text>
                    <TouchableOpacity
                        style={styles.successButton}
                        activeOpacity={0.8}
                        onPress={() => router.replace('/')}
                    >
                        <LinearGradient
                            colors={[Colors.primary, Colors.secondary]}
                            style={styles.successButtonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.successButtonText}>アプリに戻る</Text>
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
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.lockIcon}>
                        <Ionicons name="lock-open-outline" size={36} color={Colors.primary} />
                    </View>
                    <Text style={styles.title}>新しいパスワードを設定</Text>
                    <Text style={styles.subtitle}>
                        安全な新しいパスワードを入力してください
                    </Text>
                </View>

                {/* General error */}
                {errors.general && <ErrorBanner message={errors.general} />}

                {/* New password input */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>新しいパスワード</Text>
                    <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
                        <Ionicons name="lock-closed-outline" size={20} color={Colors.textTertiary} />
                        <TextInput
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
                            onSubmitEditing={handleUpdate}
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

                {/* Update button */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleUpdate}
                    disabled={isLoading}
                    style={styles.updateButtonWrapper}
                >
                    <LinearGradient
                        colors={isLoading ? [Colors.card, Colors.card] : [Colors.primary, Colors.secondary]}
                        style={styles.updateButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.updateButtonText}>パスワードを更新</Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
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
        paddingTop: 60,
        paddingBottom: 40,
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
    updateButtonWrapper: {
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        marginTop: Spacing.lg,
    },
    updateButton: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: BorderRadius.xl,
    },
    updateButtonText: {
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
        textAlign: 'center',
    },
    successText: {
        fontSize: FontSize.md,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 26,
    },
    successButton: {
        marginTop: Spacing.md,
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        width: '100%',
    },
    successButtonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
        borderRadius: BorderRadius.xl,
    },
    successButtonText: {
        fontSize: FontSize.lg,
        fontWeight: '800',
        color: '#fff',
    },
});
