import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSize, Spacing, BorderRadius } from '../../theme';

interface EmptyStateProps {
    emoji?: string;
    icon?: keyof typeof Ionicons.glyphMap;
    title: string;
    description: string;
    onButtonPress?: () => void;
    buttonText?: string;
    buttonIcon?: keyof typeof Ionicons.glyphMap;
}

export function EmptyState({
    emoji,
    icon,
    title,
    description,
    onButtonPress,
    buttonText,
    buttonIcon,
}: EmptyStateProps) {
    return (
        <View style={styles.container}>
            {emoji ? (
                <Text style={styles.emoji}>{emoji}</Text>
            ) : icon ? (
                <Ionicons name={icon} size={64} color={Colors.textTertiary} />
            ) : null}

            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>

            {onButtonPress && buttonText && (
                <TouchableOpacity onPress={onButtonPress} activeOpacity={0.8}>
                    <LinearGradient
                        colors={[Colors.primary, Colors.secondary]}
                        style={styles.button}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        {buttonIcon && <Ionicons name={buttonIcon} size={18} color="#fff" />}
                        <Text style={styles.buttonText}>{buttonText}</Text>
                    </LinearGradient>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.xl,
        gap: Spacing.md,
    },
    emoji: {
        fontSize: 64,
        marginBottom: Spacing.sm,
    },
    title: {
        fontSize: FontSize.xxl,
        fontWeight: '700',
        color: Colors.text,
        textAlign: 'center',
    },
    description: {
        fontSize: FontSize.md,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: Spacing.lg,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: 14,
        paddingHorizontal: 28,
        borderRadius: BorderRadius.xl,
        marginTop: Spacing.md,
    },
    buttonText: {
        color: '#fff',
        fontSize: FontSize.md,
        fontWeight: '700',
    },
});
