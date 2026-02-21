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
    const width = image.bitmap.width;
    const height = image.bitmap.height;

    // 1. 輝度に基づいて透明化
    image.scan(0, 0, width, height, function (x, y, idx) {
        const r = this.bitmap.data[idx + 0];
        const g = this.bitmap.data[idx + 1];
        const b = this.bitmap.data[idx + 2];
        const brightness = r * 0.299 + g * 0.587 + b * 0.114;

        // ゴミが残りやすい楽器の閾値を個別に調整
        let threshold = 120;
        if (fileName === 'piano.png' || fileName === 'drums.png') {
            threshold = 140;
        } else if (fileName === 'saxophone.png') {
            threshold = 155; // サックスはさらに厳しくして細かい点を除去
        }

        if (brightness < threshold) {
            this.bitmap.data[idx + 3] = 0; // 暗い部分は透明に
        } else {
            // 明るい部分は純粋な白に補正
            this.bitmap.data[idx + 0] = 255;
            this.bitmap.data[idx + 1] = 255;
            this.bitmap.data[idx + 2] = 255;
            this.bitmap.data[idx + 3] = 255;
        }
    });

    // 2. 個別楽器のトリミング（外枠・四隅の削除）
    // サックスも端に枠線の残骸が出やすいため対象に追加
    if (fileName === 'drums.png' || fileName === 'piano.png' || fileName === 'saxophone.png') {
        const edgeLR = 0.12;
        const edgeTop = 0.08;
        const edgeBottom = 0.15;
        const centerX = width / 2;
        const centerY = height / 2;
        const maxRadius = Math.min(width, height) / 2;

        image.scan(0, 0, width, height, function (x, y, idx) {
            // 左右/上下の端の矩形カット
            if (x < width * edgeLR || x > width * (1 - edgeLR) ||
                y < height * edgeTop || y > height * (1 - edgeBottom)) {
                this.bitmap.data[idx + 3] = 0;
            }

            // 四隅を消すための円形カット
            const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
            // ドラムは特に中心寄りに、サックスも端を削る
            let radiusMultiplier = 0.88;
            if (fileName === 'drums.png') radiusMultiplier = 0.82;
            if (fileName === 'saxophone.png') radiusMultiplier = 0.85;

            if (dist > maxRadius * radiusMultiplier) {
                this.bitmap.data[idx + 3] = 0;
            }
        });
    }

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
