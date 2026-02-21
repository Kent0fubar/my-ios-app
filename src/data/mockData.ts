// モックユーザーデータ
export interface UserProfile {
    id: string;
    name: string;
    age: number;
    location: string;
    bio: string;
    instruments: string[];
    genres: string[];
    tags: string[];
    skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'professional';
    lookingFor: string[];
    imageUrl: string;
    audioClipUrl?: string;
    distance: number; // km
    matchScore?: number; // タグマッチ度（0〜100）
    isVerified: boolean;
    isPremium: boolean;
}

export const INSTRUMENTS = [
    { id: 'guitar', label: 'ギター', icon: 'guitar' },
    { id: 'bass', label: 'ベース', icon: 'bass' },
    { id: 'drums', label: 'ドラム', icon: 'drums' },
    { id: 'vocal', label: 'ボーカル', icon: 'vocal' },
    { id: 'keyboard', label: 'キーボード', icon: 'keyboard' },
    { id: 'piano', label: 'ピアノ', icon: 'piano' },
    { id: 'saxophone', label: 'サックス', icon: 'saxophone' },
    { id: 'trumpet', label: 'トランペット', icon: 'trumpet' },
    { id: 'violin', label: 'バイオリン', icon: 'violin' },
    { id: 'dj', label: 'DJ', icon: 'dj' },
    { id: 'producer', label: 'プロデューサー', icon: 'producer' },
    { id: 'songwriter', label: 'ソングライター', icon: 'songwriter' },
];

export const GENRES = [
    { id: 'rock', label: 'ロック', color: '#EF4444' },
    { id: 'pop', label: 'ポップ', color: '#EC4899' },
    { id: 'jazz', label: 'ジャズ', color: '#3B82F6' },
    { id: 'hiphop', label: 'ヒップホップ', color: '#8B5CF6' },
    { id: 'electronic', label: 'エレクトロニック', color: '#06D6A0' },
    { id: 'rnb', label: 'R&B', color: '#F97316' },
    { id: 'metal', label: 'メタル', color: '#64748B' },
    { id: 'punk', label: 'パンク', color: '#FBBF24' },
    { id: 'folk', label: 'フォーク', color: '#A3E635' },
    { id: 'classical', label: 'クラシック', color: '#C084FC' },
    { id: 'reggae', label: 'レゲエ', color: '#34D399' },
    { id: 'blues', label: 'ブルース', color: '#60A5FA' },
    { id: 'country', label: 'カントリー', color: '#FB923C' },
    { id: 'indie', label: 'インディー', color: '#F472B6' },
    { id: 'funk', label: 'ファンク', color: '#FACC15' },
];

export const SKILL_LEVELS = [
    { id: 'beginner', label: '初心者', description: '始めたばかり〜1年', icon: '🌱' },
    { id: 'intermediate', label: '中級者', description: '1〜3年', icon: '🌿' },
    { id: 'advanced', label: '上級者', description: '3〜10年', icon: '🌳' },
    { id: 'professional', label: 'プロ', description: 'プロ活動経験あり', icon: '⭐' },
];

// マッチング用タグ（自由にプロフィールに追加可能）
export const TAGS = [
    { id: 'live_active', label: 'ライブ活動中', icon: '🎤', color: '#EF4444' },
    { id: 'dtm', label: 'DTM/宅録', icon: '💻', color: '#3B82F6' },
    { id: 'original', label: 'オリジナル曲志向', icon: '✨', color: '#F59E0B' },
    { id: 'cover', label: 'カバー中心', icon: '🎶', color: '#10B981' },
    { id: 'weekday_ok', label: '平日練習OK', icon: '📅', color: '#8B5CF6' },
    { id: 'weekend_only', label: '週末のみ', icon: '🗓️', color: '#06B6D4' },
    { id: 'studio_owner', label: 'スタジオ持ち', icon: '🏠', color: '#EC4899' },
    { id: 'beginner_welcome', label: '初心者歓迎', icon: '🌱', color: '#22C55E' },
    { id: 'pro_oriented', label: 'プロ志向', icon: '🔥', color: '#F97316' },
    { id: 'casual', label: 'ゆるく楽しみたい', icon: '☕', color: '#A78BFA' },
    { id: 'theory_lover', label: '音楽理論好き', icon: '📖', color: '#6366F1' },
    { id: 'improv', label: 'アドリブ好き', icon: '🎲', color: '#14B8A6' },
    { id: 'recording', label: 'レコーディング対応', icon: '🎙️', color: '#E11D48' },
    { id: 'teaching', label: '教えるの好き', icon: '📚', color: '#0EA5E9' },
    { id: 'compose', label: '作曲できる', icon: '🎼', color: '#D946EF' },
    { id: 'lyrics', label: '作詞できる', icon: '✍️', color: '#F43F5E' },
];

