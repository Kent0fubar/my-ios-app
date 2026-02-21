import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../theme';

interface ScreenContainerProps {
    children: React.ReactNode;
    style?: ViewStyle | ViewStyle[];
    gradientColors?: readonly [string, string, ...string[]];
}

export function ScreenContainer({
    children,
    style,
    gradientColors = [Colors.background, Colors.backgroundSecondary] as const
}: ScreenContainerProps) {
    return (
        <View style={[styles.container, style]}>
            <LinearGradient
                colors={gradientColors}
                style={StyleSheet.absoluteFill}
            />
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
});
