import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { profileService } from '../../src/services/dataService';
import { GENRES } from '../../src/data/mockData';
import { ErrorBanner } from '../../src/components/ErrorBanner';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';

export default function EditGenresScreen() {
    const { user, profile, refreshProfile } = useAuth();
    const [selectedGenres, setSelectedGenres] = useState<string[]>(profile?.genres || []);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!user) {
        return null;
    }

    const toggleGenre = (id: string) => {
        const genre = GENRES.find(g => g.id === id);
        if (!genre) return;

        setSelectedGenres(prev => {
            const isSelected = prev.includes(id) || prev.includes(genre.label);
            if (isSelected) {
                // Remove both to normalize
                return prev.filter(g => g !== id && g !== genre.label);
            }
            return [...prev, id];
        });
    };

    const handleSave = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await profileService.upsertProfile({
                genres: selectedGenres,
            });

            await refreshProfile();

            if (router.canGoBack()) {
                router.back();
            } else {
                router.replace('/(tabs)/profile');
            }
        } catch (err: any) {
            console.error('Genres update error:', err);
            setError(err.message || '好きなジャンルの更新に失敗しました。');
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
                <Text style={styles.headerTitle}>好きなジャンル</Text>
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
                    好きな音楽ジャンルをすべて選択してください。マッチングの参考にされます。
                </Text>

                <View style={styles.tagGrid}>
                    {GENRES.map((genre) => {
                        const isSelected = selectedGenres.includes(genre.id) || selectedGenres.includes(genre.label);
                        return (
                            <TouchableOpacity
                                key={genre.id}
                                style={[
                                    styles.tag,
                                    { borderColor: genre.color + '40', backgroundColor: isSelected ? genre.color : 'rgba(255,255,255,0.05)' }
                                ]}
                                onPress={() => toggleGenre(genre.id)}
                                activeOpacity={0.7}
                            >
                                <Text style={[
                                    styles.tagText,
                                    { color: isSelected ? '#fff' : genre.color }
                                ]}>
                                    {genre.label}
                                </Text>
                                {isSelected && (
                                    <Ionicons name="checkmark" size={16} color="#fff" />
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
    tagGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
    },
    tagText: {
        fontSize: FontSize.md,
        fontWeight: '600',
    }
});
