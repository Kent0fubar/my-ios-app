// Supabase データベースの型定義
export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    name: string
                    age: number | null
                    bio: string | null
                    location: string | null
                    latitude: number | null
                    longitude: number | null
                    instruments: string[] | null
                    genres: string[] | null
                    skill_level: 'beginner' | 'intermediate' | 'advanced' | 'professional' | null
                    looking_for: string[] | null
                    tags: string[] | null
                    avatar_url: string | null
                    audio_clip_url: string | null
                    birthday: string | null
                    birthday_hidden: boolean | null
                    is_premium: boolean | null
                    is_pro: boolean | null
                    subscription_started_at: string | null
                    subscription_expires_at: string | null
                    is_verified: boolean | null
                    push_token: string | null
                    is_suspended: boolean | null
                    suspended_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    name?: string
                    age?: number | null
                    bio?: string | null
                    location?: string | null
                    latitude?: number | null
                    longitude?: number | null
                    instruments?: string[] | null
                    genres?: string[] | null
                    skill_level?: 'beginner' | 'intermediate' | 'advanced' | 'professional' | null
                    looking_for?: string[] | null
                    tags?: string[] | null
                    avatar_url?: string | null
                    audio_clip_url?: string | null
                    is_premium?: boolean | null
                    is_pro?: boolean | null
                    subscription_started_at?: string | null
                    subscription_expires_at?: string | null
                    is_verified?: boolean | null
                    push_token?: string | null
                    is_suspended?: boolean | null
                    suspended_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    age?: number | null
                    bio?: string | null
                    location?: string | null
                    latitude?: number | null
                    longitude?: number | null
                    instruments?: string[] | null
                    genres?: string[] | null
                    skill_level?: 'beginner' | 'intermediate' | 'advanced' | 'professional' | null
                    looking_for?: string[] | null
                    tags?: string[] | null
                    avatar_url?: string | null
                    audio_clip_url?: string | null
                    is_premium?: boolean | null
                    is_pro?: boolean | null
                    subscription_started_at?: string | null
                    subscription_expires_at?: string | null
                    is_verified?: boolean | null
                    push_token?: string | null
                    is_suspended?: boolean | null
                    suspended_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            swipes: {
                Row: {
                    id: string
                    swiper_id: string
                    swiped_id: string
                    direction: 'like' | 'nope' | 'superlike'
                    created_at: string
                }
                Insert: {
                    id?: string
                    swiper_id: string
                    swiped_id: string
                    direction: 'like' | 'nope' | 'superlike'
                    created_at?: string
                }
                Update: {
                    id?: string
                    swiper_id?: string
                    swiped_id?: string
                    direction?: 'like' | 'nope' | 'superlike'
                    created_at?: string
                }
            }
            matches: {
                Row: {
                    id: string
                    user1_id: string
                    user2_id: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user1_id: string
                    user2_id: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user1_id?: string
                    user2_id?: string
                    created_at?: string
                }
            }
            messages: {
                Row: {
                    id: string
                    match_id: string
                    sender_id: string
                    content: string
                    read_at: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    match_id: string
                    sender_id: string
                    content: string
                    read_at?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    match_id?: string
                    sender_id?: string
                    content?: string
                    read_at?: string | null
                    created_at?: string
                }
            }
            reports: {
                Row: {
                    id: string
                    reporter_id: string
                    reported_id: string
                    reason: string
                    description: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    reporter_id: string
                    reported_id: string
                    reason: string
                    description?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    reporter_id?: string
                    reported_id?: string
                    reason?: string
                    description?: string | null
                    created_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

// 便利な型エイリアス
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Swipe = Database['public']['Tables']['swipes']['Row'];
export type Match = Database['public']['Tables']['matches']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];

