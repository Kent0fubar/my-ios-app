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
    TextInput,
    Keyboard,
    KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { profileService } from '../../src/services/dataService';
import { locationService } from '../../src/services/locationService';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';
import { LocationPickerModal } from '../../src/components/LocationPickerModal';
import { ActionModal } from '../../src/components/common/ActionModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ITEM_HEIGHT = 60;

export default function EditInfoScreen() {
    const { user, profile, refreshProfile } = useAuth();
    const insets = useSafeAreaInsets();
    const listRef = useRef<FlatList>(null);
    const scrollViewRef = useRef<ScrollView>(null);

    // Initial States
    const [name, setName] = useState(profile?.name || user?.user_metadata?.name || '');
    const [bio, setBio] = useState(profile?.bio || '');
    const [location, setLocation] = useState(profile?.location || '');
    const [coords, setCoords] = useState({
        latitude: profile?.latitude || null,
        longitude: profile?.longitude || null
    });

    const initialDate = useMemo(() => {
        if (profile?.birthday) {
            const date = new Date(profile.birthday);
            return isNaN(date.getTime()) ? new Date(2002, 0, 1) : date;
        }
        return new Date(2002, 0, 1);
    }, [profile?.birthday]);

    const [year, setYear] = useState(initialDate.getFullYear());
    const [month, setMonth] = useState(initialDate.getMonth() + 1);
    const [day, setDay] = useState(initialDate.getDate());
    const [birthdayHidden, setBirthdayHidden] = useState(profile?.birthday_hidden || false);

    const [isSaving, setIsSaving] = useState(false);
    const [isDetectingLocation, setIsDetectingLocation] = useState(false);
    const [isMapVisible, setIsMapVisible] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [activePicker, setActivePicker] = useState<'year' | 'month' | 'day' | null>(null);

    // Modal state
    const [modalVisible, setModalVisible] = useState(false);
    const [modalConfig, setModalConfig] = useState<{
        title: string;
        message: string;
        icon: any;
        iconColor: string;
        showCancel: boolean;
        onConfirm?: () => void;
    }>({
        title: '',
        message: '',
        icon: 'information-circle-outline',
        iconColor: Colors.primary,
        showCancel: false,
    });

    // Birthday Selector Options
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

    // Adjust day if month changes
    useEffect(() => {
        const daysInMonth = new Date(year, month, 0).getDate();
        if (day > daysInMonth) {
            setDay(daysInMonth);
        }
    }, [year, month, day]);

    // Handle Keyboard Height and Visibility
    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const onKeyboardShow = (e: any) => {
            setKeyboardHeight(e.endCoordinates.height);
        };

        const onKeyboardHide = () => {
            setKeyboardHeight(0);
        };

        const showSubscription = Keyboard.addListener(showEvent, onKeyboardShow);
        const hideSubscription = Keyboard.addListener(hideEvent, onKeyboardHide);
        const frameSubscription = Keyboard.addListener('keyboardDidChangeFrame', onKeyboardShow);

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
            frameSubscription.remove();
        };
    }, []);

    // Handle Scroll for Picker
    useEffect(() => {
        if (!activePicker || !listRef.current) return;
        const data = activePicker === 'year' ? years : activePicker === 'month' ? months : days;
        let currentVal = activePicker === 'year' ? year : activePicker === 'month' ? month : day;
        if (activePicker === 'year' && year >= 2024) currentVal = 2002;
        const index = data.indexOf(currentVal);
        if (index !== -1) {
            const timer = setTimeout(() => {
                listRef.current?.scrollToIndex({ index, animated: false, viewPosition: 0.5 });
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [activePicker]);

    const handleDetectLocation = async () => {
        setIsDetectingLocation(true);
        try {
            const result = await locationService.getCurrentLocation();
            if (result) {
                setLocation(result.displayName);
                setCoords({ latitude: result.latitude, longitude: result.longitude });

                setModalConfig({
                    title: '成功',
                    message: `位置情報を取得しました：\n${result.displayName}`,
                    icon: 'checkmark-circle-outline',
                    iconColor: Colors.success,
                    showCancel: false,
                });
                setModalVisible(true);
            } else {
                setModalConfig({
                    title: 'エラー',
                    message: '位置情報の取得に失敗しました。権限設定を確認してください。',
                    icon: 'alert-circle-outline',
                    iconColor: Colors.error,
                    showCancel: false,
                });
                setModalVisible(true);
            }
        } catch (error) {
            console.error('Location detection error:', error);
            setModalConfig({
                title: 'エラー',
                message: '位置情報の取得中に不具合が発生しました。',
                icon: 'alert-circle-outline',
                iconColor: Colors.error,
                showCancel: false,
            });
            setModalVisible(true);
        } finally {
            setIsDetectingLocation(false);
        }
    };

    const handleLocationSelect = (latitude: number, longitude: number, address: string) => {
        setCoords({ latitude, longitude });
        setLocation(address);
    };
    const handleSave = async () => {
        if (!name.trim()) {
            setModalConfig({
                title: 'エラー',
                message: '名前を入力してください',
                icon: 'alert-circle-outline',
                iconColor: Colors.error,
                showCancel: false,
            });
            setModalVisible(true);
            return;
        }

        setIsSaving(true);
        try {
            const m = month.toString().padStart(2, '0');
            const d = day.toString().padStart(2, '0');
            const birthdayString = `${year}-${m}-${d}`;

            await profileService.upsertProfile({
                name: name.trim(),
                bio: bio.trim(),
                location: location.trim(),
                latitude: coords.latitude,
                longitude: coords.longitude,
                birthday: birthdayString,
                birthday_hidden: birthdayHidden,
            });
            await refreshProfile();
            router.back();
        } catch (err: any) {
            console.error('Save info error:', err);
            setModalConfig({
                title: 'エラー',
                message: '保存に失敗しました。',
                icon: 'alert-circle-outline',
                iconColor: Colors.error,
                showCancel: false,
            });
            setModalVisible(true);
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
            <Modal transparent visible={!!activePicker} animationType="slide" onRequestClose={() => setActivePicker(null)}>
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setActivePicker(null)} />
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
                            getItemLayout={(data, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.pickerItem, currentVal === item && styles.pickerItemActive]}
                                    onPress={() => {
                                        if (activePicker === 'year') setYear(item);
                                        else if (activePicker === 'month') setMonth(item);
                                        else setDay(item);
                                        setActivePicker(null);
                                    }}
                                >
                                    <Text style={[styles.pickerItemText, currentVal === item && styles.pickerItemTextActive]}>
                                        {item}{activePicker === 'year' ? '年' : activePicker === 'month' ? '月' : '日'}
                                    </Text>
                                    {currentVal === item && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
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
                <TouchableOpacity onPress={() => router.back()} style={styles.headerButton} disabled={isSaving}>
                    <Ionicons name="chevron-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>基本情報を編集</Text>
                <TouchableOpacity onPress={handleSave} disabled={isSaving} style={styles.headerButton}>
                    {isSaving ? (
                        <ActivityIndicator size="small" color={Colors.primary} />
                    ) : (
                        <Text style={styles.saveButtonText}>保存</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView
                ref={scrollViewRef}
                contentContainerStyle={[styles.content, { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 60 : Spacing.xl }]}
                keyboardShouldPersistTaps="always"
            >
                {/* Name Section */}
                <View style={styles.section}>
                    <Text style={styles.label}>名前</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        onFocus={() => setIsInputFocused(true)}
                        onBlur={() => setIsInputFocused(false)}
                        placeholder="名前を入力"
                        placeholderTextColor={Colors.textTertiary}
                    />
                </View>

                {/* Birthday Section */}
                <View style={styles.section}>
                    <Text style={styles.label}>生年月日</Text>
                    <View style={styles.dropdownContainer}>
                        <TouchableOpacity style={styles.dropdown} onPress={() => setActivePicker('year')}>
                            <Text style={styles.dropdownValue}>{year}年</Text>
                            <Ionicons name="chevron-down" size={16} color={Colors.textTertiary} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.dropdown} onPress={() => setActivePicker('month')}>
                            <Text style={styles.dropdownValue}>{month}月</Text>
                            <Ionicons name="chevron-down" size={16} color={Colors.textTertiary} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.dropdown} onPress={() => setActivePicker('day')}>
                            <Text style={styles.dropdownValue}>{day}日</Text>
                            <Ionicons name="chevron-down" size={16} color={Colors.textTertiary} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={styles.toggleRow}
                        onPress={() => setBirthdayHidden(!birthdayHidden)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.toggleText}>年齢をプロフィールで隠す</Text>
                        <Ionicons
                            name={birthdayHidden ? "eye-off" : "eye"}
                            size={20}
                            color={birthdayHidden ? Colors.textTertiary : Colors.primary}
                        />
                    </TouchableOpacity>
                </View>

                {/* Location Section */}
                <View style={styles.section}>
                    <View style={styles.rowLabel}>
                        <Text style={styles.label}>活動拠点</Text>
                        <View style={styles.locationActionRow}>
                            <TouchableOpacity
                                style={styles.detectButton}
                                onPress={handleDetectLocation}
                                disabled={isDetectingLocation}
                            >
                                {isDetectingLocation ? (
                                    <ActivityIndicator size="small" color={Colors.primary} />
                                ) : (
                                    <>
                                        <Ionicons name="location-outline" size={14} color={Colors.primary} />
                                        <Text style={styles.detectButtonText}>現在地を取得</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.detectButton}
                                onPress={() => setIsMapVisible(true)}
                            >
                                <Ionicons name="map-outline" size={14} color={Colors.primary} />
                                <Text style={styles.detectButtonText}>ピンを立てる</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={styles.locationInfoContent}>
                        <Ionicons name="location-sharp" size={20} color={Colors.primary} />
                        <Text style={[styles.locationText, !location && styles.locationPlaceholder]}>
                            {location || '未設定'}
                        </Text>
                    </View>
                    <Text style={styles.hintText}>
                        場所を変更するには、右上のボタンを使用してください。
                    </Text>
                </View>

                {/* Bio Section */}
                <View style={styles.section}>
                    <Text style={styles.label}>自己紹介</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={bio}
                        onChangeText={setBio}
                        onFocus={() => {
                            setIsInputFocused(true);
                            // 自己紹介欄が隠れないように少し遅延させてスクロール
                            setTimeout(() => {
                                scrollViewRef.current?.scrollToEnd({ animated: true });
                            }, 300);
                        }}
                        onBlur={() => setIsInputFocused(false)}
                        placeholder="自分の担当楽器や好きな音楽について書いてみましょう"
                        placeholderTextColor={Colors.textTertiary}
                        multiline
                        textAlignVertical="top"
                    />
                </View>
            </ScrollView>

            {isInputFocused && keyboardHeight > 0 && (
                <View style={[styles.customAccessoryBar, { position: 'absolute', bottom: keyboardHeight, left: 0, right: 0 }]}>
                    <TouchableOpacity
                        onPress={() => {
                            Keyboard.dismiss();
                            setIsInputFocused(false);
                        }}
                        style={styles.accessoryButton}
                    >
                        <Ionicons name="close" size={24} color={Colors.primary} />
                    </TouchableOpacity>
                </View>
            )}

            {renderPickerModal()}
            <LocationPickerModal
                visible={isMapVisible}
                onClose={() => setIsMapVisible(false)}
                onSelect={handleLocationSelect}
                initialLocation={(coords.latitude !== null && coords.longitude !== null) ? { latitude: coords.latitude, longitude: coords.longitude } : null}
            />

            <ActionModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onConfirm={() => {
                    setModalVisible(false);
                    if (modalConfig.onConfirm) modalConfig.onConfirm();
                }}
                title={modalConfig.title}
                message={modalConfig.message}
                icon={modalConfig.icon}
                iconColor={modalConfig.iconColor}
                showCancelButton={modalConfig.showCancel}
            />
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
    section: {
        gap: Spacing.sm,
    },
    rowLabel: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: {
        fontSize: FontSize.sm,
        fontWeight: '700',
        color: Colors.textSecondary,
        marginLeft: 4,
    },
    detectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
    },
    locationActionRow: {
        flexDirection: 'row',
        gap: 8,
    },
    detectButtonText: {
        fontSize: FontSize.xs,
        fontWeight: '600',
        color: Colors.primary,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
        borderRadius: BorderRadius.md,
        color: Colors.text,
        fontSize: FontSize.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: 14, // 少し高さを出してリッチに
    },
    textArea: {
        minHeight: 120,
    },
    hintText: {
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
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
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: 14,
    },
    dropdownValue: {
        color: Colors.text,
        fontSize: FontSize.md,
        fontWeight: '500', // 少し太さを抑えてモダンに
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 8,
        marginTop: 4,
        paddingRight: 4,
    },
    toggleText: {
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalBackdrop: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    modalContent: {
        backgroundColor: '#16161A',
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
        height: '50%',
        paddingBottom: 40,
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
    pickerItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        height: ITEM_HEIGHT,
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
    locationInfoContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 12,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    locationText: {
        flex: 1,
        color: Colors.text,
        fontSize: FontSize.lg,
        fontWeight: '600',
    },
    locationPlaceholder: {
        color: Colors.textTertiary,
        fontWeight: '400',
        fontSize: FontSize.md,
    },
    customAccessoryBar: {
        height: 44,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        backgroundColor: '#1A1A1E',
        paddingHorizontal: Spacing.md,
        zIndex: 9999,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.08)',
    },
    accessoryButton: {
        paddingVertical: 8,
        paddingHorizontal: 8,
    },
    keyboardAvoidingContainer: {
        flex: 1,
    },
});
