import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../theme';

interface ErrorBannerProps {
    message: string;
    onClose?: () => void;
}

export function ErrorBanner({ message, onClose }: ErrorBannerProps) {
    return (
        <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color={Colors.error} />
            <Text style={styles.errorBannerText}>{message}</Text>
            {onClose && (
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Ionicons name="close" size={16} color={Colors.error} />
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.error + '15',
        borderWidth: 1,
        borderColor: Colors.error + '30',
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.lg,
    },
    errorBannerText: {
        flex: 1,
        fontSize: FontSize.sm,
        color: Colors.error,
        lineHeight: 20,
    },
    closeButton: {
        padding: 4,
    },
});
