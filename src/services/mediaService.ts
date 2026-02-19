/**
 * メディアサービス
 * 音声録音・画像/動画ピッカー・Supabase Storage へのアップロード
 */
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { withRateLimit } from '../lib/rateLimit';

export interface MediaUploadResult {
    url: string;
    path: string;
}

export const mediaService = {
    // 録音中のオーディオレコーダー
    _recording: null as Audio.Recording | null,

    // ============================================================
    // 画像
    // ============================================================

    /**
     * カメラで写真を撮影
     */
    async takePhoto(): Promise<string | null> {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            throw new Error('カメラの権限が必要です');
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
            mediaTypes: ['images'],
        });

        if (result.canceled) return null;
        return result.assets[0].uri;
    },

    /**
     * ギャラリーから画像を選択
     */
    async pickImage(): Promise<string | null> {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            throw new Error('フォトライブラリの権限が必要です');
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
            mediaTypes: ['images'],
        });

        if (result.canceled) return null;
        return result.assets[0].uri;
    },

    /**
     * アバター画像をSupabase Storageにアップロード
     */
    async uploadAvatar(userId: string, imageUri: string): Promise<MediaUploadResult> {
        return withRateLimit('upload:file', userId, async () => {
            const ext = imageUri.split('.').pop() || 'jpg';
            const path = `${userId}/avatar_${Date.now()}.${ext}`;

            const response = await fetch(imageUri);
            const blob = await response.blob();

            const { error } = await supabase.storage
                .from('avatars')
                .upload(path, blob, {
                    contentType: `image/${ext}`,
                    upsert: true,
                });

            if (error) throw error;

            const { data } = supabase.storage.from('avatars').getPublicUrl(path);

            // プロフィールのavatar_urlを更新
            await supabase
                .from('profiles')
                .update({ avatar_url: data.publicUrl })
                .eq('id', userId);

            return { url: data.publicUrl, path };
        });
    },

    // ============================================================
    // 音声録音
    // ============================================================

    /**
     * 音声録音を開始
     * 最大60秒の演奏サンプルを録音
     */
    async startRecording(): Promise<void> {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
            throw new Error('マイクの権限が必要です');
        }

        await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
        });

        const { recording } = await Audio.Recording.createAsync(
            Audio.RecordingOptionsPresets.HIGH_QUALITY
        );

        this._recording = recording;
        console.log('[Media] Recording started');

        // 60秒後に自動停止
        setTimeout(async () => {
            if (this._recording) {
                console.log('[Media] Auto-stopping recording after 60s');
                await this.stopRecording();
            }
        }, 60 * 1000);
    },

    /**
     * 音声録音を停止
     */
    async stopRecording(): Promise<string | null> {
        if (!this._recording) return null;

        try {
            await this._recording.stopAndUnloadAsync();
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
            });

            const uri = this._recording.getURI();
            this._recording = null;
            console.log('[Media] Recording stopped:', uri);
            return uri;
        } catch (e) {
            console.error('[Media] Stop recording error:', e);
            this._recording = null;
            return null;
        }
    },

    /**
     * 録音中かどうか
     */
    isRecording(): boolean {
        return this._recording !== null;
    },

    /**
     * 音声クリップをSupabase Storageにアップロード
     */
    async uploadAudioClip(userId: string, audioUri: string): Promise<MediaUploadResult> {
        return withRateLimit('upload:file', userId, async () => {
            const path = `${userId}/clip_${Date.now()}.m4a`;

            const response = await fetch(audioUri);
            const blob = await response.blob();

            const { error } = await supabase.storage
                .from('audio_clips')
                .upload(path, blob, {
                    contentType: 'audio/m4a',
                    upsert: true,
                });

            if (error) throw error;

            const { data } = supabase.storage.from('audio_clips').getPublicUrl(path);

            // プロフィールのaudio_clip_urlを更新
            await supabase
                .from('profiles')
                .update({ audio_clip_url: data.publicUrl })
                .eq('id', userId);

            return { url: data.publicUrl, path };
        });
    },

    // ============================================================
    // 音声再生
    // ============================================================

    /**
     * 音声クリップを再生
     */
    async playAudio(uri: string): Promise<Audio.Sound> {
        const { sound } = await Audio.Sound.createAsync(
            { uri },
            { shouldPlay: true }
        );
        return sound;
    },

    /**
     * 音声を停止
     */
    async stopAudio(sound: Audio.Sound): Promise<void> {
        await sound.stopAsync();
        await sound.unloadAsync();
    },
};
