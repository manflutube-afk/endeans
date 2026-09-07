/* Regenerates every image in public/assets/img from the originals in source-images.
   Run with: npm run images
   Source files are never modified; delete public/assets/img and re-run to rebuild. */
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';

const OUT = 'public/assets/img';
await mkdir(OUT, { recursive: true });

/* Each photo is emitted as WebP at two widths so pages can use srcset:
   the smaller one for grids and phones, the larger for the lightbox. */
const photos = [
  { src: 'source-images/1.jpg', name: 'shop-front',  widths: [700, 1200] },
  { src: 'source-images/5.jpg', name: 'darren',      widths: [600, 1100] },
  { src: 'source-images/2.jpg', name: 'accredited',  widths: [600, 1100] },
  { src: 'source-images/6.jpg', name: 'darren-stella', widths: [206] },
  { src: 'source-images/3.jpg', name: 'inside',      widths: [600, 1100] },
  { src: 'source-images/4.jpg', name: 'waiting',     widths: [600, 1100] },
];

for (const { src, name, widths } of photos) {
  for (const w of widths) {
    const file = `${OUT}/${name}-${w}.webp`;
    await sharp(src).resize({ width: w, withoutEnlargement: true })
      .webp({ quality: w > 800 ? 64 : 76, effort: 6 }).toFile(file);
    console.log('photo  ', file);
  }
}

/* The logo appears at 44px in the header and ~150px on the home page,
   so 2x of the largest use is plenty. */
for (const tone of ['light', 'dark']) {
  for (const w of [96, 320]) {
    const file = `${OUT}/logo-${tone}-${w}.webp`;
    await sharp(`source-images/logo-${tone}.webp`).resize({ width: w })
      .webp({ quality: 86 }).toFile(file);
    console.log('logo   ', file);
  }
}

/* Social preview cards. The landscape one is what Facebook and X read;
   the square one is used by the structured data. */
await sharp('source-images/1.jpg')
  .resize(1200, 630, { fit: 'cover', position: 'attention' })
  .jpeg({ quality: 76, mozjpeg: true }).toFile(`${OUT}/og-image.jpg`);
await sharp('source-images/1.jpg')
  .resize(1200, 1200, { fit: 'cover', position: 'attention' })
  .jpeg({ quality: 72, mozjpeg: true }).toFile(`${OUT}/og-image-square.jpg`);
console.log('social ', `${OUT}/og-image.jpg`, `${OUT}/og-image-square.jpg`);

/* Icons. favicon.ico stays as the hand-made file in public/. */
await sharp('source-images/apple-touch-icon.png').resize(180, 180)
  .png().toFile(`${OUT}/apple-touch-icon.png`);
await sharp('source-images/favicon-32.png').resize(32, 32)
  .png().toFile(`${OUT}/favicon-32.png`);
await sharp('source-images/favicon-32.png').resize(192, 192)
  .png().toFile(`${OUT}/icon-192.png`);
await sharp('source-images/apple-touch-icon.png').resize(512, 512)
  .png().toFile(`${OUT}/icon-512.png`);
console.log('icons  ', 'done');
