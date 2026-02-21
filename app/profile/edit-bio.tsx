import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { profileService } from '../../src/services/dataService';
import { ErrorBanner } from '../../src/components/ErrorBanner';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';

export default function EditBioScreen() {
    const { user, profile, refreshProfile } = useAuth();
    const [bio, setBio] = useState(profile?.bio || '');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!user) {
        return null;
    }

    const handleSave = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Bioだけを更新する
            await profileService.upsertProfile({
                bio: bio.trim(),
            });

            // グローバルなプロフィール状態を更新
            await refreshProfile();

            // 成功時は一つ前の画面に戻る
            if (router.canGoBack()) {
                router.back();
            } else {
                router.replace('/(tabs)/profile');
            }
        } catch (err: any) {
            console.error('Bio update error:', err);
            setError(err.message || '自己紹介の更新に失敗しました。通信状況を確認してください。');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ScreenContainer>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')} style={styles.headerButton}>
                    <Ionicons name="chevron-back" size={28} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>自己紹介を編集</Text>
                <TouchableOpacity onPress={handleSave} disabled={isLoading} style={styles.headerButton}>
                    {isLoading ? (
                        <Text style={styles.saveButtonTextDisabled}>保存中</Text>
                    ) : (
                        <Text style={styles.saveButtonText}>保存</Text>
                    )}
                </TouchableOpacity>
            </View>

            {error && (
                <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.md }}>
                    <ErrorBanner message={error} onClose={() => setError(null)} />
                </View>
            )}

            <View style={styles.content}>
                <View style={styles.section}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>自己紹介</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={bio}
                            onChangeText={setBio}
                            placeholder="自分の担当楽器や好きな音楽について書いてみましょう"
                            placeholderTextColor={Colors.textTertiary}
                            multiline
                            textAlignVertical="top"
                            autoFocus
                        />
                    </View>
                    <Text style={styles.hintText}>
                        詳細な自己紹介はマッチ率を大きく高めます。
                    </Text>
                </View>
            </View>
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    headerButton: {
        width: 60,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: Colors.text,
    },
    saveButtonText: {
        color: Colors.primary,
        fontSize: FontSize.md,
        fontWeight: '700',
    },
    saveButtonTextDisabled: {
        color: Colors.textTertiary,
        fontSize: FontSize.md,
        fontWeight: '700',
    },
    content: {
        flex: 1,
        padding: Spacing.lg,
    },
    section: {
        marginBottom: Spacing.xl,
    },
    inputGroup: {
        marginBottom: Spacing.lg,
    },
    label: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        marginBottom: Spacing.sm,
        fontWeight: '600',
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
        borderRadius: BorderRadius.md,
        color: Colors.text,
        fontSize: FontSize.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: 12,
    },
    textArea: {
        minHeight: 180,
    },
    hintText: {
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
        marginTop: 4,
    }
});
