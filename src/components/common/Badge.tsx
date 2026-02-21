import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, FontSize, Spacing } from '../../theme';

interface BadgeProps {
    label: string | number;
    icon?: keyof typeof Ionicons.glyphMap;
    variant?: 'glass' | 'solid' | 'primary' | 'premium';
    backgroundColor?: string;
    style?: ViewStyle | ViewStyle[];
    textStyle?: TextStyle | TextStyle[];
}

export function Badge({ label, icon, variant = 'glass', backgroundColor, style, textStyle }: BadgeProps) {
    let containerStyle: ViewStyle = {};
    let labelStyle: TextStyle = { color: '#fff' };
    let iconColor = '#fff';

    switch (variant) {
        case 'glass':
            containerStyle = {
                backgroundColor: backgroundColor || 'rgba(0, 0, 0, 0.7)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.2)',
            };
            break;
        case 'solid':
            containerStyle = {
                backgroundColor: backgroundColor || Colors.card,
            };
            break;
        case 'primary':
            containerStyle = {
                backgroundColor: backgroundColor || Colors.primary + '40',
                borderWidth: 1,
                borderColor: Colors.primary + '60',
            };
            break;
        case 'premium':
            containerStyle = {
                backgroundColor: 'rgba(0,0,0,0.6)',
                borderWidth: 1,
                borderColor: Colors.gold + '40',
            };
            labelStyle.color = Colors.gold;
            iconColor = Colors.gold;
            break;
    }

    return (
        <View style={[styles.badge, containerStyle, style]}>
            {icon && <Ionicons name={icon} size={14} color={iconColor} />}
            <Text style={[styles.label, labelStyle, textStyle]}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: BorderRadius.full,
        overflow: 'hidden',
    },
    label: {
        fontSize: FontSize.xs,
        fontWeight: '700',
    },
});
