import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { Asset } from 'expo-asset';

import { AuthProvider } from '../src/contexts/AuthContext';
import { GlobalErrorBoundary } from '../src/components/common/GlobalErrorBoundary';

// プリロードするアセット
const INSTRUMENT_ICONS = [
    require('../assets/icons/instruments_transparent/guitar.png'),
    require('../assets/icons/instruments_transparent/bass.png'),
    require('../assets/icons/instruments_transparent/drums.png'),
    require('../assets/icons/instruments_transparent/vocal.png'),
    require('../assets/icons/instruments_transparent/keyboard.png'),
    require('../assets/icons/instruments_transparent/piano.png'),
    require('../assets/icons/instruments_transparent/saxophone.png'),
    require('../assets/icons/instruments_transparent/trumpet.png'),
    require('../assets/icons/instruments_transparent/violin.png'),
    require('../assets/icons/instruments_transparent/dj.png'),
    require('../assets/icons/instruments_transparent/producer.png'),
    require('../assets/icons/instruments_transparent/songwriter.png'),
];

// スプラッシュ画面を自動的に隠さないように設定
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [appIsReady, setAppIsReady] = useState(false);

    useEffect(() => {
        async function prepare() {
            try {
                // アセットのプリロード
                const cacheImages = INSTRUMENT_ICONS.map(image => {
                    return Asset.fromModule(image).downloadAsync();
                });
                await Promise.all(cacheImages);
            } catch (e) {
                console.warn('[RootLayout] Error pre-loading assets:', e);
            } finally {
                setAppIsReady(true);
            }
        }

        prepare();
    }, []);

    useEffect(() => {
        if (appIsReady) {
            // アセットの準備ができたらスプラッシュ画面を隠す
            SplashScreen.hideAsync();
        }
    }, [appIsReady]);

    if (!appIsReady) {
        return null;
    }

    return (
        <GestureHandlerRootView style={styles.container}>
            <GlobalErrorBoundary>
                <AuthProvider>
                    <StatusBar style="light" />
                    <Stack
                        screenOptions={{
                            headerShown: false,
                            contentStyle: { backgroundColor: '#0A0A1A' },
                            animation: 'slide_from_right',
                        }}
                    >
                        <Stack.Screen name="index" />
                        <Stack.Screen name="login" />
                        <Stack.Screen name="signup" />
                        <Stack.Screen name="reset-password" />
                        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
                        <Stack.Screen
                            name="premium"
                            options={{
                                presentation: 'modal',
                                animation: 'slide_from_bottom',
                            }}
                        />
                        <Stack.Screen name="chat/[id]" />
                    </Stack>
                </AuthProvider>
            </GlobalErrorBoundary>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A1A',
    },
});
