import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as CustomIcons from '../../src/components/CustomVectorIcons';
import { router } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../../src/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { profileService } from '../../src/services/dataService';
import { INSTRUMENTS } from '../../src/data/mockData';
import { ErrorBanner } from '../../src/components/ErrorBanner';

// ローカルの透過画像へのマッピング
const LOCAL_ICONS: { [key: string]: any } = {
    'guitar': require('../../assets/icons/instruments_transparent/guitar.png'),
    'bass': require('../../assets/icons/instruments_transparent/bass.png'),
    'drums': require('../../assets/icons/instruments_transparent/drums.png'),
    'vocal': require('../../assets/icons/instruments_transparent/vocal.png'),
    'keyboard': require('../../assets/icons/instruments_transparent/keyboard.png'),
    'piano': require('../../assets/icons/instruments_transparent/piano.png'),
    'saxophone': require('../../assets/icons/instruments_transparent/saxophone.png'),
    'trumpet': require('../../assets/icons/instruments_transparent/trumpet.png'),
    'violin': require('../../assets/icons/instruments_transparent/violin.png'),
    'dj': require('../../assets/icons/instruments_transparent/dj.png'),
    'producer': require('../../assets/icons/instruments_transparent/producer.png'),
    'songwriter': require('../../assets/icons/instruments_transparent/songwriter.png'),
};

export default function EditInstrumentsScreen() {
    const { user, profile, refreshProfile } = useAuth();
    const [selectedInstruments, setSelectedInstruments] = useState<string[]>(profile?.instruments || []);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!user) {
        return null;
    }

    const toggleInstrument = (id: string) => {
        const inst = INSTRUMENTS.find(i => i.id === id);
        if (!inst) return;

        setSelectedInstruments(prev => {
            const isSelected = prev.includes(id) || prev.includes(inst.label);
            if (isSelected) {
                // Remove both to normalize
                return prev.filter(i => i !== id && i !== inst.label);
            }
            return [...prev, id];
        });
    };

    const handleSave = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await profileService.upsertProfile({
                instruments: selectedInstruments,
            });

            await refreshProfile();

            if (router.canGoBack()) {
                router.back();
            } else {
                router.replace('/(tabs)/profile');
            }
        } catch (err: any) {
            console.error('Instruments update error:', err);
            setError(err.message || '担当楽器の更新に失敗しました。');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[Colors.background, Colors.backgroundSecondary]}
                style={StyleSheet.absoluteFill}
            />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')} style={styles.headerButton}>
                    <Ionicons name="chevron-back" size={28} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>担当楽器を編集</Text>
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
                    あなたが演奏できる楽器を選択してください（複数選択可）。
                </Text>

                <View style={styles.grid}>
                    {INSTRUMENTS.map((inst) => {
                        const isSelected = selectedInstruments.includes(inst.id) || selectedInstruments.includes(inst.label);
                        const IconComponent = (CustomIcons as any)[inst.icon];

                        return (
                            <TouchableOpacity
                                key={inst.id}
                                style={[
                                    styles.item,
                                    isSelected && styles.itemSelected
                                ]}
                                onPress={() => toggleInstrument(inst.id)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.iconWrapper}>
                                    {inst.icon?.startsWith('http') ? (
                                        <Image
                                            source={{ uri: inst.icon }}
                                            style={[
                                                { width: 32, height: 32, tintColor: Colors.textSecondary },
                                                isSelected && { tintColor: Colors.primary }
                                            ]}
                                            resizeMode="contain"
                                            // Storage 未準備時のフォールバック
                                            defaultSource={LOCAL_ICONS[inst.id]}
                                        />
                                    ) : LOCAL_ICONS[inst.id] ? (
                                        <Image
                                            source={LOCAL_ICONS[inst.id]}
                                            style={[
                                                { width: 32, height: 32, tintColor: Colors.textSecondary },
                                                isSelected && { tintColor: Colors.primary }
                                            ]}
                                            resizeMode="contain"
                                        />
                                    ) : IconComponent ? (
                                        <IconComponent
                                            size={32}
                                            color={isSelected ? Colors.primary : Colors.textSecondary}
                                            strokeWidth={isSelected ? 2 : 1.5}
                                        />
                                    ) : null}
                                </View>
                                <Text style={[
                                    styles.label,
                                    isSelected && styles.labelSelected
                                ]}>
                                    {inst.label}
                                </Text>
                                {isSelected && (
                                    <View style={styles.check}>
                                        <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>
        </View>
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
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
        justifyContent: 'space-between',
    },
    item: {
        width: '47%',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
        position: 'relative',
    },
    itemSelected: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primary + '10',
    },
    iconWrapper: {
        width: 48,
        height: 48,
        marginBottom: Spacing.sm,
        justifyContent: 'center',
        alignItems: 'center',
    },
    label: {
        fontSize: FontSize.md,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    labelSelected: {
        color: Colors.text,
    },
    check: {
        position: 'absolute',
        top: 8,
        right: 8,
    }
});
