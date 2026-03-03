const Jimp = require('jimp');

async function createIcon(size, filename) {
    new Jimp(size, size, '#1e293b', (err, image) => {
        if (err) throw err;
        image.write(filename);
        console.log(`Successfully generated ${filename}`);
    });
}

createIcon(192, "./public/icon-192.png");
createIcon(512, "./public/icon-512.png");
