import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
} from 'react-native';
import MapView, { Marker, Region, MapPressEvent } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { ActionModal } from './common/ActionModal';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../theme';

interface LocationPickerModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (latitude: number, longitude: number, address: string) => void;
    initialLocation?: { latitude: number; longitude: number } | null;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
    visible,
    onClose,
    onSelect,
    initialLocation,
}) => {
    const [selectedCoords, setSelectedCoords] = useState<{ latitude: number; longitude: number } | null>(null);
    const [region, setRegion] = useState<Region | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [addressText, setAddressText] = useState<string>('');
    const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);

    useEffect(() => {
        if (visible) {
            if (initialLocation && initialLocation.latitude && initialLocation.longitude) {
                const loc = { latitude: initialLocation.latitude, longitude: initialLocation.longitude };
                setSelectedCoords(loc);
                updateRegionAndAddress(loc.latitude, loc.longitude);
            } else {
                fetchCurrentLocation();
            }
        }
    }, [visible]);

    const fetchCurrentLocation = async () => {
        setIsLoading(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setIsLoading(false);
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            const loc = { latitude: location.coords.latitude, longitude: location.coords.longitude };
            setSelectedCoords(loc);
            updateRegionAndAddress(loc.latitude, loc.longitude);
        } catch (error) {
            console.error('Error fetching location:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const updateRegionAndAddress = async (lat: number, lon: number) => {
        setRegion({
            latitude: lat,
            longitude: lon,
            latitudeDelta: 0.0122,
            longitudeDelta: 0.0121,
        });

        try {
            const [geocode] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
            if (geocode) {
                setAddressText(`${geocode.region || ''}${geocode.city || ''}${geocode.district || ''}`);
            }
        } catch (error) {
            console.error('Reverse geocode error:', error);
        }
    };

    const handleMapPress = (e: MapPressEvent) => {
        const coords = e.nativeEvent.coordinate;
        setSelectedCoords(coords);
        updateRegionAndAddress(coords.latitude, coords.longitude);
    };

    const handleConfirm = () => {
        if (selectedCoords) {
            setConfirmationModalVisible(true);
        }
    };

    const finalizeSelection = () => {
        if (selectedCoords) {
            setConfirmationModalVisible(false);
            // ダイアログが消える時間を少し待ってから全体を閉じることで、
            // 重なったモーダルがフリーズするのを防ぐ
            setTimeout(() => {
                onSelect(selectedCoords.latitude, selectedCoords.longitude, addressText);
                onClose();
            }, 100);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color={Colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>場所をピン留め</Text>
                    <View style={{ width: 40 }} />
                </View>

                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                        <Text style={styles.loadingText}>地図を準備中...</Text>
                    </View>
                ) : (
                    <View style={styles.mapContainer}>
                        <MapView
                            style={styles.map}
                            initialRegion={region || undefined}
                            region={region || undefined}
                            onPress={handleMapPress}
                            showsUserLocation
                            userInterfaceStyle="dark"
                        >
                            {selectedCoords && (
                                <Marker
                                    coordinate={selectedCoords}
                                    draggable
                                    onDragEnd={(e) => handleMapPress({ nativeEvent: { coordinate: e.nativeEvent.coordinate } } as any)}
                                />
                            )}
                        </MapView>

                        <View style={styles.footer}>
                            <View style={styles.addressInfo}>
                                <Ionicons name="location" size={18} color={Colors.primary} />
                                <Text style={styles.addressText} numberOfLines={2}>
                                    {addressText || '地図をタップして場所を選択してください'}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={[styles.confirmButton, !selectedCoords && styles.confirmButtonDisabled]}
                                onPress={handleConfirm}
                                disabled={!selectedCoords}
                            >
                                <Text style={styles.confirmButtonText}>この場所に設定する</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.hintOverlay}>地図上をタップ、またはピンをドラッグして移動できます</Text>
                    </View>
                )}

                <ActionModal
                    visible={confirmationModalVisible}
                    onClose={() => setConfirmationModalVisible(false)}
                    onConfirm={finalizeSelection}
                    title="場所の確認"
                    message={`選択された場所：\n${addressText || '不明'}\n\nこの場所を活動拠点に設定しますか？`}
                    confirmText="設定する"
                    icon="location"
                    iconColor={Colors.primary}
                />
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 60 : 20,
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.surfaceBorder,
    },
    headerTitle: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: Colors.text,
    },
    closeButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        fontSize: FontSize.md,
        color: Colors.textSecondary,
    },
    mapContainer: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.surface,
        padding: Spacing.lg,
        paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.lg,
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
        ...Shadow.lg,
    },
    addressInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: Spacing.lg,
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
    },
    addressText: {
        flex: 1,
        fontSize: FontSize.sm,
        color: Colors.text,
        fontWeight: '600',
    },
    confirmButton: {
        backgroundColor: Colors.primary,
        height: 54,
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmButtonDisabled: {
        backgroundColor: Colors.textTertiary,
        opacity: 0.5,
    },
    confirmButtonText: {
        color: Colors.textInverse,
        fontSize: FontSize.md,
        fontWeight: '700',
    },
    hintOverlay: {
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.6)',
        color: '#fff',
        fontSize: FontSize.xs,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: BorderRadius.full,
        textAlign: 'center',
        overflow: 'hidden',
    },
});
