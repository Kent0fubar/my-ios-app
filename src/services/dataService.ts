/**
 * プロフィール・マッチング・メッセージのデータサービス
 * Supabase をバックエンドとして使用、全操作にレート制限付き
 */
import { supabase } from '../lib/supabase';
import { withRateLimit, getRemainingSwipes } from '../lib/rateLimit';
import { Profile, Match, Message } from '../types/database';

// UUID形式のバリデーション（SQLインジェクション防止）
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateUUID(id: string, fieldName: string = 'ID'): void {
    if (!UUID_REGEX.test(id)) {
        throw new Error(`無効な${fieldName}形式です`);
    }
}

// ============================================================
// プロフィール
// ============================================================
export const profileService = {
    /**
     * 自分のプロフィールを取得
     */
    async getMyProfile(): Promise<Profile | null> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    /**
     * プロフィールを作成/更新
     */
    async upsertProfile(profile: Partial<Profile>): Promise<Profile> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('認証が必要です');

        const updates: any = {
            id: user.id,
            ...profile,
            updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
            .from('profiles')
            .upsert(updates)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * 他のユーザーのプロフィールを取得（レート制限付き）
     */
    async getProfile(userId: string, myUserId: string): Promise<Profile | null> {
        // SQLインジェクション防止: UUID形式を検証
        validateUUID(userId, 'ユーザーID');
        validateUUID(myUserId, 'ユーザーID');

        return withRateLimit('profile:view', myUserId, async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            return data;
        });
    },

    /**
     * アバター画像をアップロード
     * 🛡️ セキュリティ: 認証ユーザーのIDと一致するか検証
     */
    async uploadAvatar(userId: string, fileUri: string, fileExt: string): Promise<string> {
        // 認証ユーザーIDの検証 — 他人のアバターを上書きできない
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || user.id !== userId) {
            throw new Error('権限がありません：自分のアバターのみアップロードできます');
        }

        return withRateLimit('upload:file', userId, async () => {
            const fileName = `${userId}/avatar.${fileExt}`;
            const response = await fetch(fileUri);
            const blob = await response.blob();

            const { error } = await supabase.storage
                .from('avatars')
                .upload(fileName, blob, { upsert: true });

            if (error) throw error;

            const { data } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            return data.publicUrl;
        });
    },
};

// ============================================================
// ディスカバリー（マッチング）
// ============================================================
export const discoveryService = {
    /**
     * ディスカバリー用のユーザー一覧を取得
     * - 既にスワイプ済みのユーザーを除外
     * - 位置情報でフィルタリング（オプション）
     */
    async getDiscoverUsers(
        myUserId: string,
        options?: {
            latitude?: number;
            longitude?: number;
            radiusKm?: number;
            genres?: string[];
            instruments?: string[];
        }
    ): Promise<Profile[]> {
        return withRateLimit('search', myUserId, async () => {
            // SQLインジェクション防止: myUserIdのUUID形式を検証
            validateUUID(myUserId, 'ユーザーID');

            // 既にスワイプしたユーザーIDを取得
            const { data: swipedData } = await supabase
                .from('swipes')
                .select('swiped_id')
                .eq('swiper_id', myUserId)
                .returns<{ swiped_id: string }[]>();

            const swipedIds = (swipedData?.map((s) => s.swiped_id) || [])
                .filter((id): id is string => typeof id === 'string' && UUID_REGEX.test(id));
            const excludeIds = [myUserId, ...swipedIds];

            // 安全なフィルタリング: 各IDがUUID形式であることを確認済み
            // excludeIdsは全て検証済みUUIDのみ
            let query = supabase
                .from('profiles')
                .select('*')
                .not('id', 'in', `(${excludeIds.join(',')})`)
                .limit(20);

            // ジャンルフィルター
            if (options?.genres && options.genres.length > 0) {
                query = query.overlaps('genres', options.genres);
            }

            // 楽器フィルター
            if (options?.instruments && options.instruments.length > 0) {
                query = query.overlaps('instruments', options.instruments);
            }

            const { data, error } = await query;
            if (error) throw error;

            // 位置情報がある場合は距離でソート（アプリ側で計算）
            if (options?.latitude && options?.longitude && data) {
                return data
                    .map((profile) => ({
                        ...profile,
                        distance: profile.latitude && profile.longitude
                            ? calculateDistance(
                                options.latitude!, options.longitude!,
                                profile.latitude, profile.longitude
                            )
                            : 9999,
                    }))
                    .filter((p: any) => !options.radiusKm || p.distance <= options.radiusKm)
                    .sort((a: any, b: any) => a.distance - b.distance) as any;
            }

            return data || [];
        });
    },

    /**
     * スワイプ（LIKE/NOPE/SUPERLIKE）
     */
    async swipe(
        swiperId: string,
        swipedId: string,
        direction: 'like' | 'nope' | 'superlike',
        isPremium: boolean
    ): Promise<{ matched: boolean; matchId?: string }> {
        // SQLインジェクション防止: UUID形式を検証
        validateUUID(swiperId, 'スワイパーID');
        validateUUID(swipedId, 'スワイプ先ID');

        const action = isPremium ? 'swipe:premium' : 'swipe:free';

        return withRateLimit(action, swiperId, async () => {
            // スワイプを記録
            const swipeData: any = {
                swiper_id: swiperId,
                swiped_id: swipedId,
                direction,
            };

            const { error: swipeError } = await supabase
                .from('swipes')
                .insert(swipeData);

            if (swipeError) throw swipeError;

            // LIKE/SUPERLIKEの場合、相手も自分をLIKEしているかチェック
            if (direction === 'like' || direction === 'superlike') {
                const { data: reverseSwipe } = await supabase
                    .from('swipes')
                    .select('id')
                    .eq('swiper_id', swipedId)
                    .eq('swiped_id', swiperId)
                    .in('direction', ['like', 'superlike'])
                    .single();

                if (reverseSwipe) {
                    // マッチ成立！
                    const matchData: any = {
                        user1_id: swiperId,
                        user2_id: swipedId,
                    };

                    const { data: match, error: matchError } = await supabase
                        .from('matches')
                        .insert(matchData)
                        .select()
                        .single();

                    if (matchError) throw matchError;
                    return { matched: true, matchId: match.id };
                }
            }

            return { matched: false };
        });
    },

    /**
     * 残りスワイプ数を取得
     */
    getRemainingSwipes(userId: string, isPremium: boolean): number {
        return getRemainingSwipes(userId, isPremium);
    },
};

