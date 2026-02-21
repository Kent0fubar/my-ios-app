import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { profileService } from '../../src/services/dataService';
import { TAGS } from '../../src/data/mockData';
import { ErrorBanner } from '../../src/components/ErrorBanner';

const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 15;

export default function EditTagsScreen() {
    const { user, profile, refreshProfile } = useAuth();
    const [selectedTags, setSelectedTags] = useState<string[]>(profile?.tags || []);
    const [customTagInput, setCustomTagInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!user) {
        return null;
    }

    const togglePresetTag = (tagId: string) => {
        const tag = TAGS.find(t => t.id === tagId);
        if (!tag) return;

        setSelectedTags(prev => {
            const isSelected = prev.includes(tagId) || prev.includes(tag.label);
            if (isSelected) {
                // Remove both to normalize
                return prev.filter(t => t !== tagId && t !== tag.label);
            }
            if (prev.length >= MAX_TAGS) {
                Alert.alert('上限', `タグは最大${MAX_TAGS}個までです`);
                return prev;
            }
            return [...prev, tagId];
        });
    };

    const addCustomTag = () => {
        const trimmed = customTagInput.trim();
        if (!trimmed) return;
        if (trimmed.length > MAX_TAG_LENGTH) {
            Alert.alert('エラー', `タグは${MAX_TAG_LENGTH}文字以内にしてください`);
            return;
        }
        const customId = `custom:${trimmed}`;
        if (selectedTags.includes(customId)) {
            Alert.alert('エラー', 'このタグは既に追加されています');
            return;
        }
        if (selectedTags.length >= MAX_TAGS) {
            Alert.alert('上限', `タグは最大${MAX_TAGS}個までです`);
            return;
        }
        setSelectedTags(prev => [...prev, customId]);
        setCustomTagInput('');
    };

    const removeTag = (tagId: string) => {
        setSelectedTags(prev => prev.filter(t => t !== tagId));
    };

    const handleSave = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await profileService.upsertProfile({
                tags: selectedTags,
            });

            await refreshProfile();

            if (router.canGoBack()) {
                router.back();
            } else {
                router.replace('/(tabs)/profile');
            }
        } catch (err: any) {
            console.error('Tags update error:', err);
            setError(err.message || 'マッチングタグの更新に失敗しました。');
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
                colors={[Colors.background, Colors.backgroundSecondary]}
                style={StyleSheet.absoluteFill}
            />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')} style={styles.headerButton}>
                    <Ionicons name="chevron-back" size={28} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>マッチングタグ</Text>
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
                    活動スタイルやこだわりを表現するタグを選びましょう。{'\n'}
                    最大{MAX_TAGS}個まで選択・作成できます。
                </Text>

                {/* Selected Tags Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>選択中のタグ ({selectedTags.length}/{MAX_TAGS})</Text>
                    <View style={styles.tagGrid}>
                        {selectedTags.map((tagId) => {
                            const preset = TAGS.find(t => t.id === tagId);
                            const label = preset ? preset.label : tagId.replace('custom:', '');
                            const color = preset ? preset.color : Colors.primary;
                            const icon = preset ? preset.icon : '🏷️';

                            return (
                                <TouchableOpacity
                                    key={tagId}
                                    style={[styles.selectedTag, { borderColor: color, backgroundColor: color + '15' }]}
                                    onPress={() => removeTag(tagId)}
                                >
                                    <Text style={[styles.selectedTagText, { color }]}>{label}</Text>
                                    <Ionicons name="close-circle" size={16} color={color} />
                                </TouchableOpacity>
                            );
                        })}
                        {selectedTags.length === 0 && (
                            <Text style={styles.emptyText}>タグが選択されていません</Text>
                        )}
                    </View>
                </View>

                {/* Custom Tag Input */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>カスタムタグの追加</Text>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="自由にタグを入力..."
                            placeholderTextColor={Colors.textTertiary}
                            value={customTagInput}
                            onChangeText={setCustomTagInput}
                            maxLength={MAX_TAG_LENGTH}
                            returnKeyType="done"
                            onSubmitEditing={addCustomTag}
                        />
                        <TouchableOpacity
                            style={[styles.addButton, !customTagInput.trim() && styles.addButtonDisabled]}
                            onPress={addCustomTag}
                            disabled={!customTagInput.trim()}
                        >
                            <Ionicons name="add" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Preset Tags Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>おすすめタグから選ぶ</Text>
                    <View style={styles.tagGrid}>
                        {TAGS.map((tag) => {
                            const isSelected = selectedTags.includes(tag.id) || selectedTags.includes(tag.label);
                            return (
                                <TouchableOpacity
                                    key={tag.id}
                                    style={[
                                        styles.presetTag,
                                        isSelected && styles.presetTagSelected,
                                        { borderColor: isSelected ? tag.color : 'rgba(255,255,255,0.1)' }
                                    ]}
                                    onPress={() => togglePresetTag(tag.id)}
                                >
                                    <Text style={[
                                        styles.presetTagText,
                                        { color: isSelected ? tag.color : Colors.textSecondary }
                                    ]}>
                                        {tag.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
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
    section: {
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        fontSize: FontSize.md,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: Spacing.md,
    },
    tagGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    selectedTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
    },
    selectedTagText: {
        fontSize: FontSize.sm,
        fontWeight: '600',
    },
    tagEmoji: {
        fontSize: 16,
    },
    emptyText: {
        fontSize: FontSize.sm,
        color: Colors.textTertiary,
        fontStyle: 'italic',
    },
    inputContainer: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    input: {
        flex: 1,
        height: 50,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        color: Colors.text,
        fontSize: FontSize.md,
    },
    addButton: {
        width: 50,
        height: 50,
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonDisabled: {
        opacity: 0.5,
    },
    presetTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    presetTagSelected: {
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    presetTagText: {
        fontSize: FontSize.sm,
        fontWeight: '600',
    },
});
