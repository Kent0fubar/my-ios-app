import { ExpoConfig, ConfigContext } from 'expo/config';

// 環境変数 APP_ENV を EAS Build 側やローカル実行時に指定することで環境を切り分けます
// 指定がない場合はローカル開発（development）として扱います
type AppEnv = 'development' | 'preview' | 'production';
const appEnv = (process.env.APP_ENV as AppEnv) || 'development';

export default ({ config }: ConfigContext): ExpoConfig => {
    // 環境ごとの設定
    const environmentConfig = {
        development: {
            name: 'BandLink (Dev)',
            bundleIdentifier: 'com.bandlink.app.dev',
            package: 'com.bandlink.app.dev',
        },
        preview: {
            name: 'BandLink (Preview)',
            bundleIdentifier: 'com.bandlink.app.preview',
            package: 'com.bandlink.app.preview',
        },
        production: {
            name: 'BandLink',
            bundleIdentifier: 'com.bandlink.app',
            package: 'com.bandlink.app',
        },
    }[appEnv as AppEnv];

    // バージョン番号の管理（自動インクリメントにも対応）
    const version = '1.0.0';
    const buildNumber = '1';

    return {
        ...config,
        name: environmentConfig.name, // 環境固有の名前を優先
        slug: 'bandlink',
        version,
        ios: {
            ...config.ios,
            buildNumber,
            bundleIdentifier: environmentConfig.bundleIdentifier,
        },
        android: {
            ...config.android,
            versionCode: Number(buildNumber),
            package: environmentConfig.package,
        },
        extra: {
            // expo-router用やその他の設定
            router: {
                origin: false,
            },
            eas: {
                // eas build:configure 実行時に自動設定されます
            },
            ...environmentConfig,
        },
    };
};
