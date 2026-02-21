import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    Image,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Animated,
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

// スケルトンコンポーネント
const SkeletonItem = () => {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    return (
        <View style={styles.item}>
            <Animated.View style={[styles.iconWrapper, { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 40, opacity }]} />
            <Animated.View style={{ width: '60%', height: 16, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, opacity }} />
        </View>
    );
};

// 個別の楽器アイテムコンポーネント
const InstrumentItem = React.memo(({ inst, isSelected, onPress, disabled, onImageLoad }: any) => {
    const localIcon = LOCAL_ICONS[inst.id] || LOCAL_ICONS[inst.icon];
    const iconKey = inst.id.toLowerCase();
    const svgName = iconKey.charAt(0).toUpperCase() + iconKey.slice(1) + 'Icon';
    const IconComponent = (CustomIcons as any)[svgName];
    const itemSize = 60;

    return (
        <TouchableOpacity
            style={[
                styles.item,
                isSelected && styles.itemSelected
            ]}
            onPress={() => onPress(inst.id)}
            activeOpacity={0.7}
            disabled={disabled}
        >
            <View style={styles.iconWrapper}>
                {localIcon ? (
                    <Image
                        source={localIcon}
                        style={[
                            { width: itemSize, height: itemSize, tintColor: Colors.textSecondary },
                            isSelected && { tintColor: Colors.primary }
                        ]}
                        resizeMode="contain"
                        fadeDuration={0}
                        onLoad={onImageLoad}
                    />
                ) : IconComponent ? (
                    <IconComponent
                        size={itemSize}
                        color={isSelected ? Colors.primary : Colors.textSecondary}
                        strokeWidth={isSelected ? 2 : 1.5}
                    />
                ) : (
                    <Ionicons
                        name="musical-notes"
                        size={itemSize * 0.25}
                        color={isSelected ? Colors.primary : Colors.textSecondary}
                    />
                )}
            </View>
            <Text
                style={[styles.label, isSelected && styles.labelSelected]}
                numberOfLines={1}
                adjustsFontSizeToFit
            >
                {inst.label}
            </Text>
            {isSelected && (
                <View style={styles.check}>
                    <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                </View>
            )}
        </TouchableOpacity>
    );
});

