import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors, BorderRadius, FontSize } from '../theme';

interface InstrumentTagProps {
    icon: string;
    label: string;
    style?: ViewStyle | ViewStyle[];
    textStyle?: TextStyle | TextStyle[];
    emojiStyle?: TextStyle | TextStyle[];
}

export function InstrumentTag({ icon, label, style, textStyle, emojiStyle }: InstrumentTagProps) {
    return (
        <View style={[styles.instrumentTag, style]}>
            <Text style={[styles.tagEmoji, emojiStyle]}>{icon}</Text>
            <Text style={[styles.instrumentLabel, textStyle]}>{label}</Text>
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

export function GenreTag({ label, color, opacity = '20', style, textStyle }: GenreTagProps) {
    return (
        <View style={[styles.genreTag, { backgroundColor: color + opacity }, style]}>
            <Text style={[styles.genreLabel, { color: color }, textStyle]}>
                {label}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    instrumentTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.primary + '20',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: Colors.primary + '30',
    },
    tagEmoji: {
        fontSize: 12,
    },
    instrumentLabel: {
        fontSize: FontSize.xs,
        color: Colors.primaryLight,
        fontWeight: '600',
    },
    genreTag: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
    },
    genreLabel: {
        fontSize: FontSize.xs,
        fontWeight: '600',
    },
});