export const LOOKING_FOR = [
    { id: 'band', label: 'バンドメンバー', icon: '🎸' },
    { id: 'session', label: 'セッション仲間', icon: '🎵' },
    { id: 'collaboration', label: 'コラボレーション', icon: '🤝' },
    { id: 'teacher', label: '先生', icon: '📚' },
    { id: 'student', label: '生徒', icon: '🎓' },
    { id: 'producer', label: 'プロデューサー', icon: '🎛️' },
    { id: 'songwriter', label: '作曲パートナー', icon: '✍️' },
];

export const MOCK_USERS: UserProfile[] = [
    {
        id: '1',
        name: 'Yuki',
        age: 25,
        location: '東京都渋谷区',
        bio: 'ロックバンドのギタリストを探しています！一緒にライブハウスを盛り上げましょう🎸 影響を受けたアーティスト: ONE OK ROCK, RADWIMPS',
        instruments: ['guitar', 'vocal'],
        genres: ['rock', 'pop', 'indie'],
        tags: ['live_active', 'original', 'weekend_only'],
        skillLevel: 'advanced',
        lookingFor: ['band', 'session'],
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop',
        distance: 2.5,
        isVerified: true,
        isPremium: true,
    },
    {
        id: '2',
        name: 'Mika',
        age: 23,
        location: '東京都新宿区',
        bio: 'ジャズピアニスト🎹 セッション大好き！気軽に誘ってください✨ 週末はよく新宿のジャズバーに出没してます',
        instruments: ['piano', 'keyboard'],
        genres: ['jazz', 'rnb', 'classical'],
        tags: ['improv', 'theory_lover', 'casual', 'weekday_ok'],
        skillLevel: 'professional',
        lookingFor: ['session', 'collaboration'],
        imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=600&fit=crop',
        distance: 4.1,
        isVerified: true,
        isPremium: false,
    },
    {
        id: '3',
        name: 'Taro',
        age: 28,
        location: '東京都目黒区',
        bio: 'ドラマー歴10年！ロック・メタルが得意ですが、ジャンル問わずセッションしたいです🥁 スタジオの予約も任せてください',
        instruments: ['drums'],
        genres: ['rock', 'metal', 'punk', 'funk'],
        tags: ['live_active', 'pro_oriented', 'weekday_ok'],
        skillLevel: 'advanced',
        lookingFor: ['band', 'session'],
        imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop',
        distance: 5.3,
        isVerified: false,
        isPremium: false,
    },
    {
        id: '4',
        name: 'Sakura',
        age: 22,
        location: '東京都中野区',
        bio: 'シンガーソングライター🎤 オリジナル曲を一緒に作ってくれる人を探しています♪ アコースティックからエレクトロまで幅広く',
        instruments: ['vocal', 'guitar', 'songwriter'],
        genres: ['pop', 'folk', 'indie'],
        tags: ['original', 'compose', 'lyrics', 'casual'],
        skillLevel: 'intermediate',
        lookingFor: ['collaboration', 'songwriter', 'band'],
        imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop',
        distance: 3.7,
        isVerified: true,
        isPremium: true,
    },
    {
        id: '5',
        name: 'Kenji',
        age: 30,
        location: '東京都世田谷区',
        bio: 'ベーシスト兼プロデューサー🎛️ DTMも得意です。一緒にかっこいい音楽を作りましょう！ 自宅スタジオあります',
        instruments: ['bass', 'producer'],
        genres: ['electronic', 'hiphop', 'rnb', 'funk'],
        tags: ['dtm', 'studio_owner', 'recording', 'pro_oriented'],
        skillLevel: 'professional',
        lookingFor: ['collaboration', 'producer'],
        imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=600&fit=crop',
        distance: 7.2,
        isVerified: true,
        isPremium: false,
    },
    {
        id: '6',
        name: 'Rina',
        age: 26,
        location: '東京都港区',
        bio: 'サックス吹きです🎷 ジャズ・ファンクが大好き！ 週末のライブやセッションに参加できるバンドメンバーを募集中',
        instruments: ['saxophone'],
        genres: ['jazz', 'funk', 'blues'],
        tags: ['live_active', 'improv', 'weekend_only', 'beginner_welcome'],
        skillLevel: 'advanced',
        lookingFor: ['band', 'session'],
        imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop',
        distance: 1.8,
        isVerified: false,
        isPremium: false,
    },
];
