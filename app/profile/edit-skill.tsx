import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { profileService } from '../../src/services/dataService';
import { SKILL_LEVELS } from '../../src/data/mockData';
import { ErrorBanner } from '../../src/components/ErrorBanner';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';

export default function EditSkillScreen() {
    const { user, profile, refreshProfile } = useAuth();
    const [selectedSkill, setSelectedSkill] = useState<string>(profile?.skill_level || 'beginner');
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
                skill_level: selectedSkill as any,
            });

            await refreshProfile();

            if (router.canGoBack()) {
                router.back();
            } else {
                router.replace('/(tabs)/profile');
            }
        } catch (err: any) {
            console.error('Skill level update error:', err);
            setError(err.message || 'スキルレベルの更新に失敗しました。');
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
                <Text style={styles.headerTitle}>スキルレベル</Text>
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

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.description}>
                    現在のあなたの演奏スキルに最も近いレベルを選んでください。
                </Text>

                <View style={styles.list}>
                    {SKILL_LEVELS.map((level) => {
                        const isSelected = selectedSkill === level.id;
                        return (
                            <TouchableOpacity
                                key={level.id}
                                style={[
                                    styles.item,
                                    isSelected && styles.itemSelected
                                ]}
                                onPress={() => setSelectedSkill(level.id)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.icon}>{level.icon}</Text>
                                <View style={styles.textContainer}>
                                    <Text style={[
                                        styles.label,
                                        isSelected && styles.labelSelected
                                    ]}>
                                        {level.label}
                                    </Text>
                                    <Text style={styles.itemDescription}>{level.description}</Text>
                                </View>
                                {isSelected && (
                                    <Ionicons name="radio-button-on" size={24} color={Colors.primary} />
                                ) || (
                                        <Ionicons name="radio-button-off" size={24} color={Colors.textTertiary} />
                                    )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>
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
        padding: Spacing.lg,
    },
    description: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        marginBottom: Spacing.xl,
        lineHeight: 20,
    },
    list: {
        gap: Spacing.md,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
        gap: Spacing.md,
    },
    itemSelected: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primary + '10',
    },
    icon: {
        fontSize: 32,
    },
    textContainer: {
        flex: 1,
    },
    label: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: Colors.textSecondary,
    },
    labelSelected: {
        color: Colors.text,
    },
    itemDescription: {
        fontSize: FontSize.sm,
        color: Colors.textTertiary,
        marginTop: 2,
    }
});
