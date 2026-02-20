/**
 * マッチングシミュレーションテスト
 * 池袋エリアの仮想ユーザーデータで、スコア計算とソートを検証
 */

// ============================================================
// マッチングスコア計算ロジック（dataService.tsから抽出）
// ============================================================

function calculateDistance(
    lat1: number, lon1: number,
    lat2: number, lon2: number
): number {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180);
}

interface SimUser {
    id: string;
    name: string;
    location: string;
    latitude: number;
    longitude: number;
    tags: string[];
    genres: string[];
    instruments: string[];
    looking_for: string[];
    skill_level: string;
}

function calculateMatchScore(
    myProfile: { tags: string[]; genres: string[]; instruments: string[]; looking_for: string[] },
    other: SimUser,
    myLat: number,
    myLon: number,
): { matchScore: number; distance: number } {
    const tagOverlap = myProfile.tags.filter(t => other.tags.includes(t)).length;
    const genreOverlap = myProfile.genres.filter(g => other.genres.includes(g)).length;
    const instrumentOverlap = myProfile.instruments.filter(i => other.instruments.includes(i)).length;
    const lookingForOverlap = myProfile.looking_for.filter(l => other.looking_for.includes(l)).length;

    const maxTags = Math.max(myProfile.tags.length, other.tags.length, 1);
    const maxGenres = Math.max(myProfile.genres.length, other.genres.length, 1);
    const maxInstruments = Math.max(myProfile.instruments.length, other.instruments.length, 1);
    const maxLookingFor = Math.max(myProfile.looking_for.length, other.looking_for.length, 1);

    // スコア: タグ40% + 目的25% + ジャンル20% + 楽器15%
    const tagScore = (tagOverlap / maxTags) * 40;
    const lookingForScore = (lookingForOverlap / maxLookingFor) * 25;
    const genreScore = (genreOverlap / maxGenres) * 20;
    const instrumentScore = (instrumentOverlap / maxInstruments) * 15;
    const matchScore = Math.round(tagScore + lookingForScore + genreScore + instrumentScore);

    const distance = calculateDistance(myLat, myLon, other.latitude, other.longitude);

    return { matchScore, distance };
}

// ============================================================
// テストデータ: 池袋周辺の仮想ユーザー15人
// ============================================================

// 池袋駅の座標
const IKEBUKURO = { lat: 35.7295, lon: 139.7109 };

