import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
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
import { ErrorBanner } from '../../src/components/ErrorBanner';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';

const INSTRUMENTS = ['ボーカル', 'ギター', 'ベース', 'ドラム', 'キーボード', 'サックス', 'トランペット', 'DJ'];
const GENRES = ['Rock', 'Pop', 'Jazz', 'Metal', 'Funk', 'Blues', 'Hip Hop', 'Electronic'];
const SKILL_LEVELS = [
    { label: '初心者', value: 'beginner' },
    { label: '中級者', value: 'intermediate' },
    { label: '上級者', value: 'advanced' },
    { label: 'プロ', value: 'professional' },
];
const MATCHING_TAGS = ['メンバー募集', 'セッション相手', '音楽トーク', 'ライブ出演'];

export default function EditProfileScreen() {
    const { user, profile, refreshProfile } = useAuth();
    const [name, setName] = useState(profile?.name || user?.user_metadata?.name || '');
    const [bio, setBio] = useState(profile?.bio || '');
    const [location, setLocation] = useState(profile?.location || '');
    const [instruments, setInstruments] = useState<string[]>(profile?.instruments || []);
    const [genres, setGenres] = useState<string[]>(profile?.genres || []);
    const [skillLevel, setSkillLevel] = useState<string>(profile?.skill_level || 'beginner');
    const [lookingFor, setLookingFor] = useState<string[]>(profile?.looking_for || []);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!user) {
        return null;
    }

    const toggleTag = (currentTags: string[], tag: string, setter: (tags: string[]) => void) => {
        if (currentTags.includes(tag)) {
            setter(currentTags.filter(t => t !== tag));
        } else {
            setter([...currentTags, tag]);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('エラー', '名前を入力してください');
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            await profileService.upsertProfile({
                name: name.trim(),
                bio: bio.trim(),
                location: location.trim(),
                instruments,
                genres,
                skill_level: skillLevel as any,
                looking_for: lookingFor,
            });

            // グローバルなプロフィール状態を更新
            await refreshProfile();

            // 成功時は自動で一つ前の画面に戻る
            if (router.canGoBack()) {
                router.back();
            } else {
                router.replace('/(tabs)/profile');
            }
        } catch (err: any) {
            console.error('Profile update error:', err);
            setError(err.message || 'プロフィールの更新に失敗しました。通信状況を確認してください。');
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
                <Text style={styles.headerTitle}>プロフィール編集</Text>
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
                {/* Basic Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>基本情報</Text>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>名前</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="名前を入力"
                            placeholderTextColor={Colors.textTertiary}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>活動拠点</Text>
                        <TextInput
                            style={styles.input}
                            value={location}
                            onChangeText={setLocation}
                            placeholder="例: 東京都 渋谷区"
                            placeholderTextColor={Colors.textTertiary}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>自己紹介</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={bio}
                            onChangeText={setBio}
                            placeholder="自己紹介を入力"
                            placeholderTextColor={Colors.textTertiary}
                            multiline
                            textAlignVertical="top"
                        />
                    </View>
                </View>

                {/* Skill Level */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>スキルレベル</Text>
                    <View style={styles.tagGrid}>
                        {SKILL_LEVELS.map((level) => (
                            <TouchableOpacity
                                key={level.value}
                                style={[
                                    styles.tag,
                                    skillLevel === level.value && styles.tagActive
                                ]}
                                onPress={() => setSkillLevel(level.value)}
                            >
                                <Text style={[
                                    styles.tagText,
                                    skillLevel === level.value && styles.tagTextActive
                                ]}>{level.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Instruments */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>担当楽器（複数選択可）</Text>
                    <View style={styles.tagGrid}>
                        {INSTRUMENTS.map((item) => (
                            <TouchableOpacity
                                key={item}
                                style={[
                                    styles.tag,
                                    instruments.includes(item) && styles.tagActive
                                ]}
                                onPress={() => toggleTag(instruments, item, setInstruments)}
                            >
                                <Text style={[
                                    styles.tagText,
                                    instruments.includes(item) && styles.tagTextActive
                                ]}>{item}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Genres */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>好きなジャンル</Text>
                    <View style={styles.tagGrid}>
                        {GENRES.map((item) => (
                            <TouchableOpacity
                                key={item}
                                style={[
                                    styles.tag,
                                    genres.includes(item) && styles.tagActive
                                ]}
                                onPress={() => toggleTag(genres, item, setGenres)}
                            >
                                <Text style={[
                                    styles.tagText,
                                    genres.includes(item) && styles.tagTextActive
                                ]}>{item}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Matching Tags (looking_for) */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>マッチング目的</Text>
                    <View style={styles.tagGrid}>
                        {MATCHING_TAGS.map((item) => (
                            <TouchableOpacity
                                key={item}
                                style={[
                                    styles.tag,
                                    lookingFor.includes(item) && styles.tagActive
                                ]}
                                onPress={() => toggleTag(lookingFor, item, setLookingFor)}
                            >
                                <Text style={[
                                    styles.tagText,
                                    lookingFor.includes(item) && styles.tagTextActive
                                ]}>{item}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.infoBox}>
                    <Ionicons name="information-circle-outline" size={20} color={Colors.textSecondary} />
                    <Text style={styles.infoText}>
                        入力した情報は、マッチングアルゴリズムやプロフィールの表示に使用されます。
                    </Text>
                </View>
            </ScrollView>
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.surfaceBorder,
        backgroundColor: Colors.background,
    },
    headerButton: {
        minWidth: 44,
        alignItems: 'center',
        justifyContent: 'center',
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
        gap: Spacing.xxl,
        paddingBottom: 60,
    },
    section: {
        gap: Spacing.md,
    },
    sectionTitle: {
        fontSize: FontSize.md,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: Spacing.xs,
    },
    inputGroup: {
        gap: Spacing.xs,
        marginBottom: Spacing.md,
    },
    label: {
        fontSize: FontSize.sm,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginLeft: 4,
    },
    input: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: 12,
        color: Colors.text,
        fontSize: FontSize.md,
    },
    textArea: {
        height: 100,
    },
    tagGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    tag: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing.md,
        paddingVertical: 8,
    },
    tagActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    tagText: {
        color: Colors.textSecondary,
        fontSize: FontSize.sm,
        fontWeight: '600',
    },
    tagTextActive: {
        color: '#fff',
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        marginTop: Spacing.md,
    },
    infoText: {
        flex: 1,
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        lineHeight: 20,
    },
});
