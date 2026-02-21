import { View, Text, StyleSheet, ViewStyle, TextStyle, Image } from 'react-native';
import * as CustomIcons from './CustomVectorIcons';
import { Colors, BorderRadius, FontSize } from '../theme';

const styles = StyleSheet.create({
    instrumentTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingLeft: 4,
        paddingRight: 10,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    iconContainer: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: Colors.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    instrumentLabel: {
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    genreTag: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    genreLabel: {
        fontSize: FontSize.xs,
        fontWeight: '700',
        letterSpacing: 0.1,
    },
});

// ローカルの透過画像へのマッピング（Storage が準備できるまでのフォールバック）
const LOCAL_ICONS: { [key: string]: any } = {
    'guitar': require('../../assets/icons/instruments_transparent/guitar.png'),
    'bass': require('../../assets/icons/instruments_transparent/bass.png'),
    'drums': require('../../assets/icons/instruments_transparent/drums.png'),
    'vocal': require('../../assets/icons/instruments_transparent/vocal.png'),
    'keyboard': require('../../assets/icons/instruments_transparent/keyboard.png'),
    'piano': require('../../assets/icons/instruments_transparent/piano.png'),
    'saxophone': require('../../assets/icons/instruments_transparent/saxophone.png'),
    'trumpet': require('../../assets/icons/instruments_transparent/trumpet.png'),
    'violin': require('../../assets/icons/instruments_transparent/violin.png'),
    'dj': require('../../assets/icons/instruments_transparent/dj.png'),
    'producer': require('../../assets/icons/instruments_transparent/producer.png'),
    'songwriter': require('../../assets/icons/instruments_transparent/songwriter.png'),
};

interface InstrumentTagProps {
    icon: string;
    label: string;
    style?: ViewStyle | ViewStyle[];
    textStyle?: TextStyle | TextStyle[];
}

export function InstrumentTag({ icon, label, style, textStyle }: InstrumentTagProps) {
    // icon が URL (http://...) かどうか
    const isUrl = icon && icon.startsWith('http');

    // URL の場合はそのファイル名から、そうでない場合は icon 文字列自体からローカル画像を取得試行
    const iconKey = isUrl ? icon.split('/').pop()?.split('.')[0] : icon;
    const localIcon = iconKey ? LOCAL_ICONS[iconKey] : null;

    // 独自作成したSVGコンポーネントを取り出す
    const IconComponent = !isUrl ? (CustomIcons as any)[icon] : null;

    return (
        <View style={[styles.instrumentTag, style]}>
            <View style={styles.iconContainer}>
                {isUrl ? (
                    <Image
                        source={{ uri: icon }}
                        style={{ width: 14, height: 14, tintColor: Colors.text }}
                        resizeMode="contain"
                        // URL が読み込めない場合のフォールバック
                        defaultSource={localIcon}
                    />
                ) : localIcon ? (
                    <Image
                        source={localIcon}
                        style={{ width: 14, height: 14, tintColor: Colors.text }}
                        resizeMode="contain"
                    />
                ) : IconComponent ? (
                    <IconComponent size={12} color={Colors.text} strokeWidth={2} />
                ) : (
                    <CustomIcons.GuitarIcon size={12} color={Colors.text} />
                )}
            </View>
            <Text style={[styles.instrumentLabel, textStyle]}>{label}</Text>
        </View>
    );
}

interface GenreTagProps {
    label: string;
    color: string;
    opacity?: string;
    style?: ViewStyle | ViewStyle[];
    textStyle?: TextStyle | TextStyle[];
}

export function GenreTag({ label, color, opacity = '15', style, textStyle }: GenreTagProps) {
    return (
        <View style={[styles.genreTag, { backgroundColor: color + opacity }, style]}>
            <Text style={[styles.genreLabel, { color: color }, textStyle]}>
                {label}
            </Text>
        </View>
    );
}
