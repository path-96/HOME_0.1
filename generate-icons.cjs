const fs = require('fs');
const pngToIco = require('png-to-ico');
const path = require('path');

const sourceImage = 'new-icon.png';
const buildIconPath = path.join(__dirname, 'build', 'icon.ico');
const publicFaviconPath = path.join(__dirname, 'public', 'favicon.ico');
const buildPngPath = path.join(__dirname, 'build', 'icon.png');

console.log('Generating icons...');

pngToIco(sourceImage)
    .then(buf => {
        fs.writeFileSync(buildIconPath, buf);
        console.log(`Updated: ${buildIconPath}`);
        fs.writeFileSync(publicFaviconPath, buf);
        console.log(`Updated: ${publicFaviconPath}`);
    })
    .catch(err => {
        console.error('Error converting to ICO:', err);
        process.exit(1);
    });

// Also copy the PNG to build/icon.png
fs.copyFileSync(sourceImage, buildPngPath);
console.log(`Updated: ${buildPngPath}`);
