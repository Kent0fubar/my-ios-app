const jwt = require('jsonwebtoken');
const fs = require('fs');

// 💡 ここにApple Developerサイトから取得した情報を入力してください
const teamId = 'あなたのTeam_IDをここに入力'; // 例: 'ABC123DEFG'
const clientId = 'あなたのServices_IDをここに入力'; // 例: 'com.bandlink.app.signin'
const keyId = 'あなたのKey_IDをここに入力'; // 例: 'XYZ987QRST'

// 🗝️ ダウンロードした .p8ファイルのパス（同じフォルダにある場合）
// または、.p8ファイルの中身を直接以下の privateKey 変数にコピペしても構いません。
const p8FilePath = './AuthKey.p8'; // 例: './AuthKey_XYZ987QRST.p8'

try {
    let privateKey;
    if (fs.existsSync(p8FilePath)) {
        privateKey = fs.readFileSync(p8FilePath, 'utf8');
    } else {
        // ⚠️ p8ファイルがない場合は以下のフォーマットで直接貼り付けてください。
        privateKey = `-----BEGIN PRIVATE KEY-----
あなたのp8ファイルの中身をここに貼り付ける
-----END PRIVATE KEY-----`;
    }

    // 180日（6ヶ月）の有効期限を設定
    const expiresIn = 180 * 24 * 60 * 60; // 180 days in seconds

    const token = jwt.sign(
        {
            iss: teamId,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + expiresIn,
            aud: 'https://appleid.apple.com',
            sub: clientId,
        },
        privateKey,
        {
            algorithm: 'ES256',
            header: {
                alg: 'ES256',
                kid: keyId,
            },
        }
    );

    console.log('\n✅ 成功しました！以下のJWT文字列をSupabaseの "Secret key" に貼り付けてください:\n');
    console.log('--------------------------------------------------');
    console.log(token);
    console.log('--------------------------------------------------\n');
    console.log('⚠️ 注意: この文字列の有効期限は現在から180日間（約6ヶ月）です。');
    console.log('期限が切れたら、再度このスクリプトを実行して新しい文字列をSupabaseに登録し直してください。\n');

} catch (error) {
    console.error('\n❌ エラーが発生しました。ファイルパスや情報の入力が正しいか確認してください。');
    console.error(error.message);
    console.log('\n※ \'.p8\' ファイルが同じフォルダにない場合は、ソースコード内に直接コピペする方法を試してください。\n');
}
