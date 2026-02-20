/**
 * セキュリティユーティリティのユニットテスト
 * - 入力サニタイズ（XSS防止）
 * - パスワード強度チェック
 * - エラーメッセージの汎用化（列挙攻撃防止）
 */
import {
    sanitizeInput,
    sanitizeEmail,
    getPasswordStrength,
    getSecureAuthErrorMessage,
} from '../../src/lib/security';

describe('sanitizeInput - XSS防止', () => {
    test('HTMLタグをエスケープする', () => {
        const result = sanitizeInput('<script>alert("xss")</script>');
        expect(result).not.toContain('<script>');
        expect(result).toContain('&lt;');
    });

    test('通常のテキストはそのまま返す', () => {
        expect(sanitizeInput('Hello World')).toBe('Hello World');
    });

    test('前後の空白をトリムする', () => {
        expect(sanitizeInput('  hello  ')).toBe('hello');
    });

    test('空文字列を処理できる', () => {
        expect(sanitizeInput('')).toBe('');
    });

    test('日本語テキストはそのまま返す', () => {
        expect(sanitizeInput('こんにちは世界')).toBe('こんにちは世界');
    });

    test('&をエスケープする', () => {
        expect(sanitizeInput('a & b')).toContain('&amp;');
    });

    test('ダブルクォートをエスケープする', () => {
        expect(sanitizeInput('say "hello"')).toContain('&quot;');
    });
});

describe('sanitizeEmail', () => {
    test('メールアドレスを小文字に変換する', () => {
        expect(sanitizeEmail('User@Example.COM')).toBe('user@example.com');
    });

    test('前後の空白をトリムする', () => {
        expect(sanitizeEmail('  user@example.com  ')).toBe('user@example.com');
    });
});

describe('getPasswordStrength - パスワード強度', () => {
    test('空のパスワードはscore 0を返す', () => {
        const result = getPasswordStrength('');
        expect(result.score).toBe(0);
    });

    test('短いパスワードは低スコアを返す', () => {
        const result = getPasswordStrength('abc');
        expect(result.score).toBeLessThanOrEqual(1);
    });

    test('十分な強度のパスワードは高スコアを返す', () => {
        const result = getPasswordStrength('MyP@ssw0rd!2024');
        expect(result.score).toBeGreaterThanOrEqual(3);
    });

    test('数字のみのパスワードは低スコアを返す', () => {
        const result = getPasswordStrength('12345678');
        expect(result.score).toBeLessThanOrEqual(2);
    });

    test('labelプロパティが返される', () => {
        const result = getPasswordStrength('test');
        expect(result.label).toBeDefined();
        expect(typeof result.label).toBe('string');
    });

    test('colorプロパティが返される', () => {
        const result = getPasswordStrength('test');
        expect(result.color).toBeDefined();
        expect(result.color).toMatch(/^#/);
    });
});

describe('getSecureAuthErrorMessage - 列挙攻撃防止', () => {
    test('Invalid login credentialsを汎用メッセージに変換する', () => {
        const result = getSecureAuthErrorMessage({ message: 'Invalid login credentials' });
        expect(result).toBe('メールアドレスまたはパスワードが正しくありません');
    });

    test('User already registeredを汎用メッセージに変換する', () => {
        const result = getSecureAuthErrorMessage({ message: 'User already registered' });
        // アカウント存在を隠すため、成功メッセージを返す
        expect(result).toBe('確認メールを送信しました。メールをご確認ください');
    });

    test('Rate limitを適切に処理する', () => {
        const result = getSecureAuthErrorMessage({ message: 'Rate limit exceeded' });
        expect(result).toContain('しばらく');
    });

    test('不明なエラーも適切に処理する', () => {
        const result = getSecureAuthErrorMessage({ message: 'Unknown error' });
        expect(result.length).toBeGreaterThan(0);
    });

    test('nullエラーも処理できる', () => {
        const result = getSecureAuthErrorMessage(null);
        expect(result.length).toBeGreaterThan(0);
    });
});
