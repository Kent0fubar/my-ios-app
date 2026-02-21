const https = require('https');
const fs = require('fs');

const instruments = [
    { key: 'Guitar', query: 'guitar' },
    { key: 'Bass', query: 'bass-guitar' },
    { key: 'Drums', query: 'drum' },
    { key: 'Vocal', query: 'microphone' },
    { key: 'Keyboard', query: 'synthesizer' },
    { key: 'Piano', query: 'piano' },
    { key: 'Saxophone', query: 'saxophone' },
    { key: 'Trumpet', query: 'trumpet' },
    { key: 'Violin', query: 'violin' },
    { key: 'Dj', query: 'turntable' },
    { key: 'Producer', query: 'mixer' },
    { key: 'Songwriter', query: 'fountain-pen' }
];

async function searchIcon(query) {
    return new Promise((resolve, reject) => {
        let url = `https://api.iconify.design/search?query=${query}&limit=30`;
        https.get(url, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                let json = JSON.parse(data);
                // prefer sets like: ph, solar, mingcute, icon-park-outline, fluent, mdi, game-icons, stream-line
                const preferred = ['fluent', 'solar', 'ph', 'mingcute', 'icon-park-outline', 'game-icons', 'mdi', 'streamline', 'lucide', 'tabler'];
                if (json.icons && json.icons.length > 0) {
                    let best = json.icons.find(i => preferred.some(p => i.startsWith(p + ':')));
                    if (!best) best = json.icons[0];
                    resolve(best);
                } else {
                    resolve(null);
                }
            });
        }).on('error', reject);
    });
}

async function fetchIcon(id) {
    if (!id) return null;
    return new Promise((resolve, reject) => {
        let url = `https://api.iconify.design/${id.replace(':', '/')}.svg`;
        https.get(url, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (data.includes('<svg')) resolve({ id, data });
                else resolve(null);
            });
        }).on('error', reject);
    });
}

(async () => {
    let result = "import React from 'react';\nimport { SvgXml } from 'react-native-svg';\n\n";

    for (const inst of instruments) {
        let id = await searchIcon(inst.query);
        // Manual overrides for best results
        if (inst.key === 'Guitar') id = 'mdi:guitar-acoustic';
        if (inst.key === 'Bass') id = 'mdi:guitar-electric';
        if (inst.key === 'Drums') id = 'game-icons:drum-kit';
        if (inst.key === 'Vocal') id = 'mdi:microphone-variant';
        if (inst.key === 'Keyboard') id = 'mdi:piano';
        if (inst.key === 'Piano') id = 'game-icons:grand-piano';
        if (inst.key === 'Saxophone') id = 'mdi:saxophone';
        if (inst.key === 'Trumpet') id = 'mdi:trumpet';
        if (inst.key === 'Violin') id = 'mdi:violin';
        if (inst.key === 'Dj') id = 'mdi:album';
        if (inst.key === 'Producer') id = 'mdi:tune-vertical';
        if (inst.key === 'Songwriter') id = 'mdi:fountain-pen-tip';

        let svgRes = await fetchIcon(id);
        let svg = svgRes ? svgRes.data : `<svg width="24" height="24" viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2z" fill="currentColor"/></svg>`;

        // Convert static colors to 'currentColor' so the app theme can color them correctly
        svg = svg.replace(/fill="([^"]+)"/g, (match, p1) => {
            if (p1 === 'none') return match;
            return `fill="${'currentColor'}"`;
        });
        svg = svg.replace(/stroke="([^"]+)"/g, (match, p1) => {
            if (p1 === 'none') return match;
            return `stroke="${'currentColor'}"`;
        });
        // Make sure it has scalable width/height based on props
        svg = svg.replace(/width="[^"]+"/, 'width="${size}"');
        svg = svg.replace(/height="[^"]+"/, 'height="${size}"');

        // Remove hardcoded stroke-width if present, or leave it if it's solid.
        // Actually for simplicity, we just inject the SVG string and pass it to SvgXml.

        result += `export const ${inst.key}Icon = ({ size = 24, color = "currentColor" }) => {\n`;
        result += `  const xml = \`${svg}\`.replace(/currentColor/g, color);\n`;
        result += `  return <SvgXml xml={xml} width={size} height={size} />;\n`;
        result += `};\n\n`;
    }

    fs.writeFileSync('./src/components/CustomVectorIcons.tsx', result);
    console.log('Done generating realistic SVGs from MDI / GameIcons!');
})();
