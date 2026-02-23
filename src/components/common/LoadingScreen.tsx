import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    withSequence,
    withSpring,
    Easing,
    ReduceMotion
} from 'react-native-reanimated';
import { Colors, FontSize } from '../../theme';

const { width } = Dimensions.get('window');

export const LoadingScreen = () => {
    const opacity = useSharedValue(1);
    const scale = useSharedValue(0.9);

    useEffect(() => {
        // 登場アニメーション
        opacity.value = withTiming(1, {
            duration: 1000,
            easing: Easing.out(Easing.quad),
            reduceMotion: ReduceMotion.Never
        });
        scale.value = withSpring(1, {
            damping: 15,
            stiffness: 100,
            reduceMotion: ReduceMotion.Never
        });

        // パルス（鼓動）アニメーションのループ
        scale.value = withSequence(
            withSpring(1, {
                damping: 15,
                stiffness: 100,
                reduceMotion: ReduceMotion.Never
            }),
            withRepeat(
                withSequence(
                    withTiming(1.05, {
                        duration: 1500,
                        easing: Easing.inOut(Easing.ease),
                        reduceMotion: ReduceMotion.Never
                    }),
                    withTiming(1, {
                        duration: 1500,
                        easing: Easing.inOut(Easing.ease),
                        reduceMotion: ReduceMotion.Never
                    })
                ),
                -1, // 無限ループ
                true // リバース
            )
        );
    }, []);

    const logoStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value }],
    }));

    const bottomStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <View style={styles.container}>
            <View style={styles.centerContainer}>
                <Animated.View style={[styles.logoContainer, logoStyle]}>
                    <Image
                        source={require('../../../assets/splash-icon.png')}
                        style={styles.logo}
                        contentFit="contain"
                    />
                </Animated.View>
            </View>

            <Animated.View style={[styles.bottomContainer, bottomStyle]}>
                <Text style={styles.fromText}>from</Text>
                <Text style={styles.brandText}>BANDLINK</Text>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A1A',
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoContainer: {
        width: width * 0.32,
        height: width * 0.32,
        borderRadius: (width * 0.32) / 2,
        overflow: 'hidden',
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    bottomContainer: {
        position: 'absolute',
        bottom: 70,
        alignItems: 'center',
    },
    fromText: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 12,
        letterSpacing: 1.2,
        marginBottom: 8,
        fontWeight: '500',
    },
    brandText: {
        color: Colors.text,
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 4,
        textTransform: 'uppercase',
    },
});
