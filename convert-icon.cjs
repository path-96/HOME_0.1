const fs = require('fs');
const path = require('path');
const toIco = require('to-ico');
const sharp = require('sharp');

const sourceImage = 'new-icon.png';
const buildIconPath = path.join(__dirname, 'build', 'icon.ico');
const publicFaviconPath = path.join(__dirname, 'public', 'favicon.ico');
const buildPngPath = path.join(__dirname, 'build', 'icon.png');

async function convert() {
    console.log('Processing image with Sharp...');
    try {
        // 1. Resize to 256x256 (standard max size for ICO) and get PNG buffer
        const pngBuffer = await sharp(sourceImage)
            .resize(256, 256)
            .png()
            .toBuffer();

        // 2. Save PNG first
        fs.writeFileSync(buildPngPath, pngBuffer);
        console.log(`Updated: ${buildPngPath}`);

        // 3. Convert to ICO using to-ico
        // to-ico expects an array of buffers
        const icoBuffer = await toIco([pngBuffer], {
            resize: true, // Create multiple sizes
            sizes: [256, 128, 64, 48, 32, 16] // Standard Windows sizes
        });

        // 4. Save ICO files
        fs.writeFileSync(buildIconPath, icoBuffer);
        console.log(`Updated: ${buildIconPath}`);

        fs.writeFileSync(publicFaviconPath, icoBuffer);
        console.log(`Updated: ${publicFaviconPath}`);

    } catch (err) {
        console.error('Error converting icon:', err);
        process.exit(1);
    }
}

convert();
