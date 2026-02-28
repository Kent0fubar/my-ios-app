/**
 * プロフィール・マッチング・メッセージのデータサービス
 * Supabase をバックエンドとして使用、全操作にレート制限付き
 */
import { supabase } from '../lib/supabase';
import { withRateLimit, getRemainingSwipes } from '../lib/rateLimit';
import { Profile, Match, Message } from '../types/database';
import { locationService } from './locationService';
import { File as ExpoFile } from 'expo-file-system';
import { log } from '../lib/logger';
import { purchaseService } from './purchaseService';

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
        // 通信時にサブスクリプション期限をチェック
        await purchaseService.syncSubscriptionStatus();

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
            // 拡張子の正規化
            const ext = fileExt.toLowerCase();
            const isJpg = ['jpg', 'jpeg', 'jpe'].includes(ext);
            const normalizedExt = isJpg ? 'jpg' : ext;
            const fileName = `${userId}/avatar.${normalizedExt}`;
            const contentType = isJpg ? 'image/jpeg' : `image/${ext}`;

            if (__DEV__) console.log('[DataService] Upload started (Modern API):', fileName);

            let arrayBuffer;
            try {
                // Expo SDK 54+ の最新APIを使用してファイルをBinary(ArrayBuffer)として直接読み込み
                const file = new ExpoFile(fileUri);
                arrayBuffer = await file.arrayBuffer();

                if (__DEV__) console.log('[DataService] ArrayBuffer prepared. Size:', arrayBuffer?.byteLength);

                if (!arrayBuffer || arrayBuffer.byteLength === 0) {
                    throw new Error('画像の読み込みに失敗しました（データが空です）');
                }
            } catch (err: any) {
                log.error('[DataService] File read failed', err, { fileUri });
                throw new Error('画像の読み取りに失敗しました: ' + err.message);
            }

            // ストレージへアップロード
            const { data, error } = await supabase.storage
                .from('avatars')
                .upload(fileName, arrayBuffer, {
                    upsert: true,
                    contentType: contentType,
                    cacheControl: '3600'
                });

            if (error) {
                log.error('[DataService] Supabase Storage upload error', error, { fileName });
                throw error;
            }

            if (__DEV__) console.log('[DataService] Storage success (Binary):', data);

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            return publicUrl;
        });
    },

    /**
     * プロフィールの統計情報（いいね数、マッチ数、閲覧数）を取得する
     * @param userId 対象のユーザーID
     */
    async getStats(userId: string): Promise<{ likes: number; matches: number; views: number }> {
        validateUUID(userId, 'ユーザーID');

        try {
            // いいねされた数（directionが'like'または'superlike'で、自分がswiped_idのもの）
            const { count: likesCount, error: likesError } = await supabase
                .from('swipes')
                .select('*', { count: 'exact', head: true })
                .eq('swiped_id', userId)
                .in('direction', ['like', 'superlike']);

            if (likesError) throw likesError;

            // マッチ数（自分がuser1_idまたはuser2_idのもの）
            const { count: matchesCount, error: matchesError } = await supabase
                .from('matches')
                .select('*', { count: 'exact', head: true })
                .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

            if (matchesError) throw matchesError;

            // 閲覧数は現在テーブルがないため、モックデータとして一定の数値を返す（ゆくゆくはprofile_viewsテーブルから取得）
            const mockViewsCount = Math.floor(Math.random() * 50) + 10;

            return {
                likes: likesCount || 0,
                matches: matchesCount || 0,
                views: mockViewsCount,
            };
        } catch (error) {
            log.error('[DataService] getStats error', error);
            return { likes: 0, matches: 0, views: 0 };
        }
    }
};

