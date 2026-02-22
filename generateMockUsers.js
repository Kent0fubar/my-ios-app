const fs = require('fs');
const crypto = require('crypto');

const names = [
    'ケンタ', 'ハルカ', 'リョウ', 'ミサキ', 'ダイチ',
    'ユイ', 'タクミ', 'サクラ', 'ショウタ', 'ヒナタ',
    'レイ', 'アオイ', 'ユウマ', 'ナナミ', 'コウキ',
    'カエデ', 'レン', 'リオ', 'ソウタ', 'リン',
    'ナオト', 'ユキ', 'マコト', 'アヤネ', 'ジュン',
    'マユ', 'シン', 'アカリ', 'タイガ', 'ユナ',
    'ケンジ', 'ミキ', 'ユウキ', 'ノア', 'リュウ',
    'ヒマリ', 'カイ', 'ミウ', 'シュン', 'リコ',
    'カイト', 'ハナ', 'ユウ', 'メイ', 'ソラ',
    'アサヒ', 'リナ', 'トモヤ', 'モモ', 'タクト'
];

const locations = ['渋谷', '新宿', '下北沢', '秋葉原', '高円寺', '吉祥寺', '池袋', '原宿', '代々木', '恵比寿', '中野', '三軒茶屋', '横浜', '川崎', '大宮'];
const bios = [
    '週末にセッションできる仲間を募集しています！',
    'オリジナル曲を作っています。ボーカル急募！',
    '初心者ですが、バンド組みたいです。',
    'ロックを中心にコピーバンドやってます。',
    'DTMで曲作りしてます。オンラインでコラボできる方。',
    'ジャズセッションによく行きます。',
    'メタル好きなドラマーです。ツーバスドコドコ踏めます。',
    'アコギで弾き語りしてます。ユニット組みたいです。',
    'プロ志向で活動中です。本気で上を目指す方、連絡ください。',
    'ゆるく音楽を楽しみたいです。',
    '音楽理論オタクです。変拍子好き。',
    'R&Bやソウルのグルーヴが好きです。',
    'ボカロPやってます。歌い手さん探してます。',
    'ライブハウスでの実績多数。即戦力になれます。',
    '洋楽ロックのカバーから始めませんか？'
];
const instruments = ['guitar', 'bass', 'drums', 'vocal', 'keyboard', 'piano', 'saxophone', 'trumpet', 'violin', 'dj', 'producer', 'songwriter'];
const genres = ['rock', 'pop', 'jazz', 'hiphop', 'electronic', 'rnb', 'metal', 'punk', 'folk', 'classical', 'reggae'];
const skillLevels = ['beginner', 'intermediate', 'advanced', 'professional'];
const tags = ['live_active', 'dtm', 'original', 'cover', 'weekday_ok', 'weekend_only', 'studio_owner', 'beginner_welcome', 'pro_oriented', 'casual', 'theory_lover', 'improv'];
const lookingFor = ['band', 'session', 'collaboration', 'teacher', 'student', 'producer', 'songwriter'];

// アバター画像 (Unsplash からのランダムポートレート)
const getAvatarUrl = (index) => `https://i.pravatar.cc/400?img=${(index % 70) + 1}`;

function getRandom(arr, count = 1) {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const formatArray = (arr) => `{${arr.join(',')}}`;

let sql = `-- Supabase profiles へのダミーデータ50件追加クエリ\n`;
sql += `INSERT INTO profiles (id, name, age, location, bio, latitude, longitude, instruments, genres, tags, skill_level, looking_for, avatar_url, is_premium, is_verified, created_at, updated_at) VALUES\n`;

const values = [];

for (let i = 0; i < 50; i++) {
    const id = crypto.randomUUID();
    const name = names[i] || `User ${i}`;
    const age = getRandomInt(18, 45);
    const location = getRandom(locations)[0];
    const bio = getRandom(bios)[0].replace(/'/g, "''"); // エスケープ

    // 東京近郊のランダムな緯度経度 (35.6 ~ 35.7, 139.6 ~ 139.8)
    const lat = (35.6 + Math.random() * 0.1).toFixed(6);
    const lng = (139.6 + Math.random() * 0.2).toFixed(6);

    const insts = getRandom(instruments, getRandomInt(1, 3));
    const gens = getRandom(genres, getRandomInt(1, 4));
    const userTags = getRandom(tags, getRandomInt(2, 5));
    const skill = getRandom(skillLevels)[0];
    const looking = getRandom(lookingFor, getRandomInt(1, 3));
    const avatar = getAvatarUrl(i);
    const isPremium = Math.random() > 0.8;
    const isVerified = Math.random() > 0.5;

    values.push(`('${id}', '${name}', ${age}, '${location}', '${bio}', ${lat}, ${lng}, '${formatArray(insts)}', '${formatArray(gens)}', '${formatArray(userTags)}', '${skill}', '${formatArray(looking)}', '${avatar}', ${isPremium}, ${isVerified}, NOW(), NOW())`);
}

sql += values.join(',\n') + ';\n';

fs.writeFileSync('insert_50_mock_users.sql', sql, 'utf8');
console.log('Successfully generated insert_50_mock_users.sql');
