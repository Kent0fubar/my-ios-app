import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ScrollView,
    ActivityIndicator,
    Modal,
    Platform,
    FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { profileService } from '../../src/services/dataService';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';

const ITEM_HEIGHT = 60; // 選択肢1つの高さ

export default function EditBirthdayScreen() {
    const { profile, refreshProfile } = useAuth();
    const listRef = useRef<FlatList>(null);

    // 現在のプロフィールの生年月日を取得、なければ 2002/01/01 をデフォルトに
    const initialDate = useMemo(() => {
        if (profile?.birthday) {
            const date = new Date(profile.birthday);
            return isNaN(date.getTime()) ? new Date(2002, 0, 1) : date;
        }
        return new Date(2000, 0, 1);
    }, [profile?.birthday]);

    const [year, setYear] = useState(initialDate.getFullYear());
    const [month, setMonth] = useState(initialDate.getMonth() + 1);
    const [day, setDay] = useState(initialDate.getDate());
    const [birthdayHidden, setBirthdayHidden] = useState(profile?.birthday_hidden || false);
    const [isSaving, setIsSaving] = useState(false);

    // セレクターの表示状態
    const [activePicker, setActivePicker] = useState<'year' | 'month' | 'day' | null>(null);

    // 選択肢の生成
    const years = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const arr = [];
        for (let i = currentYear; i >= 1950; i--) arr.push(i);
        return arr;
    }, []);
    const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
    const days = useMemo(() => {
        const daysInMonth = new Date(year, month, 0).getDate();
        return Array.from({ length: daysInMonth }, (_, i) => i + 1);
    }, [year, month]);

    // モーダルが開いた時に強制スクロール
    useEffect(() => {
        if (!activePicker || !listRef.current) return;

        const data = activePicker === 'year' ? years : activePicker === 'month' ? months : days;
        let currentVal = activePicker === 'year' ? year : activePicker === 'month' ? month : day;

        // 「年」を選択し、かつ初期値（2025年など最近の年）の場合は2002年を優先表示
        if (activePicker === 'year' && year >= 2024) {
            currentVal = 2002;
        }

        const index = data.indexOf(currentVal);
        if (index !== -1) {
            // モーダルのアニメーション完了を待ってからスクロール
            const timer = setTimeout(() => {
                listRef.current?.scrollToIndex({
                    index,
                    animated: false,
                    viewPosition: 0.5, // 画面中央に来るように
                });
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [activePicker]);

    // 日付が月の日数を超えないように調整
    useEffect(() => {
        const daysInMonth = new Date(year, month, 0).getDate();
        if (day > daysInMonth) {
            setDay(daysInMonth);
        }
    }, [year, month, day]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // 月と日は2桁にパディング
            const m = month.toString().padStart(2, '0');
            const d = day.toString().padStart(2, '0');
            const dateString = `${year}-${m}-${d}`;

            await profileService.upsertProfile({
                birthday: dateString,
                birthday_hidden: birthdayHidden,
            });
            await refreshProfile();
            router.back();
        } catch (err: any) {
            console.error('Save birthday error:', err);
            Alert.alert('エラー', '保存に失敗しました。');
        } finally {
            setIsSaving(false);
        }
    };

    const renderPickerModal = () => {
        if (!activePicker) return null;

        const data = activePicker === 'year' ? years : activePicker === 'month' ? months : days;
        const currentVal = activePicker === 'year' ? year : activePicker === 'month' ? month : day;
        const title = activePicker === 'year' ? '年を選択' : activePicker === 'month' ? '月を選択' : '日を選択';

        return (
            <Modal
                transparent
                visible={!!activePicker}
                animationType="slide"
                onRequestClose={() => setActivePicker(null)}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={styles.modalBackdrop}
                        activeOpacity={1}
                        onPress={() => setActivePicker(null)}
                    />
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{title}</Text>
                            <TouchableOpacity onPress={() => setActivePicker(null)}>
                                <Ionicons name="close" size={24} color={Colors.text} />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            ref={listRef}
                            data={data}
                            keyExtractor={(item) => item.toString()}
                            getItemLayout={(data, index) => ({
                                length: ITEM_HEIGHT,
                                offset: ITEM_HEIGHT * index,
                                index,
                            })}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.pickerItem,
                                        currentVal === item && styles.pickerItemActive
                                    ]}
                                    onPress={() => {
                                        if (activePicker === 'year') setYear(item);
                                        else if (activePicker === 'month') setMonth(item);
                                        else setDay(item);
                                        setActivePicker(null);
                                    }}
                                >
                                    <Text style={[
                                        styles.pickerItemText,
                                        currentVal === item && styles.pickerItemTextActive
                                    ]}>
                                        {item}{activePicker === 'year' ? '年' : activePicker === 'month' ? '月' : '日'}
                                    </Text>
                                    {currentVal === item && (
                                        <Ionicons name="checkmark" size={20} color={Colors.primary} />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        );
    };

    return (
        <ScreenContainer>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.headerButton}
                    disabled={isSaving}
                >
                    <Ionicons name="chevron-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>生年月日</Text>
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={isSaving}
                    style={styles.headerButton}
                >
                    {isSaving ? (
                        <ActivityIndicator size="small" color={Colors.primary} />
                    ) : (
                        <Text style={styles.saveButtonText}>保存</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.infoBox}>
                    <Ionicons name="information-circle-outline" size={18} color={Colors.textTertiary} />
                    <Text style={styles.infoText}>
                        プルダウンから生年月日を選択してください。
                    </Text>
                </View>

                {/* Dropdown Selectors */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>生年月日</Text>
                    <View style={styles.dropdownContainer}>
                        {/* Year */}
                        <TouchableOpacity
                            style={styles.dropdown}
                            onPress={() => setActivePicker('year')}
                        >
                            <Text style={styles.dropdownValue}>{year}年</Text>
                            <Ionicons name="chevron-down" size={16} color={Colors.textTertiary} />
                        </TouchableOpacity>

                        {/* Month */}
                        <TouchableOpacity
                            style={styles.dropdown}
                            onPress={() => setActivePicker('month')}
                        >
                            <Text style={styles.dropdownValue}>{month}月</Text>
                            <Ionicons name="chevron-down" size={16} color={Colors.textTertiary} />
                        </TouchableOpacity>

                        {/* Day */}
                        <TouchableOpacity
                            style={styles.dropdown}
                            onPress={() => setActivePicker('day')}
                        >
                            <Text style={styles.dropdownValue}>{day}日</Text>
                            <Ionicons name="chevron-down" size={16} color={Colors.textTertiary} />
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.toggleRow}
                    onPress={() => setBirthdayHidden(!birthdayHidden)}
                    activeOpacity={0.7}
                >
                    <View style={styles.toggleContent}>
                        <Text style={styles.toggleTitle}>年齢をプロフィールで隠す</Text>
                        <Text style={styles.toggleSubtitle}>他のユーザーにあなたの年齢を表示せず「非公開」にします</Text>
                    </View>
                    <Ionicons
                        name={birthdayHidden ? "eye-off" : "eye"}
                        size={24}
                        color={birthdayHidden ? Colors.textTertiary : Colors.primary}
                    />
                </TouchableOpacity>

                <View style={styles.privacyNote}>
                    <Ionicons name="shield-checkmark-outline" size={14} color={Colors.textTertiary} />
                    <Text style={styles.privacyNoteText}>生年月日は正確な年齢確認のみに使用されます。</Text>
                </View>
            </ScrollView>

            {renderPickerModal()}
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 60 : 20,
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
        backgroundColor: Colors.background,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    headerButton: {
        width: 60,
        height: 40,
        justifyContent: 'center',
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
    content: {
        padding: Spacing.lg,
        gap: Spacing.xl,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        gap: Spacing.sm,
    },
    infoText: {
        flex: 1,
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
        lineHeight: 18,
    },
    inputGroup: {
        gap: Spacing.md,
    },
    label: {
        fontSize: FontSize.sm,
        fontWeight: '700',
        color: Colors.textSecondary,
        marginLeft: 4,
    },
    dropdownContainer: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    dropdown: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: Spacing.md,
        paddingVertical: 14,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    dropdownValue: {
        color: Colors.text,
        fontSize: FontSize.md,
        fontWeight: '600',
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        gap: Spacing.md,
        marginTop: Spacing.md,
    },
    toggleContent: {
        flex: 1,
        gap: 2,
    },
    toggleTitle: {
        fontSize: FontSize.md,
        fontWeight: '600',
        color: Colors.text,
    },
    toggleSubtitle: {
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
    },
    privacyNote: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        marginTop: Spacing.md,
    },
    privacyNoteText: {
        fontSize: 10,
        color: Colors.textTertiary,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalBackdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    modalContent: {
        backgroundColor: '#16161A', // より深い不透明な黒
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
        height: '50%',
        paddingBottom: 40,
        // 上部に少し影を付けて境界をはっきりさせる
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.surfaceBorder,
    },
    modalTitle: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: Colors.text,
    },
    pickerList: {
        flex: 1,
    },
    pickerItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        height: ITEM_HEIGHT, // 高さを固定して計算を確実にする
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    pickerItemActive: {
        backgroundColor: 'rgba(212, 175, 55, 0.05)',
    },
    pickerItemText: {
        fontSize: FontSize.md,
        color: Colors.text,
    },
    pickerItemTextActive: {
        color: Colors.primary,
        fontWeight: '700',
    },
});
