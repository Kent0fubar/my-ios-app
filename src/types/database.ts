// Supabase データベースの型定義
export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    name: string;
                    age: number;
                    bio: string;
                    location: string;
                    latitude: number | null;
                    longitude: number | null;
                    instruments: string[];
                    genres: string[];
                    skill_level: 'beginner' | 'intermediate' | 'advanced' | 'professional';
                    looking_for: string[];
                    avatar_url: string | null;
                    audio_clip_url: string | null;
                    is_premium: boolean;
                    is_verified: boolean;
                    push_token: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
            };
            swipes: {
                Row: {
                    id: string;
                    swiper_id: string;
                    swiped_id: string;
                    direction: 'like' | 'nope' | 'superlike';
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['swipes']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['swipes']['Insert']>;
            };
            matches: {
                Row: {
                    id: string;
                    user1_id: string;
                    user2_id: string;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['matches']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['matches']['Insert']>;
            };
            messages: {
                Row: {
                    id: string;
                    match_id: string;
                    sender_id: string;
                    content: string;
                    read_at: string | null;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['messages']['Insert']>;
            };
            reports: {
                Row: {
                    id: string;
                    reporter_id: string;
                    reported_id: string;
                    reason: string;
                    description: string | null;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['reports']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['reports']['Insert']>;
            };
        };
    };
}

// 便利な型エイリアス
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Swipe = Database['public']['Tables']['swipes']['Row'];
export type Match = Database['public']['Tables']['matches']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
