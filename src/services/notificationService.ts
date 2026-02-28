/**
 * プッシュ通知サービス
 * Expo Push Notifications を使用（無料）
 *
 * 通知タイプ:
 * - マッチ成立通知
 * - 新着メッセージ通知
 * - スーパーライク通知
 * - プロフィールブースト通知（Premiumのみ）
 */
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { log } from '../lib/logger';

// 通知のデフォルト動作設定
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export interface NotificationData {
    type: 'match' | 'message' | 'superlike' | 'boost';
    matchId?: string;
    userId?: string;
    userName?: string;
}

export const notificationService = {
    /**
     * プッシュ通知の権限をリクエスト＆トークンを取得
     */
    async registerForPushNotifications(): Promise<string | null> {
        // デバイスチェック（シミュレータでは動作しない）
        if (!Device.default.isDevice) {
            log.info('[NotificationService] Must use physical device for Push Notifications');
            return null;
        }

        // 現在の権限を確認
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        // まだ許可されていない場合はリクエスト
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            log.info('[NotificationService] Permission not granted');
            return null;
        }

        // Expo Push Token を取得
        try {
            const tokenData = await Notifications.getExpoPushTokenAsync({
                projectId: Device.default.expoConfig?.extra?.eas?.projectId,
            });
            const token = tokenData.data;
            log.info('[NotificationService] Push token registered', token);

            await this.savePushToken(token);
            return token;
        } catch (e: any) {
            log.error('[NotificationService] Failed to get push token', e);
            return null;
        }
    },

    /**
     * プッシュトークンをSupabaseに保存
     */
    async savePushToken(token: string): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase
            .from('profiles')
            .update({ push_token: token })
            .eq('id', user.id);
    },

    /**
     * ローカル通知を送信（アプリがフォアグラウンドの場合）
     */
    async sendLocalNotification(
        title: string,
        body: string,
        data?: NotificationData
    ): Promise<void> {
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data: data as any,
                sound: 'default',
            },
            trigger: null, // 即時送信
        });
    },

    /**
     * マッチ成立通知
     */
    async notifyMatch(userName: string, matchId: string): Promise<void> {
        await this.sendLocalNotification(
            '🎉 新しいマッチ！',
            `${userName}さんとマッチしました！チャットを始めましょう`,
            { type: 'match', matchId, userName }
        );
    },

    /**
     * 新着メッセージ通知
     */
    async notifyMessage(userName: string, message: string, matchId: string): Promise<void> {
        await this.sendLocalNotification(
            `🎵 ${userName}`,
            message.length > 50 ? message.substring(0, 50) + '...' : message,
            { type: 'message', matchId, userName }
        );
    },

    /**
     * スーパーライク通知（Premium）
     */
    async notifySuperLike(userName: string): Promise<void> {
        await this.sendLocalNotification(
            '⭐ スーパーライク！',
            `${userName}さんがあなたにスーパーライクしました！`,
            { type: 'superlike', userName }
        );
    },

    /**
     * 通知リスナーを設定
     */
    addNotificationListener(
        callback: (notification: Notifications.Notification) => void
    ) {
        return Notifications.addNotificationReceivedListener(callback);
    },

    /**
     * 通知タップのリスナーを設定
     */
    addNotificationResponseListener(
        callback: (response: Notifications.NotificationResponse) => void
    ) {
        return Notifications.addNotificationResponseReceivedListener(callback);
    },

    /**
     * バッジ数をリセット
     */
    async resetBadgeCount(): Promise<void> {
        await Notifications.setBadgeCountAsync(0);
    },
};
