/**
 * 位置情報サービス
 * Expo Location を使用して近くのミュージシャンを検索
 */
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';

export interface LocationData {
    latitude: number;
    longitude: number;
    city?: string;
    district?: string;
    displayName: string;
}

export const locationService = {
    /**
     * 位置情報の権限をリクエスト
     */
    async requestPermission(): Promise<boolean> {
        const { status } = await Location.requestForegroundPermissionsAsync();
        return status === 'granted';
    },

    /**
     * 権限の状態を確認
     */
    async checkPermission(): Promise<boolean> {
        const { status } = await Location.getForegroundPermissionsAsync();
        return status === 'granted';
    },

    /**
     * 現在の位置情報を取得
     */
    async getCurrentLocation(): Promise<LocationData | null> {
        const hasPermission = await this.checkPermission();
        if (!hasPermission) {
            const granted = await this.requestPermission();
            if (!granted) return null;
        }

        try {
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced, // バッテリー節約
            });

            // 逆ジオコーディングで住所を取得
            const [address] = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });

            const displayName = address
                ? `${address.region || ''}${address.city || ''}${address.district || ''}`
                : '位置情報取得済み';

            return {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                city: address?.city || undefined,
                district: address?.district || undefined,
                displayName,
            };
        } catch (e) {
            console.error('[Location] Failed to get location:', e);
            return null;
        }
    },

    /**
     * 位置情報をSupabaseプロフィールに保存
     */
    async updateProfileLocation(userId: string): Promise<LocationData | null> {
        const location = await this.getCurrentLocation();
        if (!location) return null;

        const { error } = await supabase
            .from('profiles')
            .update({
                latitude: location.latitude,
                longitude: location.longitude,
                location: location.displayName,
                updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

        if (error) {
            console.error('[Location] Failed to update profile:', error);
        }

        return location;
    },

    /**
     * 2点間の距離を計算（km）
     */
    calculateDistance(
        lat1: number, lon1: number,
        lat2: number, lon2: number
    ): number {
        const R = 6371;
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(R * c * 10) / 10;
    },

    toRad(deg: number): number {
        return deg * (Math.PI / 180);
    },
};
