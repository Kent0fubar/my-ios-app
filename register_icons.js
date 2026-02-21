const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const inputDir = 'assets/icons/instruments_transparent';
const bucketName = 'instruments';

async function uploadAndRegister() {
    console.log('Starting upload...');

    // 1. バケットの確認（存在しなければエラーになるが、作成権限があるか不明）
    // 通常、開発者が手動で作成するか、adminトークンが必要
    // ここではアップロードを試みて、失敗したらバケット作成を促す

    const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.png'));
    const results = [];

    for (const file of files) {
        const fileContent = fs.readFileSync(path.join(inputDir, file));
        const fileName = file;

        // Content-Typeを指定してアップロード
        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(fileName, fileContent, {
                contentType: 'image/png',
                upsert: true
            });

        if (error) {
            console.error(`Failed to upload ${file}:`, error.message);
            if (error.message.includes('bucket not found')) {
                console.log(`Please create a public bucket named "${bucketName}" in Supabase Storage.`);
                return;
            }
            continue;
        }

        const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName);

        results.push({
            id: file.replace('.png', ''),
            icon_url: publicUrl
        });
        console.log(`Uploaded and got URL: ${file} -> ${publicUrl}`);
    }

    // 2. DBへの登録試行
    console.log('\nTrying to register to DB table "instruments"...');
    // 注意: profiles テーブルに instruments カラムがあるプロジェクトと、
    // マスタとしての instruments テーブルがあるプロジェクトがありますが、
    // ここではマスタテーブルへの登録を想定します。

    const { error: dbError } = await supabase
        .from('instruments')
        .upsert(results.map(r => ({
            id: r.id,
            icon_url: r.icon_url,
            // labelはファイル名から推察（後で修正可能）
            label: r.id.charAt(0).toUpperCase() + r.id.slice(1)
        })));

    if (dbError) {
        console.error('Failed to register to DB table:', dbError.message);
        console.log('\n--- SQL to create table and populate data ---');
        console.log(`
CREATE TABLE IF NOT EXISTS public.instruments (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    icon_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Enable read access for everyone
ALTER TABLE public.instruments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON public.instruments FOR SELECT USING (true);

-- Insert data
${results.map(r => `INSERT INTO public.instruments (id, label, icon_url) VALUES ('${r.id}', '${r.id.charAt(0).toUpperCase() + r.id.slice(1)}', '${r.icon_url}') ON CONFLICT (id) DO UPDATE SET icon_url = EXCLUDED.icon_url;`).join('\n')}
        `);
    } else {
        console.log('Successfully registered to DB table "instruments".');
    }
}

uploadAndRegister();
