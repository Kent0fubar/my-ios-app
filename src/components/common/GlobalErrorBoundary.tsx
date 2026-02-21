import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme';
import { log } from '../../lib/logger';
import { ScreenContainer } from './ScreenContainer';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        log.error('[GlobalErrorBoundary] Unhandled error', error, { errorInfo });
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    public render() {
        if (this.state.hasError) {
            return (
                <ScreenContainer>
                    <ScrollView contentContainerStyle={styles.container}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="alert-circle" size={80} color={Colors.error} />
                        </View>

                        <Text style={styles.title}>問題が発生しました</Text>
                        <Text style={styles.message}>
                            アプリの実行中に予期しないエラーが発生しました。ご不便をおかけして申し訳ありません。
                        </Text>

                        {__DEV__ && (
                            <View style={styles.debugContainer}>
                                <Text style={styles.debugTitle}>Debug Info:</Text>
                                <Text style={styles.debugText}>{this.state.error?.toString()}</Text>
                            </View>
                        )}

                        <TouchableOpacity style={styles.button} onPress={this.handleReset}>
                            <Text style={styles.buttonText}>再試行する</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </ScreenContainer>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.xl,
        paddingTop: 100,
    },
    iconContainer: {
        marginBottom: Spacing.xl,
        backgroundColor: Colors.error + '10',
        padding: Spacing.lg,
        borderRadius: BorderRadius.full,
    },
    title: {
        fontSize: FontSize.xxl,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: Spacing.md,
        textAlign: 'center',
    },
    message: {
        fontSize: FontSize.md,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: Spacing.xxl,
    },
    button: {
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: BorderRadius.full,
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: FontSize.lg,
        fontWeight: '700',
    },
    debugContainer: {
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.xl,
    },
    debugTitle: {
        color: Colors.error,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    debugText: {
        color: '#ccc',
        fontSize: FontSize.xs,
        fontFamily: 'Courier',
    },
});
