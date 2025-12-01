const fs = require('fs');
const path = require('path');

const sourceImage = 'new-icon.png';
const buildIconPath = path.join(__dirname, 'build', 'icon.ico');
const publicFaviconPath = path.join(__dirname, 'public', 'favicon.ico');
const buildPngPath = path.join(__dirname, 'build', 'icon.png');

console.log('Copying icons (fallback)...');

try {
    fs.copyFileSync(sourceImage, buildIconPath);
    console.log(`Updated: ${buildIconPath}`);

    fs.copyFileSync(sourceImage, publicFaviconPath);
    console.log(`Updated: ${publicFaviconPath}`);

    fs.copyFileSync(sourceImage, buildPngPath);
    console.log(`Updated: ${buildPngPath}`);
} catch (err) {
    console.error('Error copying icons:', err);
    process.exit(1);
}