// ============================================================
// ディスカバリー（マッチング）
// ============================================================
export const discoveryService = {
    /**
     * ディスカバリー用のユーザー一覧を取得
     * - 既にスワイプ済みのユーザーを除外
     * - タグマッチングスコアで優先度ソート
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
            skillLevels?: string[];
            lookingFor?: string[];
        }
    ): Promise<(Profile & { matchScore?: number })[]> {
        return withRateLimit('search', myUserId, async () => {
            // SQLインジェクション防止: myUserIdのUUID形式を検証
            validateUUID(myUserId, 'ユーザーID');

            // 自分のプロフィールを取得（マッチング計算用）
            const { data: myProfile } = await supabase
                .from('profiles')
                .select('tags, genres, instruments, looking_for')
                .eq('id', myUserId)
                .single();

            const myTags: string[] = (myProfile as any)?.tags || [];
            const myGenres: string[] = (myProfile as any)?.genres || [];
            const myInstruments: string[] = (myProfile as any)?.instruments || [];
            const myLookingFor: string[] = (myProfile as any)?.looking_for || [];

            // 既にスワイプしたユーザーIDを取得
            const { data: swipedData } = await supabase
                .from('swipes')
                .select('swiped_id')
                .eq('swiper_id', myUserId)
                .returns<{ swiped_id: string }[]>();

            const swipedIds = (swipedData?.map((s: { swiped_id: string }) => s.swiped_id) || [])
                .filter((id: string) => UUID_REGEX.test(id));

            // ブロック関連のユーザーを除外（自分がブロックした or 相手にブロックされた）
            const { data: blockedByMe } = await supabase
                .from('blocks')
                .select('blocked_id')
                .eq('blocker_id', myUserId);

            const { data: blockingMe } = await supabase
                .from('blocks')
                .select('blocker_id')
                .eq('blocked_id', myUserId);

            const blockedIds = [
                ...(blockedByMe?.map(b => b.blocked_id) || []),
                ...(blockingMe?.map(b => b.blocker_id) || [])
            ];

            const excludeIds = [myUserId, ...swipedIds, ...blockedIds];

            let query = supabase
                .from('profiles')
                .select('*')
                .not('id', 'in', `(${excludeIds.join(',')})`)
                .limit(50);

            if (options?.genres && options.genres.length > 0) {
                query = query.overlaps('genres', options.genres);
            }

            if (options?.instruments && options.instruments.length > 0) {
                query = query.overlaps('instruments', options.instruments);
            }

            if (options?.skillLevels && options.skillLevels.length > 0) {
                query = query.in('skill_level', options.skillLevels);
            }

            if (options?.lookingFor && options.lookingFor.length > 0) {
                query = query.overlaps('looking_for', options.lookingFor);
            }

            const { data, error } = await query;
            if (error) throw error;

            if (!data) return [];

            // マッチングスコアを計算してソート
            const scoredUsers = data.map((profile: Profile) => {
                const theirTags = profile.tags || [];
                const theirGenres = profile.genres || [];
                const theirInstruments = profile.instruments || [];
                const theirLookingFor = profile.looking_for || [];

                const tagOverlap = myTags.filter(t => theirTags.includes(t)).length;
                const genreOverlap = myGenres.filter(g => theirGenres.includes(g)).length;
                const instrumentOverlap = myInstruments.filter(i => theirInstruments.includes(i)).length;
                const lookingForOverlap = myLookingFor.filter(l => theirLookingFor.includes(l)).length;

                const maxTags = Math.max(myTags.length, theirTags.length, 1);
                const maxGenres = Math.max(myGenres.length, theirGenres.length, 1);
                const maxInstruments = Math.max(myInstruments.length, theirInstruments.length, 1);
                const maxLookingFor = Math.max(myLookingFor.length, theirLookingFor.length, 1);

                // スコア: タグ40% + 目的25% + ジャンル20% + 楽器15%
                const matchScore = Math.round(
                    (tagOverlap / maxTags) * 40 +
                    (lookingForOverlap / maxLookingFor) * 25 +
                    (genreOverlap / maxGenres) * 20 +
                    (instrumentOverlap / maxInstruments) * 15
                );

                let distance: number | undefined = undefined;
                if (options?.latitude && options?.longitude && profile.latitude && profile.longitude) {
                    distance = locationService.calculateDistance(
                        options.latitude, options.longitude,
                        profile.latitude, profile.longitude
                    );
                }

                return { ...profile, matchScore, distance };
            });

            const filtered = options?.radiusKm
                ? scoredUsers.filter((p: any) => p.distance !== undefined && p.distance <= options.radiusKm!)
                : scoredUsers;

            // マッチスコア降順（同スコアなら距離昇順）
            return filtered.sort((a: any, b: any) => {
                // 1. プロフィールブースト (Pro版ユーザーを最優先表示)
                const isProA = a.is_pro;
                const isProB = b.is_pro;
                if (isProB !== isProA) {
                    return isProB ? 1 : -1;
                }
                // 2. マッチスコア降順
                if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
                // 3. 距離昇順
                return (a.distance || 9999) - (b.distance || 9999);
            });
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

            // マッチのチェック
            if (direction === 'like' || direction === 'superlike') {
                // 相手も自分をLIKEしているかチェック
                const { data: reverseSwipe } = await supabase
                    .from('swipes')
                    .select('id')
                    .eq('swiper_id', swipedId)
                    .eq('swiped_id', swiperId)
                    .in('direction', ['like', 'superlike'])
                    .single();

                if (reverseSwipe) {
                    // マッチ成立（DBトリガーにより自動作成されるが、UIのために確認）
                    // 少し待つか、再取得する
                    await new Promise(resolve => setTimeout(resolve, 500));
                    const { data: match } = await supabase
                        .from('matches')
                        .select('id')
                        .or(`and(user1_id.eq.${swiperId},user2_id.eq.${swipedId}),and(user1_id.eq.${swipedId},user2_id.eq.${swiperId})`)
                        .maybeSingle();

                    return { matched: !!match, matchId: match?.id };
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
     * マッチ一覧を取得（最新メッセージ・未読件数付き）
     */
    async getMatches(userId: string): Promise<(Match & { otherProfile: Profile; lastMessage?: Message; unreadCount?: number })[]> {
        validateUUID(userId, 'ユーザーID');

        // マッチとプロフィールを取得
        const { data: matchesData, error: matchesError } = await supabase
            .from('matches')
            .select(`
                *,
                profile1:profiles!matches_user1_id_fkey(*),
                profile2:profiles!matches_user2_id_fkey(*)
            `)
            .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
            .order('created_at', { ascending: false });

        if (matchesError) throw matchesError;
        if (!matchesData) return [];

        // ブロックしている/されているユーザーIDを取得
        const { data: blockedByMe } = await supabase
            .from('blocks')
            .select('blocked_id')
            .eq('blocker_id', userId);

        const { data: blockingMe } = await supabase
            .from('blocks')
            .select('blocker_id')
            .eq('blocked_id', userId);

        const blockedIds = new Set([
            ...(blockedByMe?.map(b => b.blocked_id) || []),
            ...(blockingMe?.map(b => b.blocker_id) || [])
        ]);

        // 各マッチの最新メッセージと未読件数を取得
        const matchesWithMessages = await Promise.all(
            matchesData
                .filter((match: any) => {
                    const otherId = match.user1_id === userId ? match.user2_id : match.user1_id;
                    return !blockedIds.has(otherId);
                })
                .map(async (match: any) => {
                    const { data: messages } = await supabase
                        .from('messages')
                        .select('*')
                        .eq('match_id', match.id)
                        .order('created_at', { ascending: false })
                        .limit(1);

                    const { count: unreadCount } = await supabase
                        .from('messages')
                        .select('id', { count: 'exact', head: true })
                        .eq('match_id', match.id)
                        .neq('sender_id', userId)
                        .is('read_at', null);

                    return {
                        ...match,
                        otherProfile: match.user1_id === userId ? match.profile2 : match.profile1,
                        lastMessage: messages && messages.length > 0 ? messages[0] : undefined,
                        unreadCount: unreadCount || 0
                    };
                })
        );

        return matchesWithMessages;
    },

    /**
     * 2ユーザー間の既存マッチを取得するか、なければ作成する
     */
    async getOrCreateMatch(user1Id: string, user2Id: string): Promise<Match | null> {
        validateUUID(user1Id, 'ユーザーID1');
        validateUUID(user2Id, 'ユーザーID2');
        const { data: existing, error } = await supabase
            .from('matches')
            .select('*')
            .or(`and(user1_id.eq.${user1Id},user2_id.eq.${user2Id}),and(user1_id.eq.${user2Id},user2_id.eq.${user1Id})`)
            .limit(1);

        if (error) throw error;

        // ブロックチェック
        const { data: block } = await supabase
            .from('blocks')
            .select('id')
            .or(`and(blocker_id.eq.${user1Id},blocked_id.eq.${user2Id}),and(blocker_id.eq.${user2Id},blocked_id.eq.${user1Id})`)
            .limit(1);

        if (block && block.length > 0) {
            log.warn('[matchService] Block exists between these users. Match creation/retrieval denied.');
            return null;
        }

        if (existing && existing.length > 0) return existing[0];

        const { data: newMatch, error: insertError } = await supabase
            .from('matches')
            .insert({ user1_id: user1Id, user2_id: user2Id })
            .select()
            .single();

        if (insertError) throw insertError;
        return newMatch;
    },

    /**
     * 自分に「いいね」してくれたユーザー一覧を取得
     * Mutual Match になっていないもののみ
     */
    async getLikesYou(userId: string): Promise<Profile[]> {
        validateUUID(userId, 'ユーザーID');

        try {
            // 自分に向けられた LIKE/SUPERLIKE を取得
            // profiles:profiles!swiper_id は「swiper_id カラムを外部キーとする profiles テーブル」を指します
            const { data: likes, error: likesError } = await supabase
                .from('swipes')
                .select(`
                    swiper_id,
                    profiles:profiles!swiper_id(*)
                `)
                .eq('swiped_id', userId)
                .in('direction', ['like', 'superlike']);

            if (likesError) {
                log.error('[matchService.getLikesYou] Database Error', likesError);
                throw likesError;
            }

            log.info(`[matchService.getLikesYou] Raw Likes from DB: ${likes?.length || 0}`);

            if (!likes || likes.length === 0) {
                return [];
            }

            // 既にマッチ済みのユーザーIDを取得して除外（既にマッチしている人は「いいね」リストに出さない）
            const { data: matches } = await supabase
                .from('matches')
                .select('user1_id, user2_id')
                .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

            const matchedUserIds = new Set(
                matches?.flatMap(m => [m.user1_id, m.user2_id]).filter(id => id !== userId) || []
            );

            // ブロックしているユーザーIDを取得して除外
            const { data: blocks } = await supabase
                .from('blocks')
                .select('blocked_id')
                .eq('blocker_id', userId);

            const blockedUserIds = new Set(blocks?.map(b => b.blocked_id) || []);

            // プロフィールを抽出（エイリアス profiles を使用）
            const profiles = (likes as any[])
                .map(l => l.profiles)
                .filter(p => p && !matchedUserIds.has(p.id) && !blockedUserIds.has(p.id));

            log.info(`[matchService.getLikesYou] Final Profiles after filtering: ${profiles.length}`);
            return profiles;
        } catch (err) {
            log.error('[matchService.getLikesYou] Unexpected Error', err);
            return [];
        }
    },

    /**
     * マッチのリアルタイム購読
     */
    subscribeToMatches(userId: string, onEvent: (payload: any) => void) {
        validateUUID(userId, 'ユーザーID');
        return supabase
            .channel(`matches:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'matches',
                },
                (payload: any) => {
                    onEvent(payload);
                }
            )
            .subscribe();
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
    subscribeToMessages(matchId: string, onEvent: (payload: any) => void) {
        // SQLインジェクション防止: UUID形式を検証
        validateUUID(matchId, 'マッチID');

        return supabase
            .channel(`messages:${matchId}`)  // チャンネル名（SQL対象外）
            .on(
                'postgres_changes',
                {
                    event: '*', // INSERT, UPDATE, DELETE すべて受信
                    schema: 'public',
                    table: 'messages',
                    filter: `match_id=eq.${matchId}`,
                },
                (payload: any) => {
                    onEvent(payload);
                }
            )
            .subscribe();
    },

    /**
     * 全メッセージのリアルタイム購読（自慢のユーザーに関するもの）
     */
    subscribeToAllMessages(userId: string, onEvent: (payload: any) => void) {
        validateUUID(userId, 'ユーザーID');

        return supabase
            .channel(`global-messages:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*', // INSERT だけでなく UPDATE (既読更新) も検知
                    schema: 'public',
                    table: 'messages',
                },
                (payload: any) => {
                    onEvent(payload);
                }
            )
            .subscribe();
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
        validateUUID(reporterId, '通報者ID');
        validateUUID(reportedId, '通報対象ID');

        return withRateLimit('report', reporterId, async () => {
            const reportData: any = {
                reporter_id: reporterId,
                reported_id: reportedId,
                reason,
                description: description || null,
            };

            log.info('[reportService] Submitting report...', reportData);

            const { error: insertError } = await supabase
                .from('reports')
                .insert(reportData);

            if (insertError) {
                log.error('[reportService] Insert failed', insertError, reportData);
                throw insertError;
            }

            // 凍結ロジックはサーバーサイド（DBトリガー）で安全に実行されます
        });
    },
};