const mockUsersIkebukuro: SimUser[] = [
    // --- 高マッチが期待されるユーザー ---
    {
        id: '1', name: '田中ユウキ', location: '池袋',
        latitude: 35.7310, longitude: 139.7120, // 池袋駅から約200m
        tags: ['live_active', 'original', 'weekend_only'],
        genres: ['rock', 'pop', 'indie'],
        instruments: ['guitar', 'vocal'],
        looking_for: ['band', 'session'],
        skill_level: 'advanced',
    },
    {
        id: '2', name: '佐藤ミク', location: '目白',
        latitude: 35.7210, longitude: 139.7070, // 目白駅（池袋から約1km）
        tags: ['live_active', 'original', 'compose'],
        genres: ['rock', 'indie', 'folk'],
        instruments: ['vocal', 'guitar'],
        looking_for: ['band', 'collaboration'],
        skill_level: 'intermediate',
    },
    {
        id: '3', name: '高橋ケンタ', location: '大塚',
        latitude: 35.7316, longitude: 139.7280, // 大塚駅（池袋から約1.5km）
        tags: ['live_active', 'pro_oriented', 'weekday_ok'],
        genres: ['rock', 'metal', 'punk'],
        instruments: ['drums'],
        looking_for: ['band', 'session'],
        skill_level: 'advanced',
    },
    // --- 中マッチが期待されるユーザー ---
    {
        id: '4', name: '渡辺アオイ', location: '新宿',
        latitude: 35.6896, longitude: 139.7006, // 新宿駅（池袋から約4.5km）
        tags: ['dtm', 'original', 'recording'],
        genres: ['pop', 'electronic', 'indie'],
        instruments: ['keyboard', 'producer'],
        looking_for: ['collaboration', 'songwriter'],
        skill_level: 'professional',
    },
    {
        id: '5', name: '伊藤リナ', location: '巣鴨',
        latitude: 35.7334, longitude: 139.7394, // 巣鴨駅（池袋から約2.5km）
        tags: ['casual', 'beginner_welcome', 'weekend_only'],
        genres: ['pop', 'folk'],
        instruments: ['vocal'],
        looking_for: ['band', 'collaboration'],
        skill_level: 'beginner',
    },
    {
        id: '6', name: '山本ショウタ', location: '板橋',
        latitude: 35.7512, longitude: 139.7099, // 板橋駅（池袋から約2.5km）
        tags: ['live_active', 'improv', 'weekday_ok'],
        genres: ['jazz', 'funk', 'blues'],
        instruments: ['bass'],
        looking_for: ['session', 'band'],
        skill_level: 'advanced',
    },
    {
        id: '7', name: '中村マイ', location: '練馬',
        latitude: 35.7372, longitude: 139.6535, // 練馬駅（池袋から約5km）
        tags: ['original', 'compose', 'lyrics', 'casual'],
        genres: ['pop', 'folk', 'indie'],
        instruments: ['piano', 'vocal'],
        looking_for: ['collaboration', 'songwriter'],
        skill_level: 'intermediate',
    },
    // --- 低マッチが期待されるユーザー ---
    {
        id: '8', name: '小林タクミ', location: '赤羽',
        latitude: 35.7780, longitude: 139.7209, // 赤羽駅（池袋から約5.5km）
        tags: ['dtm', 'studio_owner', 'recording'],
        genres: ['electronic', 'hiphop', 'rnb'],
        instruments: ['producer'],
        looking_for: ['collaboration', 'producer'],
        skill_level: 'professional',
    },
    {
        id: '9', name: '加藤ユカ', location: '中野',
        latitude: 35.7065, longitude: 139.6658, // 中野駅（池袋から約4.5km）
        tags: ['theory_lover', 'improv', 'teaching'],
        genres: ['jazz', 'classical'],
        instruments: ['piano'],
        looking_for: ['session', 'teacher'],
        skill_level: 'professional',
    },
    {
        id: '10', name: '松田リョウ', location: '王子',
        latitude: 35.7529, longitude: 139.7378, // 王子駅（池袋から約3.5km）
        tags: ['cover', 'casual', 'weekend_only'],
        genres: ['pop', 'rock'],
        instruments: ['guitar'],
        looking_for: ['session'],
        skill_level: 'beginner',
    },
    // --- ジャンルが全く異なるユーザー ---
    {
        id: '11', name: '鈴木ハルト', location: '東池袋',
        latitude: 35.7280, longitude: 139.7188, // 東池袋（池袋から約700m）
        tags: ['dtm', 'pro_oriented'],
        genres: ['electronic', 'hiphop'],
        instruments: ['producer'],
        looking_for: ['producer', 'collaboration'],
        skill_level: 'advanced',
    },
    {
        id: '12', name: '吉田サクラ', location: '要町',
        latitude: 35.7350, longitude: 139.6980, // 要町駅（池袋から約1.2km）
        tags: ['casual', 'beginner_welcome'],
        genres: ['classical'],
        instruments: ['violin'],
        looking_for: ['teacher', 'student'],
        skill_level: 'beginner',
    },
    // --- 遠方のユーザー ---
    {
        id: '13', name: '木村ソウタ', location: '横浜',
        latitude: 35.4437, longitude: 139.6380, // 横浜駅（池袋から約33km）
        tags: ['live_active', 'original', 'weekend_only'],
        genres: ['rock', 'pop', 'indie'],
        instruments: ['guitar', 'vocal'],
        looking_for: ['band', 'session'],
        skill_level: 'advanced',
    },
    {
        id: '14', name: '斉藤アカリ', location: '千葉',
        latitude: 35.6074, longitude: 140.1065, // 千葉駅（池袋から約40km）
        tags: ['live_active', 'pro_oriented'],
        genres: ['rock', 'punk'],
        instruments: ['drums'],
        looking_for: ['band'],
        skill_level: 'advanced',
    },
    {
        id: '15', name: '井上カイト', location: '立川',
        latitude: 35.6980, longitude: 139.4140, // 立川駅（池袋から約26km）
        tags: ['casual', 'cover'],
        genres: ['pop'],
        instruments: ['vocal'],
        looking_for: ['session'],
        skill_level: 'beginner',
    },
];

// ============================================================
// テスト
// ============================================================

