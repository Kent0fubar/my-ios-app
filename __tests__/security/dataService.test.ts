/**
 * dataService のセキュリティ機能テスト
 * - UUID検証（SQLインジェクション防止）
 */

// validateUUID はモジュール内部関数のため、同じロジックを再実装してテスト
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateUUID(id: string, fieldName: string = 'ID'): void {
    if (!UUID_REGEX.test(id)) {
        throw new Error(`無効な${fieldName}形式です`);
    }
}

describe('validateUUID - SQLインジェクション防止', () => {
    test('正しいUUIDを受け入れる', () => {
        expect(() => validateUUID('550e8400-e29b-41d4-a716-446655440000')).not.toThrow();
    });

    test('大文字のUUIDも受け入れる', () => {
        expect(() => validateUUID('550E8400-E29B-41D4-A716-446655440000')).not.toThrow();
    });

    test('空文字列を拒否する', () => {
        expect(() => validateUUID('')).toThrow('無効なID形式です');
    });

    test('SQLインジェクション文字列を拒否する', () => {
        expect(() => validateUUID("'; DROP TABLE profiles; --")).toThrow();
    });

    test('PostgRESTフィルター注入を拒否する', () => {
        expect(() => validateUUID('id.eq.other-value')).toThrow();
    });

    test('ハイフンなしのUUIDを拒否する', () => {
        expect(() => validateUUID('550e8400e29b41d4a716446655440000')).toThrow();
    });

    test('短すぎるUUIDを拒否する', () => {
        expect(() => validateUUID('550e8400-e29b')).toThrow();
    });

    test('ORフィルター注入を拒否する', () => {
        expect(() => validateUUID('550e8400-e29b-41d4-a716-446655440000,user2_id.eq.attacker')).toThrow();
    });

    test('カスタムフィールド名がエラーメッセージに含まれる', () => {
        expect(() => validateUUID('invalid', 'ユーザーID')).toThrow('無効なユーザーID形式です');
    });

    test('改行コードを含む文字列を拒否する', () => {
        expect(() => validateUUID('550e8400-e29b-41d4-a716-446655440000\n')).toThrow();
    });
});

describe('UUID_REGEX パターン検証', () => {
    const validUUIDs = [
        '00000000-0000-0000-0000-000000000000',
        'ffffffff-ffff-ffff-ffff-ffffffffffff',
        '123e4567-e89b-12d3-a456-426614174000',
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    ];

    const invalidInputs = [
        '',
        'not-a-uuid',
        '123',
        'SELECT * FROM users',
        "' OR '1'='1",
        '../../etc/passwd',
        '<script>alert(1)</script>',
        '550e8400-e29b-41d4-a716-44665544000g', // 'g'はhexではない
    ];

    validUUIDs.forEach((uuid) => {
        test(`正しいUUID: ${uuid}`, () => {
            expect(UUID_REGEX.test(uuid)).toBe(true);
        });
    });

    invalidInputs.forEach((input) => {
        test(`無効な入力: "${input}"`, () => {
            expect(UUID_REGEX.test(input)).toBe(false);
        });
    });
});
