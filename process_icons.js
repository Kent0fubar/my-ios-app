const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');

const inputDir = 'assets/icons/instruments';
const outputDir = 'assets/icons/instruments_transparent';

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

async function processImage(fileName) {
    const filePath = path.join(inputDir, fileName);
    const outputPath = path.join(outputDir, fileName);

    const image = await Jimp.read(filePath);

    // 輝度に基づいて透明化
    // 白っぽい部分（輝度が高い部分）だけを残し、それ以外を透明にする
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
        const r = this.bitmap.data[idx + 0];
        const g = this.bitmap.data[idx + 1];
        const b = this.bitmap.data[idx + 2];
        const a = this.bitmap.data[idx + 3];

        // 簡易的な輝度計算 (R*0.299 + G*0.587 + B*0.114)
        const brightness = r * 0.299 + g * 0.587 + b * 0.114;

        // 白色の線のアウトラインがぼやけないよう、ある程度の閾値で判定
        // チェック柄の背景は黒(0,0,0)と濃いグレーなので、輝度は低い
        if (brightness < 120) {
            this.bitmap.data[idx + 3] = 0; // 完全透明に
        } else {
            // 白線部分はそのまま（または必要に応じて純粋な白に補正）
            this.bitmap.data[idx + 0] = 255;
            this.bitmap.data[idx + 1] = 255;
            this.bitmap.data[idx + 2] = 255;
            // アルファ値は輝度に合わせてなめらかにしても良いが、一旦255
            this.bitmap.data[idx + 3] = 255;
        }
    });

    await image.writeAsync(outputPath);
    console.log(`Processed: ${fileName}`);
}

const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.png'));

(async () => {
    for (const file of files) {
        try {
            await processImage(file);
        } catch (err) {
            console.error(`Error processing ${file}:`, err);
        }
    }
    console.log('All images processed.');
})();
