import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, LogBox } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { Asset } from 'expo-asset';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    runOnJS
} from 'react-native-reanimated';

// 特定の警告を非表示にする
LogBox.ignoreLogs([
    '[Reanimated] Reduced motion setting is enabled on this device.',
    'Sending `onAnimatedValueUpdate` with no listeners registered.'
]);

// console.warnを直接ラップして、特定の警告を完全に無視する
if (__DEV__) {
    const originalWarn = console.warn;
    console.warn = (...args) => {
        const message = args[0];
        if (typeof message === 'string') {
            if (message.includes('Reduced motion setting is enabled on this device') ||
                message.includes('onAnimatedValueUpdate')) {
                return;
            }
        }
        originalWarn(...args);
    };
}

import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { GlobalErrorBoundary } from '../src/components/common/GlobalErrorBoundary';
import { LoadingScreen } from '../src/components/common/LoadingScreen';

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

// アプリセッション中に一度だけスプラッシュを表示するためのフラグ
let hasShownSplash = false;

// 認証状態のロードが完了してからスプラッシュ画面を隠すためのラッパー
function AuthLoadedLayout() {
    const { isLoading } = useAuth();
    const [minimumTimeElapsed, setMinimumTimeElapsed] = useState(hasShownSplash);
    const [isOverlayVisible, setOverlayVisible] = useState(!hasShownSplash);

    // フェードアウト用のアニメーション値
    const overlayOpacity = useSharedValue(1);

    useEffect(() => {
        if (hasShownSplash) {
            SplashScreen.hideAsync();
            return;
        }

        // コンポーネントがマウントされたら、まずネイティブのスプラッシュ画面を隠す
        SplashScreen.hideAsync();

        // 2秒間のタイマーを設定
        const timer = setTimeout(() => {
            setMinimumTimeElapsed(true);
            hasShownSplash = true;
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    // 認証情報のロードが完了し、かつ2秒経過している場合
    const showApp = !isLoading && minimumTimeElapsed;

    // フェードアウトアニメーションの開始
    useEffect(() => {
        if (showApp && isOverlayVisible) {
            overlayOpacity.value = withTiming(0, { duration: 800 }, (finished) => {
                if (finished) {
                    runOnJS(setOverlayVisible)(false);
                }
            });
        }
    }, [showApp, isOverlayVisible]);

    const animatedOverlayStyle = useAnimatedStyle(() => ({
        opacity: overlayOpacity.value,
    }));

    return (
        <View style={{ flex: 1, backgroundColor: '#0A0A1A' }}>
            <StatusBar style="light" />

            {/* メインのアプリコンテンツ（ローディングの裏で準備） */}
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

            {/* フェードアウトするローディング画面のオーバーレイ */}
            {isOverlayVisible && (
                <Animated.View
                    style={[
                        StyleSheet.absoluteFill,
                        animatedOverlayStyle,
                        { backgroundColor: '#0A0A1A', pointerEvents: showApp ? 'none' : 'auto' }
                    ]}
                >
                    <LoadingScreen />
                </Animated.View>
            )}
        </View>
    );
}

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

    if (!appIsReady) {
        return null; // アセット読込完了までは何も描画しない
    }

    return (
        <GestureHandlerRootView style={styles.container}>
            <GlobalErrorBoundary>
                <AuthProvider>
                    <AuthLoadedLayout />
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
