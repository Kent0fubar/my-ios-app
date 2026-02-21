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

export default function EditLocationScreen() {
    const { user, profile, refreshProfile } = useAuth();
    const [location, setLocation] = useState(profile?.location || '');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!user) {
        return null;
    }

    const handleSave = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await profileService.upsertProfile({
                location: location.trim(),
            });

            await refreshProfile();

            if (router.canGoBack()) {
                router.back();
            } else {
                router.replace('/(tabs)/profile');
            }
        } catch (err: any) {
            console.error('Location update error:', err);
            setError(err.message || '活動拠点の更新に失敗しました。');
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
                <Text style={styles.headerTitle}>活動拠点を編集</Text>
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
                        <Text style={styles.label}>活動拠点</Text>
                        <TextInput
                            style={styles.input}
                            value={location}
                            onChangeText={setLocation}
                            placeholder="例: 東京都 渋谷区"
                            placeholderTextColor={Colors.textTertiary}
                            autoFocus
                        />
                    </View>
                    <Text style={styles.hintText}>
                        都道府県や市区町村など、主な活動場所を入力してください。
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
    hintText: {
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
        marginTop: 4,
    }
});
