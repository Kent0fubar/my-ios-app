import React, { useState } from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as CustomIcons from './CustomVectorIcons';
import { Colors, BorderRadius, FontSize } from '../theme';

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

const styles = StyleSheet.create({
    instrumentTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingLeft: 8,
        paddingRight: 16,
        paddingVertical: 8,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.primary + '50',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    instrumentLabel: {
        fontSize: FontSize.md,
        color: Colors.text,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    genreTag: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    genreLabel: {
        fontSize: FontSize.xs,
        fontWeight: '700',
        letterSpacing: 0.1,
    },
});

interface InstrumentTagProps {
    icon: string;
    label: string;
    style?: ViewStyle | ViewStyle[];
    textStyle?: TextStyle | TextStyle[];
}

export function InstrumentTag({ icon, label, style, textStyle }: InstrumentTagProps) {
    // ローカル優先ロジック: リモート参照を排除し、アプリ同梱の画像のみを使用
    // iconがURLであってもファイル名部分からローカルアセットを特定する
    const isUrl = icon && icon.startsWith('http');
    const iconKey = (isUrl
        ? icon.split('/').pop()?.split('.')[0]
        : (icon || '').replace('Icon', '').toLowerCase()) || '';

    const localIcon = LOCAL_ICONS[iconKey];

    // SVGフォールバック
    const svgName = iconKey
        ? iconKey.charAt(0).toUpperCase() + iconKey.slice(1) + 'Icon'
        : '';
    const IconComponent = (CustomIcons as any)[svgName];

    // アイコンの基本サイズ
    const iconBaseSize = 24;

    return (
        <View style={[styles.instrumentTag, style]}>
            <View style={styles.iconContainer}>
                {localIcon ? (
                    <Image
                        source={localIcon}
                        style={{ width: iconBaseSize, height: iconBaseSize, tintColor: '#FFFFFF' }}
                        resizeMode="contain"
                    />
                ) : IconComponent ? (
                    <IconComponent size={iconBaseSize - 2} color={Colors.text} strokeWidth={2} />
                ) : (
                    <Ionicons name="musical-note" size={iconBaseSize * 0.6} color={Colors.text} />
                )}
            </View>
            <Text style={[styles.instrumentLabel, textStyle]} numberOfLines={1}>{label}</Text>
        </View>
    );
}

interface GenreTagProps {
    label: string;
    color: string;
    opacity?: string;
    style?: ViewStyle | ViewStyle[];
    textStyle?: TextStyle | TextStyle[];
}

export function GenreTag({ label, color, opacity = '15', style, textStyle }: GenreTagProps) {
    return (
        <View style={[styles.genreTag, { backgroundColor: color + opacity }, style]}>
            <Text style={[styles.genreLabel, { color: color }, textStyle]}>
                {label}
            </Text>
        </View>
    );
}