// ============================================================
// マッチ
// ============================================================
export const matchService = {
    /**
     * マッチ一覧を取得
     */
    async getMatches(userId: string): Promise<(Match & { otherProfile: Profile })[]> {
        // SQLインジェクション防止: UUID形式を検証
        validateUUID(userId, 'ユーザーID');

        const { data, error } = await supabase
            .from('matches')
            .select(`
        *,
        profile1:profiles!matches_user1_id_fkey(*),
        profile2:profiles!matches_user2_id_fkey(*)
      `)
            .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map((match: any) => ({
            ...match,
            otherProfile: match.user1_id === userId ? match.profile2 : match.profile1,
        }));
    },
};

// ============================================================
// メッセージ
// ============================================================
export const messageService = {
    /**
     * メッセージ一覧を取得
     */
    async getMessages(matchId: string): Promise<Message[]> {
        // SQLインジェクション防止: UUID形式を検証
        validateUUID(matchId, 'マッチID');
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('match_id', matchId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    /**
     * メッセージを送信（レート制限付き）
     */
    async sendMessage(matchId: string, senderId: string, content: string): Promise<Message> {
        // SQLインジェクション防止: UUID形式を検証
        validateUUID(matchId, 'マッチID');
        validateUUID(senderId, '送信者ID');
        return withRateLimit('message:send', senderId, async () => {
            const messageData: any = {
                match_id: matchId,
                sender_id: senderId,
                content: content.trim(),
            };

            const { data, error } = await supabase
                .from('messages')
                .insert(messageData)
                .select()
                .single();

            if (error) throw error;
            return data;
        });
    },

    /**
     * メッセージを既読にする
     */
    async markAsRead(matchId: string, userId: string): Promise<void> {
        // SQLインジェクション防止: UUID形式を検証
        validateUUID(matchId, 'マッチID');
        validateUUID(userId, 'ユーザーID');
        const { error } = await supabase
            .from('messages')
            .update({ read_at: new Date().toISOString() } as any)
            .eq('match_id', matchId)
            .neq('sender_id', userId)
            .is('read_at', null);

        if (error) throw error;
    },

    /**
     * リアルタイムメッセージ購読
     */
    subscribeToMessages(matchId: string, onMessage: (message: Message) => void) {
        // SQLインジェクション防止: UUID形式を検証
        validateUUID(matchId, 'マッチID');

        return supabase
            .channel(`messages:${matchId}`)  // チャンネル名（SQL対象外）
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `match_id=eq.${matchId}`, // UUID検証済みのため安全
                },
                (payload) => {
                    onMessage(payload.new as Message);
                }
            )
            .subscribe();
    },

    /**
     * リアルタイム購読を解除
     */
    unsubscribeFromMessages(matchId: string) {
        supabase.channel(`messages:${matchId}`).unsubscribe();
    },
};

// ============================================================
// レポート（通報）
// ============================================================
export const reportService = {
    /**
     * ユーザーを通報
     */
    async reportUser(
        reporterId: string,
        reportedId: string,
        reason: string,
        description?: string
    ): Promise<void> {
        // SQLインジェクション防止: UUID形式を検証
        validateUUID(reporterId, '通報者ID');
        validateUUID(reportedId, '通報対象ID');
        return withRateLimit('report', reporterId, async () => {
            const reportData: any = {
                reporter_id: reporterId,
                reported_id: reportedId,
                reason,
                description: description || null,
            };

            const { error } = await supabase
                .from('reports')
                .insert(reportData);

            if (error) throw error;
        });
    },
};

// ============================================================
// ユーティリティ
// ============================================================

/**
 * 2点間の距離を計算（Haversine公式）
 */
function calculateDistance(
    lat1: number, lon1: number,
    lat2: number, lon2: number
): number {
    const R = 6371; // 地球の半径 (km)
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10; // 小数点1位
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180);
}
