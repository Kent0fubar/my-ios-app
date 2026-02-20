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
import { supabase } from '../../src/lib/supabase';

export default function EditProfileScreen() {
    const { user, profile } = useAuth();
    const [name, setName] = useState(profile?.name || user?.user_metadata?.name || '');
    const [bio, setBio] = useState(profile?.bio || '');
    const [location, setLocation] = useState(profile?.location || '');
    const [isLoading, setIsLoading] = useState(false);

    if (!user) {
        return null;
    }

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('エラー', '名前を入力してください');
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    name: name.trim(),
                    bio: bio.trim(),
                    location: location.trim(),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id);

            if (error) throw error;

            Alert.alert('成功', 'プロフィールを更新しました', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            console.error('Profile update error:', error);
            Alert.alert('エラー', 'プロフィールの更新に失敗しました');
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
                <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
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

            <ScrollView contentContainerStyle={styles.content}>
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

                <View style={styles.infoBox}>
                    <Ionicons name="information-circle-outline" size={20} color={Colors.textSecondary} />
                    <Text style={styles.infoText}>
                        担当楽器やジャンルはマイページのリストから直接編集できます。
                    </Text>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.surfaceBorder,
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
        gap: Spacing.xl,
    },
    inputGroup: {
        gap: Spacing.xs,
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
        height: 120,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        marginTop: Spacing.lg,
    },
    infoText: {
        flex: 1,
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        lineHeight: 20,
    },
});
