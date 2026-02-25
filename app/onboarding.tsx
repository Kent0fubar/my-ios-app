import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../src/theme';
import { useAuth } from '../src/contexts/AuthContext';
import { profileService } from '../src/services/dataService';

const INSTRUMENTS = ['Guitar', 'Bass', 'Drums', 'Vocal', 'Keyboard', 'Piano', 'Saxophone', 'Trumpet', 'Violin', 'DJ', 'Producer', 'Songwriter'];
const GENRES = ['Rock', 'Pop', 'Jazz', 'Blues', 'Metal', 'Hip Hop', 'R&B', 'Electronic', 'Classical', 'Folk', 'Country', 'Punk'];

export default function OnboardingScreen() {
    const { profile, refreshProfile } = useAuth();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [name, setName] = useState(profile?.name || '');
    const [age, setAge] = useState(profile?.age?.toString() || '');
    const [bio, setBio] = useState(profile?.bio || '');
    const [selectedInstruments, setSelectedInstruments] = useState<string[]>(profile?.instruments || []);
    const [selectedGenres, setSelectedGenres] = useState<string[]>(profile?.genres || []);

    const toggleSelection = (item: string, list: string[], setList: (items: string[]) => void) => {
        if (list.includes(item)) {
            setList(list.filter((i) => i !== item));
        } else {
            setList([...list, item]);
        }
    };

    const handleNext = () => {
        if (step === 1 && (!name || !age)) {
            Alert.alert('入力エラー', '名前と年齢を入力してください');
            return;
        }
        if (step === 2 && selectedInstruments.length === 0) {
            Alert.alert('入力エラー', '担当楽器を1つ以上選択してください');
            return;
        }
        if (step < 3) {
            setStep(step + 1);
        } else {
            handleSubmit();
        }
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            await profileService.upsertProfile({
                name,
                age: parseInt(age, 10),
                bio,
                instruments: selectedInstruments,
                genres: selectedGenres,
            });
            await refreshProfile();
            router.replace('/(tabs)/discover');
        } catch (error: any) {
            Alert.alert('エラー', 'プロフィールの保存に失敗しました: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <View style={styles.progressContainer}>
                {[1, 2, 3].map((s) => (
                    <View
                        key={s}
                        style={[
                            styles.progressBar,
                            s <= step ? styles.progressBarActive : styles.progressBarInactive,
                        ]}
                    />
                ))}
            </View>
            <Text style={styles.stepTitle}>
                {step === 1 ? '基本情報を教えてください' : step === 2 ? 'あなたの音楽について' : '自己紹介'}
            </Text>
            <Text style={styles.stepSubtitle}>
                {step === 1 ? 'マッチングのために必要な情報です' : step === 2 ? 'どんな楽器やジャンルが得意ですか？' : '魅力的なプロフィールにしましょう'}
            </Text>
        </View>
    );

    const renderStep1 = () => (
        <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepContainer}>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>ニックネーム</Text>
                <TextInput
                    style={styles.input}
                    placeholder="名前を入力"
                    placeholderTextColor={Colors.textTertiary}
                    value={name}
                    onChangeText={setName}
                />
            </View>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>年齢</Text>
                <TextInput
                    style={styles.input}
                    placeholder="20"
                    placeholderTextColor={Colors.textTertiary}
                    value={age}
                    onChangeText={(val) => setAge(val.replace(/[^0-9]/g, ''))}
                    keyboardType="number-pad"
                    maxLength={2}
                />
            </View>
        </Animated.View>
    );

    const renderStep2 = () => (
        <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepContainer}>
            <Text style={styles.label}>担当楽器（複数選択可）</Text>
            <View style={styles.chipContainer}>
                {INSTRUMENTS.map((item) => (
                    <TouchableOpacity
                        key={item}
                        style={[
                            styles.chip,
                            selectedInstruments.includes(item) && styles.chipActive,
                        ]}
                        onPress={() => toggleSelection(item, selectedInstruments, setSelectedInstruments)}
                    >
                        <Text style={[styles.chipText, selectedInstruments.includes(item) && styles.chipTextActive]}>
                            {item}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={[styles.label, { marginTop: Spacing.lg }]}>好きなジャンル</Text>
            <View style={styles.chipContainer}>
                {GENRES.map((item) => (
                    <TouchableOpacity
                        key={item}
                        style={[
                            styles.chip,
                            selectedGenres.includes(item) && styles.chipActive,
                        ]}
                        onPress={() => toggleSelection(item, selectedGenres, setSelectedGenres)}
                    >
                        <Text style={[styles.chipText, selectedGenres.includes(item) && styles.chipTextActive]}>
                            {item}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </Animated.View>
    );

    const renderStep3 = () => (
        <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepContainer}>
            <Text style={styles.label}>自己紹介文（任意）</Text>
            <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="活動実績や好きなアーティスト、バンドを組みたい理由などを自由に書いてください"
                placeholderTextColor={Colors.textTertiary}
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
            />
        </Animated.View>
    );

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <LinearGradient colors={[Colors.background, '#121216']} style={StyleSheet.absoluteFill} />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.topDecoration}>
                    <Ionicons name="sparkles" size={48} color={Colors.gold} />
                </View>

                {renderHeader()}

                <View style={styles.content}>
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                </View>

                <View style={styles.footer}>
                    {step > 1 && (
                        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                            <Ionicons name="arrow-back" size={24} color={Colors.textSecondary} />
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={[styles.nextButton, step === 1 && { marginLeft: 'auto' }]}
                        onPress={handleNext}
                        disabled={isLoading}
                    >
                        <LinearGradient
                            colors={[Colors.goldGradientStart, Colors.goldGradientEnd]}
                            style={styles.nextButtonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#000" />
                            ) : (
                                <>
                                    <Text style={styles.nextButtonText}>
                                        {step === 3 ? '始める' : '次へ'}
                                    </Text>
                                    <Ionicons
                                        name={step === 3 ? 'checkmark' : 'arrow-forward'}
                                        size={20}
                                        color="#000"
                                    />
                                </>
                            )}
                        </LinearGradient>
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
        padding: Spacing.lg,
    },
    topDecoration: {
        alignItems: 'center',
        marginTop: 60,
        marginBottom: Spacing.xl,
    },
    header: {
        marginBottom: Spacing.xl,
    },
    progressContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: Spacing.lg,
    },
    progressBar: {
        flex: 1,
        height: 4,
        borderRadius: 2,
    },
    progressBarActive: {
        backgroundColor: Colors.gold,
    },
    progressBarInactive: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    stepTitle: {
        fontSize: FontSize.xxl,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: Spacing.xs,
    },
    stepSubtitle: {
        fontSize: FontSize.md,
        color: Colors.textSecondary,
    },
    content: {
        flex: 1,
    },
    stepContainer: {
        flex: 1,
    },
    inputGroup: {
        marginBottom: Spacing.lg,
    },
    label: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        marginBottom: Spacing.sm,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    input: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        color: Colors.text,
        fontSize: FontSize.md,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
    },
    textArea: {
        height: 150,
        paddingTop: Spacing.md,
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
    },
    chipActive: {
        backgroundColor: 'rgba(212, 175, 55, 0.2)',
        borderColor: Colors.gold,
    },
    chipText: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
    },
    chipTextActive: {
        color: Colors.gold,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Spacing.xxl,
        paddingBottom: Spacing.xl,
    },
    backButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    nextButton: {
        flex: 1,
        height: 56,
        borderRadius: 28,
        overflow: 'hidden',
        ...Shadow.md,
    },
    nextButtonGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    nextButtonText: {
        fontSize: FontSize.lg,
        fontWeight: 'bold',
        color: '#000',
    },
});
