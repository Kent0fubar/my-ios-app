// BandLink テーマ定義
export const Colors = {
    // Primary - シャンパンゴールド
    primary: '#E5C07B',
    primaryLight: '#F3D39B',
    primaryDark: '#B9934B',

    // Secondary - ディープゴールド
    secondary: '#D4AF37',
    secondaryLight: '#E8C654',

    // Accent - ライトゴールド
    accent: '#F9D788',
    accentLight: '#FFECC0',

    // Gradient Colors
    gradientStart: '#E5C07B',
    gradientMiddle: '#D4AF37',
    gradientEnd: '#B9934B',

    // Background - チャコールグレイ
    background: '#1A1A1E',
    backgroundSecondary: '#212126',
    backgroundTertiary: '#2A2A30',
    card: '#24242A',
    cardHover: '#303038',

    // Surface
    surface: 'rgba(255, 255, 255, 0.05)',
    surfaceLight: 'rgba(255, 255, 255, 0.08)',
    surfaceBorder: 'rgba(255, 255, 255, 0.1)',

    // Text
    text: '#FFFFFF',
    textSecondary: '#A0A0C0',
    textTertiary: '#6B6B8D',
    textInverse: '#0A0A1A',

    // Status
    success: '#06D6A0',
    warning: '#FBBF24',
    error: '#EF4444',
    info: '#3B82F6',

    // Match colors
    like: '#E5C07B',       // シャンパンゴールド
    nope: '#A0A0C0',       // シルバー / 落ち着いたグレー
    superLike: '#00EAFF',  // エレクトリックブルー (見分けやすく変更)

    // Premium
    gold: '#FFD700',
    goldLight: '#FFEC80',
    goldGradientStart: '#FFD700',
    goldGradientEnd: '#FF8C00',
};

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const BorderRadius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
};

export const FontSize = {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 40,
};

export const Shadow = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 3,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    lg: {
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
    glow: {
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 12,
    },
};