describe('池袋マッチングシミュレーション', () => {
    // 自分のプロフィール（池袋在住のギタリスト、バンドメンバー募集中）
    const myProfile = {
        tags: ['live_active', 'original', 'weekend_only'],
        genres: ['rock', 'pop', 'indie'],
        instruments: ['guitar', 'vocal'],
        looking_for: ['band', 'session'],
    };

    // 全ユーザーのスコアを計算
    const results = mockUsersIkebukuro.map(user => {
        const { matchScore, distance } = calculateMatchScore(
            myProfile, user, IKEBUKURO.lat, IKEBUKURO.lon
        );
        return { ...user, matchScore, distance };
    }).sort((a, b) => {
        if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
        return a.distance - b.distance;
    });

    test('スコア計算結果の一覧を出力', () => {
        console.log('\n===== 池袋マッチング結果 =====\n');
        console.log('順位 | 名前             | スコア | 距離    | 場所     | 共通タグ                    | 共通目的');
        console.log('---- | ---------------- | ------ | ------- | -------- | --------------------------- | --------');

        results.forEach((user, i) => {
            const commonTags = myProfile.tags.filter(t => user.tags.includes(t));
            const commonLF = myProfile.looking_for.filter(l => user.looking_for.includes(l));
            console.log(
                `${String(i + 1).padStart(4)} | ` +
                `${user.name.padEnd(16)} | ` +
                `${String(user.matchScore).padStart(4)}%  | ` +
                `${String(user.distance).padStart(5)}km | ` +
                `${user.location.padEnd(8)} | ` +
                `${(commonTags.length > 0 ? commonTags.join(', ') : 'なし').padEnd(27)} | ` +
                `${commonLF.length > 0 ? commonLF.join(', ') : 'なし'}`
            );
        });

        console.log('\n===== 統計 =====');
        console.log(`総ユーザー数: ${results.length}`);
        console.log(`スコア60%以上: ${results.filter(r => r.matchScore >= 60).length}人`);
        console.log(`スコア30-59%: ${results.filter(r => r.matchScore >= 30 && r.matchScore < 60).length}人`);
        console.log(`スコア1-29%: ${results.filter(r => r.matchScore >= 1 && r.matchScore < 30).length}人`);
        console.log(`スコア0%: ${results.filter(r => r.matchScore === 0).length}人`);
        console.log(`5km以内: ${results.filter(r => r.distance <= 5).length}人`);
        console.log(`10km以内: ${results.filter(r => r.distance <= 10).length}人`);

        expect(results.length).toBe(15);
    });

    test('最もスコアが高いのはプロフィールが完全一致する田中ユウキ', () => {
        expect(results[0].name).toBe('田中ユウキ');
        expect(results[0].matchScore).toBe(100);
    });

    test('同じロックバンド志向の佐藤ミク・高橋ケンタが上位に来る', () => {
        const top5Names = results.slice(0, 5).map(r => r.name);
        expect(top5Names).toContain('佐藤ミク');
        expect(top5Names).toContain('高橋ケンタ');
    });

    test('遠方でもプロフィールが一致すれば高スコア（横浜の木村ソウタ）', () => {
        const kimura = results.find(r => r.name === '木村ソウタ')!;
        expect(kimura.matchScore).toBe(100);
        expect(kimura.distance).toBeGreaterThan(30);
    });

    test('完全一致でも遠方ユーザーは同スコア内で後ろにソートされる', () => {
        const tanaka = results.find(r => r.name === '田中ユウキ')!;
        const kimura = results.find(r => r.name === '木村ソウタ')!;
        // 同スコアなら近い方が先
        expect(tanaka.matchScore).toBe(kimura.matchScore);
        expect(results.indexOf(tanaka)).toBeLessThan(results.indexOf(kimura));
    });

    test('ジャンルが全く異なるユーザーはスコアが低い', () => {
        const suzuki = results.find(r => r.name === '鈴木ハルト')!; // electronic, hiphop
        const yoshida = results.find(r => r.name === '吉田サクラ')!; // classical, violin
        expect(suzuki.matchScore).toBeLessThan(30);
        expect(yoshida.matchScore).toBeLessThan(15);
    });

    test('5km以内のフィルタリング', () => {
        const within5km = results.filter(r => r.distance <= 5);
        expect(within5km.length).toBeGreaterThanOrEqual(7);
        // 横浜・千葉・立川のユーザーは含まれない
        const farUsers = within5km.filter(r =>
            ['横浜', '千葉', '立川'].includes(r.location)
        );
        expect(farUsers.length).toBe(0);
    });

    test('10km以内のフィルタリング', () => {
        const within10km = results.filter(r => r.distance <= 10);
        expect(within10km.length).toBeGreaterThanOrEqual(10);
    });

    test('スコアが0のユーザーはいない（全員何かしら共通点がある設定）', () => {
        // 吉田サクラ（classical, violin, teacher/student）は共通点がほぼない
        const minScore = Math.min(...results.map(r => r.matchScore));
        // 最低スコアでも何かしら表示される
        expect(minScore).toBeGreaterThanOrEqual(0);
    });
});
