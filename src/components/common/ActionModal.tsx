import React from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Pressable
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface ActionModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string,
    confirmText?: string,
    cancelText?: string,
    showCancelButton?: boolean,
    icon?: keyof typeof Ionicons.prototype.props.name,
    iconColor?: string
}

export const ActionModal: React.FC<ActionModalProps> = ({
    visible,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'OK',
    cancelText = 'キャンセル',
    showCancelButton = true,
    icon = 'help-circle-outline',
    iconColor = Colors.primary
}) => {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

                <Animated.View
                    entering={FadeIn}
                    exiting={FadeOut}
                    style={styles.container}
                >
                    <BlurView intensity={40} tint="dark" style={styles.blurContainer}>
                        <View style={styles.iconWrapper}>
                            <LinearGradient
                                colors={[iconColor + '40', iconColor + '10']}
                                style={styles.iconCircle}
                            >
                                <Ionicons name={icon as any} size={32} color={iconColor} />
                            </LinearGradient>
                        </View>

                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.message}>{message}</Text>

                        <View style={styles.buttonContainer}>
                            {showCancelButton && (
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={onClose}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.cancelText}>{cancelText}</Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                style={styles.confirmButtonWrapper}
                                onPress={onConfirm}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={[Colors.primary, Colors.secondary]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.confirmButton}
                                >
                                    <Text style={styles.confirmText}>{confirmText}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </BlurView>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: width * 0.85,
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    blurContainer: {
        padding: Spacing.xl,
        alignItems: 'center',
    },
    iconWrapper: {
        marginBottom: Spacing.lg,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: FontSize.lg,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: Spacing.sm,
        textAlign: 'center',
    },
    message: {
        fontSize: FontSize.md,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: Spacing.xl,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: Spacing.md,
        width: '100%',
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: BorderRadius.lg,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    cancelText: {
        color: Colors.textSecondary,
        fontSize: FontSize.md,
        fontWeight: '600',
    },
    confirmButtonWrapper: {
        flex: 2,
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
    },
    confirmButton: {
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmText: {
        color: '#fff',
        fontSize: FontSize.md,
        fontWeight: '700',
    },
});
