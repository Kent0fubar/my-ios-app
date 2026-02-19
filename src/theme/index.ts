// BandLink テーマ定義
export const Colors = {
    // Primary - 音楽的で情熱的なパープル〜マゼンタ
    primary: '#8B5CF6',
    primaryLight: '#A78BFA',
    primaryDark: '#7C3AED',

    // Secondary - エネルギッシュなピンク
    secondary: '#EC4899',
    secondaryLight: '#F472B6',

    // Accent - ネオンティール
    accent: '#06D6A0',
    accentLight: '#34D399',

    // Gradient Colors
    gradientStart: '#8B5CF6',
    gradientMiddle: '#EC4899',
    gradientEnd: '#F97316',

    // Background - ダークモード
    background: '#0A0A1A',
    backgroundSecondary: '#13132B',
    backgroundTertiary: '#1C1C3A',
    card: '#1E1E3F',
    cardHover: '#2A2A50',

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
    like: '#06D6A0',
    nope: '#EF4444',
    superLike: '#3B82F6',

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