export default function EditInstrumentsScreen() {
    const { user, profile, refreshProfile } = useAuth();
    const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
    const [customInstrumentName, setCustomInstrumentName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showSkeleton, setShowSkeleton] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const skeletonOpacity = useRef(new Animated.Value(1)).current;
    const contentOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!showSkeleton) {
            Animated.parallel([
                Animated.timing(skeletonOpacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(contentOpacity, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                })
            ]).start();
        }
    }, [showSkeleton]);

    useEffect(() => {
        if (profile) {
            if (profile.instruments) {
                setSelectedInstruments(profile.instruments);
            }
            // 少しだけ待機してスケルトンのパルスを見せてからフェードアウトさせる（高級感）
            const timer = setTimeout(() => setShowSkeleton(false), 400);
            return () => clearTimeout(timer);
        }
    }, [profile]);

    const handleImageLoad = () => {
        // 画像読み込み完了（現在はデータ同期でフェードさせているため空で維持）
    };

    const toggleInstrument = React.useCallback((idOrLabel: string) => {
        const inst = INSTRUMENTS.find(i => i.id === idOrLabel || i.label === idOrLabel);
        const targetId = inst ? inst.id : idOrLabel;

        setSelectedInstruments(prev => {
            const isMatch = (item: string) => {
                if (inst) {
                    return item === inst.id || item === inst.label;
                }
                return item === idOrLabel;
            };

            if (prev.some(isMatch)) {
                return prev.filter(i => !isMatch(i));
            }
            return [...prev, targetId];
        });
    }, []);

    const addCustomInstrument = () => {
        const name = customInstrumentName.trim();
        if (!name) return;

        const isAlreadySelected = selectedInstruments.some(item => {
            const inst = INSTRUMENTS.find(i => i.id === item || i.label === item);
            return inst ? inst.label === name || inst.id === name : item === name;
        });

        if (isAlreadySelected) {
            Alert.alert('通知', 'その楽器は既に追加されています。');
            setCustomInstrumentName('');
            return;
        }

        const preset = INSTRUMENTS.find(i => i.label === name);
        setSelectedInstruments(prev => [...prev, preset ? preset.id : name]);
        setCustomInstrumentName('');
    };

    const handleSave = async () => {
        if (isLoading) return;
        setIsLoading(true);
        setError(null);

        try {
            const finalInstruments = [...selectedInstruments];
            if (customInstrumentName.trim()) {
                const preset = INSTRUMENTS.find(i => i.label === customInstrumentName.trim());
                const nameToAdd = preset ? preset.id : customInstrumentName.trim();
                if (!finalInstruments.includes(nameToAdd)) {
                    finalInstruments.push(nameToAdd);
                }
            }

            await profileService.upsertProfile({
                instruments: Array.from(new Set(finalInstruments)),
            });

            await refreshProfile();
            if (router.canGoBack()) router.back();
            else router.replace('/(tabs)/profile');
        } catch (err: any) {
            setError(err.message || '更新に失敗しました。');
            Alert.alert('エラー', '保存に失敗しました。');
            setIsLoading(false);
        }
    };

    const customSelected = useMemo(() =>
        selectedInstruments.filter(id => !INSTRUMENTS.some(inst => inst.id === id || inst.label === id)),
        [selectedInstruments]
    );

    // ローディング中もスケルトン表示のためにメインのJSXを返すように変更
    const isActuallyLoading = !profile;

    return (
        <View style={styles.container}>
            <LinearGradient colors={[Colors.background, Colors.backgroundSecondary]} style={StyleSheet.absoluteFill} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')} style={styles.headerButton} disabled={isLoading}>
                    <Ionicons name="chevron-back" size={28} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>担当楽器を編集</Text>
                <TouchableOpacity onPress={handleSave} disabled={isLoading} style={styles.headerButton}>
                    {isLoading ? <ActivityIndicator size="small" color={Colors.primary} /> : <Text style={styles.saveButtonText}>保存</Text>}
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                    <Text style={styles.description}>演奏できる楽器を選択してください。リストにない場合は追加できます。</Text>

                    <View style={styles.customInputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="楽器名を入力 (例: 三味線)"
                            placeholderTextColor={Colors.textTertiary}
                            value={customInstrumentName}
                            onChangeText={setCustomInstrumentName}
                            onSubmitEditing={addCustomInstrument}
                            returnKeyType="done"
                            editable={!isLoading}
                        />
                        <TouchableOpacity style={styles.addButton} onPress={addCustomInstrument} disabled={isLoading}>
                            <Ionicons name="add" size={28} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {customSelected.length > 0 && (
                        <View style={styles.customTagsContainer}>
                            {customSelected.map(name => (
                                <TouchableOpacity key={name} style={styles.customTag} onPress={() => toggleInstrument(name)} disabled={isLoading}>
                                    <Ionicons name="musical-note" size={16} color={Colors.primary} />
                                    <Text style={styles.customTagText}>{name}</Text>
                                    <View style={styles.removeCircle}><Ionicons name="close" size={12} color={Colors.textTertiary} /></View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    <View style={styles.grid}>
                        {isActuallyLoading || showSkeleton ? (
                            <Animated.View style={[styles.gridInner, { opacity: skeletonOpacity }]}>
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <SkeletonItem key={`skeleton-${i}`} />
                                ))}
                            </Animated.View>
                        ) : null}

                        <Animated.View style={[
                            styles.gridInner,
                            { opacity: contentOpacity },
                            (isActuallyLoading || showSkeleton) && { position: 'absolute', top: 0, left: 0, right: 0, zIndex: -1 }
                        ]}>
                            {INSTRUMENTS.map((inst) => (
                                <InstrumentItem
                                    key={inst.id}
                                    inst={inst}
                                    isSelected={selectedInstruments.includes(inst.id) || selectedInstruments.includes(inst.label)}
                                    onPress={toggleInstrument}
                                    disabled={isLoading}
                                    onImageLoad={handleImageLoad}
                                />
                            ))}
                        </Animated.View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    loadingFull: { justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', zIndex: 10 },
    headerButton: { width: 60, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
    saveButtonText: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '700' },
    content: { padding: Spacing.lg, paddingBottom: 40 },
    description: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.lg, lineHeight: 20 },
    customInputContainer: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
    input: { flex: 1, height: 50, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, color: Colors.text, fontSize: FontSize.md, borderWidth: 1, borderColor: Colors.surfaceBorder },
    addButton: { width: 50, height: 50, backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, justifyContent: 'center', alignItems: 'center' },
    customTagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl },
    customTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary + '15', paddingHorizontal: 12, paddingVertical: 8, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.primary + '30', gap: 6 },
    customTagText: { color: Colors.text, fontSize: FontSize.sm, fontWeight: '600' },
    removeCircle: { width: 16, height: 16, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
    grid: { position: 'relative' },
    gridInner: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, justifyContent: 'space-between', width: '100%' },
    item: { width: '47%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: BorderRadius.xl, padding: Spacing.xl, alignItems: 'center', borderWidth: 1, borderColor: Colors.surfaceBorder, position: 'relative', marginBottom: Spacing.md },
    itemSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
    iconWrapper: { width: 80, height: 80, marginBottom: Spacing.md, justifyContent: 'center', alignItems: 'center' },
    label: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textSecondary },
    labelSelected: { color: Colors.text },
    check: { position: 'absolute', top: 10, right: 10 }
});