// ============================================================
// モデレーション（ブロック・マッチ解除）
// ============================================================
export const moderationService = {
    /**
     * ユーザーをブロック
     */
    async blockUser(blockerId: string, blockedId: string): Promise<void> {
        validateUUID(blockerId, 'ブロック実行者ID');
        validateUUID(blockedId, 'ブロック対象ID');

        try {
            const { error: blockError } = await supabase
                .from('blocks')
                .insert({ blocker_id: blockerId, blocked_id: blockedId });
            if (blockError) {
                log.warn('[moderationService] Block insert failed (table may not exist)', blockError);
            }
        } catch (e: any) {
            log.warn('[moderationService] Block insert exception', e);
        }

        // 2. マッチを解除
        await this.unmatchUser(blockerId, blockedId);

        // 3. スワイプ履歴も削除
        await supabase
            .from('swipes')
            .delete()
            .or(`and(swiper_id.eq.${blockerId},swiped_id.eq.${blockedId}),and(swiper_id.eq.${blockedId},swiped_id.eq.${blockerId})`);
    },

    /**
     * マッチを解除
     */
    async unmatchUser(userId: string, otherId: string): Promise<void> {
        validateUUID(userId, 'ユーザーID');
        validateUUID(otherId, 'ユーザーID');

        const { error } = await supabase
            .from('matches')
            .delete()
            .or(`and(user1_id.eq.${userId},user2_id.eq.${otherId}),and(user1_id.eq.${otherId},user2_id.eq.${userId})`);

        if (error) throw error;
    }
};
