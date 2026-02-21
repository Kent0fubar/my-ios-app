import { logger, consoleTransport } from "react-native-logs";

const defaultConfig = {
    levels: {
        debug: 0,
        info: 1,
        warn: 2,
        error: 3,
    },
    severity: "debug",
    transport: consoleTransport,
    transportOptions: {
        colors: {
            info: "blueBright",
            warn: "yellowBright",
            error: "redBright",
        } as Record<string, "blueBright" | "yellowBright" | "redBright" | "default" | "black" | "red" | "green" | "yellow" | "blue" | "magenta" | "cyan" | "white" | "grey" | "greenBright" | "magentaBright" | "cyanBright" | "whiteBright">,
    },
    async: true,
    dateFormat: "time",
    printLevel: true,
    printDate: true,
    enabled: true,
};

const consoleLogger = logger.createLogger(defaultConfig);

export const log = {
    debug: (...args: any[]) => consoleLogger.debug(...args),
    info: (...args: any[]) => consoleLogger.info(...args),
    warn: (...args: any[]) => consoleLogger.warn(...args),
    error: (message: string, error?: any, context?: any) => {
        // 将来的に Sentry や Crashlytics にエラーを送信する処理をここに追加
        // exemplo: Sentry.captureException(error, { extra: context });

        if (error) {
            consoleLogger.error(`${message} | Error: ${error.message || error}`, error, context || '');
        } else {
            consoleLogger.error(message, context || '');
        }
    },
};
