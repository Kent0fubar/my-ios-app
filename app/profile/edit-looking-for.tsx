import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../../src/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { profileService } from '../../src/services/dataService';
import { LOOKING_FOR } from '../../src/data/mockData';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';

export default function EditLookingForScreen() {
    const { profile, refreshProfile } = useAuth();
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (profile?.looking_for) {
            setSelectedItems(profile.looking_for);
        }
    }, [profile]);

    const toggleItem = (id: string) => {
        setSelectedItems(prev => {
            if (prev.includes(id)) {
                return prev.filter(i => i !== id);
            }
            return [...prev, id];
        });
    };

    const handleSave = async () => {
        if (isLoading) return;
        setIsLoading(true);

        try {
            await profileService.upsertProfile({
                looking_for: selectedItems,
            });

            await refreshProfile();
            router.back();
        } catch (err: any) {
            Alert.alert('エラー', '保存に失敗しました。');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ScreenContainer>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.headerButton}
                    disabled={isLoading}
                >
                    <Ionicons name="chevron-back" size={28} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>マッチング目的</Text>
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={isLoading}
                    style={styles.headerButton}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color={Colors.primary} />
                    ) : (
                        <Text style={styles.saveButtonText}>保存</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.description}>
                    あなたがこのアプリで探している目的を選択してください（複数選択可）。
                </Text>

                <View style={styles.list}>
                    {LOOKING_FOR.map((item) => {
                        const isSelected = selectedItems.includes(item.id);
                        return (
                            <TouchableOpacity
                                key={item.id}
                                style={[
                                    styles.item,
                                    isSelected && styles.itemSelected
                                ]}
                                onPress={() => toggleItem(item.id)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.icon}>{item.icon}</Text>
                                <View style={styles.textContainer}>
                                    <Text style={[styles.label, isSelected && styles.labelSelected]}>
                                        {item.label}
                                    </Text>
                                </View>
                                {isSelected ? (
                                    <Ionicons name="checkbox" size={24} color={Colors.primary} />
                                ) : (
                                    <Ionicons name="square-outline" size={24} color={Colors.textTertiary} />
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
        height: 40,
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
        backgroundColor: Colors.surface,
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
        gap: Spacing.md,
    },
    itemSelected: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primary + '10',
    },
    icon: {
        fontSize: 24,
    },
    textContainer: {
        flex: 1,
    },
    label: {
        fontSize: FontSize.md,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    labelSelected: {
        color: Colors.text,
    },
});
