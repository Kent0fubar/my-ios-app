/**
 * セキュリティユーティリティ
 * 入力バリデーション、サニタイズ、パスワード強度チェック
 */

// ============================================================
// 入力サニタイズ（XSS/インジェクション防止）
// ============================================================

/**
 * HTML特殊文字をエスケープ
 */
export function sanitizeInput(input: string): string {
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .trim();
}

/**
 * メールアドレスのサニタイズ
 * 前後の空白を除去し、小文字に変換
 */
export function sanitizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

/**
 * ユーザー名のサニタイズ
 * 制御文字を除去し、前後の空白を除去
 */
export function sanitizeName(name: string): string {
    return name
        .replace(/[\x00-\x1F\x7F]/g, '') // 制御文字除去
        .replace(/\s+/g, ' ') // 連続空白を1つに
        .trim()
        .substring(0, 50); // 最大50文字
}

// ============================================================
// バリデーション
// ============================================================

export interface ValidationResult {
    isValid: boolean;
    error: string | null;
}

/**
 * メールアドレスのバリデーション
 */
export function validateEmail(email: string): ValidationResult {
    if (!email || email.trim().length === 0) {
        return { isValid: false, error: 'メールアドレスを入力してください' };
    }

    // RFC 5322準拠の簡易チェック
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(email.trim())) {
        return { isValid: false, error: '有効なメールアドレスを入力してください' };
    }

    if (email.length > 254) {
        return { isValid: false, error: 'メールアドレスが長すぎます' };
    }

    return { isValid: true, error: null };
}

/**
 * パスワード強度チェック
 * - 最低8文字
 * - 大文字を1つ以上含む
 * - 小文字を1つ以上含む
 * - 数字を1つ以上含む
 * - 特殊文字を1つ以上含む
 */
export function validatePassword(password: string): ValidationResult {
    if (!password || password.length === 0) {
        return { isValid: false, error: 'パスワードを入力してください' };
    }

    if (password.length < 8) {
        return { isValid: false, error: 'パスワードは8文字以上にしてください' };
    }

    if (password.length > 128) {
        return { isValid: false, error: 'パスワードが長すぎます' };
    }

    if (!/[A-Z]/.test(password)) {
        return { isValid: false, error: '大文字を1つ以上含めてください' };
    }

    if (!/[a-z]/.test(password)) {
        return { isValid: false, error: '小文字を1つ以上含めてください' };
    }

    if (!/[0-9]/.test(password)) {
        return { isValid: false, error: '数字を1つ以上含めてください' };
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        return { isValid: false, error: '特殊文字(!@#$%等)を1つ以上含めてください' };
    }

    return { isValid: true, error: null };
}

/**
 * パスワードの強度スコア(0-4)を取得
 */
export function getPasswordStrength(password: string): {
    score: number;
    label: string;
    color: string;
} {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;

    const levels = [
        { label: '非常に弱い', color: '#EF4444' },
        { label: '弱い', color: '#F97316' },
        { label: '普通', color: '#EAB308' },
        { label: '強い', color: '#22C55E' },
        { label: '非常に強い', color: '#10B981' },
    ];

    const level = levels[Math.min(score, 4)];
    return { score: Math.min(score, 4), ...level };
}

/**
 * ユーザー名のバリデーション
 */
export function validateName(name: string): ValidationResult {
    if (!name || name.trim().length === 0) {
        return { isValid: false, error: '名前を入力してください' };
    }

    if (name.trim().length > 50) {
        return { isValid: false, error: '名前は50文字以内にしてください' };
    }

    return { isValid: true, error: null };
}

/**
 * パスワード確認のバリデーション
 */
export function validatePasswordConfirm(
    password: string,
    confirm: string
): ValidationResult {
    if (!confirm || confirm.length === 0) {
        return { isValid: false, error: 'パスワードを再入力してください' };
    }

    if (password !== confirm) {
        return { isValid: false, error: 'パスワードが一致しません' };
    }

    return { isValid: true, error: null };
}

// ============================================================
// セキュリティヘルパー
// ============================================================

/**
 * 汎用エラーメッセージに変換（アカウント列挙攻撃防止）
 * Supabase が返す具体的なエラーメッセージを、攻撃者に有用でない形に変換
 */
export function getSecureAuthErrorMessage(error: any): string {
    const message = error?.message?.toLowerCase() || '';

    // アカウント列挙を防ぐため、ログイン失敗の理由を曖昧にする
    if (
        message.includes('invalid login credentials') ||
        message.includes('invalid email') ||
        message.includes('user not found') ||
        message.includes('wrong password')
    ) {
        return 'メールアドレスまたはパスワードが正しくありません';
    }

    // メール送信系は常に成功したように見せる
    if (message.includes('email not confirmed')) {
        return '確認メールを送信しました。メールをご確認ください';
    }

    // レート制限
    if (message.includes('rate limit') || message.includes('too many requests')) {
        return 'しばらく時間をおいてから再度お試しください';
    }

    // ネットワークエラー
    if (message.includes('network') || message.includes('fetch')) {
        return 'ネットワーク接続を確認してください';
    }

    // 既に登録済み
    if (message.includes('already registered') || message.includes('already exists')) {
        // 攻撃者にメール存在を知られないように汎用メッセージを返す
        return '確認メールを送信しました。メールをご確認ください';
    }

    // その他の不明なエラー
    return 'エラーが発生しました。しばらくしてから再度お試しください';
}
