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

/* The logo appears at 44px in the header and ~150px on the home page, so 2x of
   the largest use is plenty. The site is white throughout, so only the darker
   artwork is needed — there is no light-on-dark variant any more. */
for (const w of [96, 320]) {
  const file = `${OUT}/logo-${w}.webp`;
  await sharp('source-images/logo-dark.webp').resize({ width: w })
    .webp({ quality: 86 }).toFile(file);
  console.log('logo   ', file);
}

/* The barber pole that stands beside the logo on the home page. The original
   is a square canvas with a lot of empty space around the pole, so it is
   trimmed back to the artwork before resizing. */
const poleTrimmed = await sharp('source-images/pole.png').trim().toBuffer();
for (const h of [220, 440]) {
  const file = `${OUT}/pole-${h}.webp`;
  await sharp(poleTrimmed).resize({ height: h }).webp({ quality: 88 }).toFile(file);
  const m = await sharp(file).metadata();
  console.log('pole   ', file, `${m.width}x${m.height}`);
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

/* Icons, all from source-images/favicon.png. The artwork is dark on a
   transparent background, so it is flattened onto white — otherwise it would
   disappear against a dark browser tab or a dark phone home screen. */
const icon = (size) => sharp('source-images/favicon.png')
  .resize(size, size, { fit: 'contain', background: '#ffffff' })
  .flatten({ background: '#ffffff' })
  .png();

for (const [size, name] of [[32, 'favicon-32.png'], [180, 'apple-touch-icon.png'],
                            [192, 'icon-192.png'], [512, 'icon-512.png']]) {
  await icon(size).toFile(`${OUT}/${name}`);
  console.log('icon   ', `${OUT}/${name}`);
}

/* A real favicon.ico as well, because browsers and crawlers still request
   /favicon.ico by name. An .ico is just a small header followed by the image
   data, and PNG payloads are allowed, so the PNGs above are wrapped directly. */
const icoSizes = [16, 32, 48];
const icoImages = await Promise.all(icoSizes.map((s) => icon(s).toBuffer()));

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);                 // reserved
header.writeUInt16LE(1, 2);                 // 1 = icon
header.writeUInt16LE(icoSizes.length, 4);   // how many images follow

let offset = 6 + icoSizes.length * 16;
const entries = icoSizes.map((size, i) => {
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size === 256 ? 0 : size, 0);  // width  (0 means 256)
  entry.writeUInt8(size === 256 ? 0 : size, 1);  // height
  entry.writeUInt8(0, 2);                        // palette size, 0 for true colour
  entry.writeUInt8(0, 3);                        // reserved
  entry.writeUInt16LE(1, 4);                     // colour planes
  entry.writeUInt16LE(32, 6);                    // bits per pixel
  entry.writeUInt32LE(icoImages[i].length, 8);   // size of this image
  entry.writeUInt32LE(offset, 12);               // where it starts
  offset += icoImages[i].length;
  return entry;
});

await writeFile('public/favicon.ico', Buffer.concat([header, ...entries, ...icoImages]));
console.log('icon   ', 'public/favicon.ico', `(${icoSizes.join(', ')}px)`);
