/**
 * アプリケーション層のレート制限
 * DoS攻撃対策 — ユーザーごとのAPIコール制限
 *
 * Supabase Free プランはハードリミット方式（超過→停止、課金なし）だが、
 * 無料枠を不正利用から守るためにアプリ側でも制限をかける
 */

interface RateLimitConfig {
    maxRequests: number;  // 制限期間内の最大リクエスト数
    windowMs: number;     // 制限期間（ミリ秒）
}

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

// アクションごとのレート制限設定
const RATE_LIMITS: Record<string, RateLimitConfig> = {
    // スワイプ: Freeユーザー 1日50回、Premiumは300回
    'swipe:free': { maxRequests: 50, windowMs: 24 * 60 * 60 * 1000 },
    'swipe:premium': { maxRequests: 300, windowMs: 24 * 60 * 60 * 1000 },

    // メッセージ送信: 1分あたり10件（全ユーザー共通）
    'message:send': { maxRequests: 10, windowMs: 60 * 1000 },

    // プロフィール閲覧: 1分あたり30件
    'profile:view': { maxRequests: 60, windowMs: 60 * 1000 },

    // 検索/フィルター: 1分あたり30回
    'search': { maxRequests: 30, windowMs: 60 * 1000 },
    'search:premium': { maxRequests: 100, windowMs: 60 * 1000 },

    // 認証: 1時間あたり10回（ブルートフォース防止）
    'auth:login': { maxRequests: 20, windowMs: 60 * 60 * 1000 },
    'auth:signup': { maxRequests: 3, windowMs: 60 * 60 * 1000 },

    // ファイルアップロード: 1時間あたり10回
    'upload:file': { maxRequests: 10, windowMs: 60 * 60 * 1000 },

    // レポート: 1日あたり10回
    'report': { maxRequests: 10, windowMs: 24 * 60 * 60 * 1000 },

    // 汎用API: 1分あたり60回
    'api:general': { maxRequests: 60, windowMs: 60 * 1000 },
};

// メモリ内のレート制限ストア
const rateLimitStore = new Map<string, RateLimitEntry>();

// 古いエントリを定期的にクリーンアップ
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (now > entry.resetAt) {
            rateLimitStore.delete(key);
        }
    }
}, 60 * 1000); // 1分ごとにクリーンアップ

/**
 * レート制限チェック
 * @param action アクション名（RATE_LIMITSのキー）
 * @param userId ユーザーID
 * @returns { allowed: boolean, remaining: number, resetAt: number }
 */
export function checkRateLimit(
    action: string,
    userId: string
): { allowed: boolean; remaining: number; resetAt: number; retryAfterMs: number } {
    let config = { ...(RATE_LIMITS[action] || RATE_LIMITS['api:general']) };

    // 開発モード時は制限を大幅に緩和(10倍)する
    if (__DEV__) {
        config.maxRequests = config.maxRequests * 10;
    }

    const key = `${action}:${userId}`;
    const now = Date.now();

    let entry = rateLimitStore.get(key);

    // エントリが存在しないか期限切れの場合、新しいエントリを作成
    if (!entry || now > entry.resetAt) {
        entry = {
            count: 0,
            resetAt: now + config.windowMs,
        };
    }

    // カウントを増加
    entry.count += 1;
    rateLimitStore.set(key, entry);

    const allowed = entry.count <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - entry.count);
    const retryAfterMs = allowed ? 0 : entry.resetAt - now;

    if (!allowed && __DEV__) {
        console.warn(
            `[RateLimit] ${action} blocked for user ${userId}. ` +
            `Retry after ${Math.ceil(retryAfterMs / 1000)}s`
        );
    }

    return { allowed, remaining, resetAt: entry.resetAt, retryAfterMs };
}

/**
 * レート制限付きAPI呼び出しラッパー
 * 制限を超えた場合はエラーをthrowする
 */
export async function withRateLimit<T>(
    action: string,
    userId: string,
    fn: () => Promise<T>
): Promise<T> {
    const { allowed, remaining, retryAfterMs } = checkRateLimit(action, userId);

    if (!allowed) {
        const minutes = Math.ceil(retryAfterMs / 60000);
        throw new RateLimitError(
            `操作の制限に達しました。${minutes}分後に再度お試しください。`,
            retryAfterMs
        );
    }

    return fn();
}

/**
 * レート制限エラー
 */
export class RateLimitError extends Error {
    retryAfterMs: number;

    constructor(message: string, retryAfterMs: number) {
        super(message);
        this.name = 'RateLimitError';
        this.retryAfterMs = retryAfterMs;
    }
}

/**
 * 残りスワイプ数を取得
 */
export function getRemainingSwipes(userId: string, isPremium: boolean): number {
    const action = isPremium ? 'swipe:premium' : 'swipe:free';
    const config = RATE_LIMITS[action];
    const key = `${action}:${userId}`;
    const entry = rateLimitStore.get(key);

    if (!entry || Date.now() > entry.resetAt) {
        return config.maxRequests;
    }

    return Math.max(0, config.maxRequests - entry.count);
}

/**
 * 全レート制限設定を取得（デバッグ用）
 */
export function getRateLimitConfigs(): Record<string, RateLimitConfig> {
    return { ...RATE_LIMITS };
}
