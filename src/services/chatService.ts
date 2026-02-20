import { supabase } from '../lib/supabase';
import { Database } from '../types/database';

type Message = Database['public']['Tables']['messages']['Row'];
type Match = Database['public']['Tables']['matches']['Row'];

export const chatService = {
    // マッチの取得、または作成
    async getOrCreateMatch(user1Id: string, user2Id: string): Promise<Match | null> {
        try {
            // 既存のマッチを探す
            const { data: existingMatches, error: searchError } = await supabase
                .from('matches')
                .select('*')
                .or(`and(user1_id.eq.${user1Id},user2_id.eq.${user2Id}),and(user1_id.eq.${user2Id},user2_id.eq.${user1Id})`)
                .limit(1);

            if (searchError) throw searchError;

            if (existingMatches && existingMatches.length > 0) {
                return existingMatches[0];
            }

            // なければ作成する
            const { data: newMatch, error: insertError } = await supabase
                .from('matches')
                .insert({
                    user1_id: user1Id,
                    user2_id: user2Id,
                })
                .select()
                .single();

            if (insertError) throw insertError;
            return newMatch;
        } catch (error) {
            console.error('getOrCreateMatch error:', error);
            return null;
        }
    },

    // メッセージの送信
    async sendMessage(matchId: string, senderId: string, content: string): Promise<Message | null> {
        try {
            const { data, error } = await supabase
                .from('messages')
                .insert({
                    match_id: matchId,
                    sender_id: senderId,
                    content: content,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('sendMessage error:', error);
            return null;
        }
    },

    // メッセージ一覧の取得
    async getMessages(matchId: string): Promise<Message[]> {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('match_id', matchId)
                .order('created_at', { ascending: true }); // 古いメッセージが上、新しいのが下

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('getMessages error:', error);
            return [];
        }
    },

    // リアルタイムサブスクリプションの設定
    subscribeToMessages(matchId: string, callback: (payload: any) => void) {
        const channel = supabase
            .channel(`messages:match_id=eq.${matchId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `match_id=eq.${matchId}`,
                },
                callback
            )
            .subscribe();

        return channel;
    }
};
