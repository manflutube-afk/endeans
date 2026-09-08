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

/* The barber pole that stands beside the logo on the home page.

   The source photograph sits on a black studio background, which would show
   as a black rectangle on a white page. Rather than key out every dark pixel
   — which would eat the black bands in the chrome caps as well — the
   background is found by flooding inwards from the edges of the image and
   keeping only pixels that are genuinely dark. The pole's own dark areas are
   enclosed by bright chrome, so the flood never reaches them.

   Measured on the source, the glow around the pole peaks near luminance 100
   while the pole's outer edge starts above 200, so 150 sits in the gap. */
async function cutOutBackground(src, threshold = 150) {
  const { data, info } = await sharp(src).ensureAlpha().raw()
    .toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;

  const lum = new Uint8Array(W * H);
  for (let i = 0, p = 0; p < W * H; p++, i += C) {
    lum[p] = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) | 0;
  }

  const isBackground = new Uint8Array(W * H);
  const queue = [];
  for (let x = 0; x < W; x++) queue.push(x, x + (H - 1) * W);
  for (let y = 0; y < H; y++) queue.push(y * W, W - 1 + y * W);
  while (queue.length) {
    const p = queue.pop();
    if (isBackground[p] || lum[p] >= threshold) continue;
    isBackground[p] = 1;
    const x = p % W, y = (p / W) | 0;
    if (x > 0) queue.push(p - 1);
    if (x < W - 1) queue.push(p + 1);
    if (y > 0) queue.push(p - W);
    if (y < H - 1) queue.push(p + W);
  }

  const alpha = Buffer.alloc(W * H);
  for (let p = 0; p < W * H; p++) alpha[p] = isBackground[p] ? 0 : 255;

  /* A touch of blur on the mask keeps the cut edge from looking stepped. */
  const mask = await sharp(alpha, { raw: { width: W, height: H, channels: 1 } })
    .blur(1.2).toBuffer();

  return sharp(src).ensureAlpha()
    .joinChannel(mask, { raw: { width: W, height: H, channels: 1 } })
    .png().toBuffer();
}

const poleCut = await sharp(await cutOutBackground('source-images/pole.png'))
  .trim().png().toBuffer();
for (const h of [260, 520]) {
  const file = `${OUT}/pole-${h}.webp`;
  await sharp(poleCut).resize({ height: h }).webp({ quality: 88 }).toFile(file);
  const m = await sharp(file).metadata();
  console.log('pole   ', file, `${m.width}x${m.height}`);
}

/* Social preview cards — what Facebook, WhatsApp and X show when the link is
   shared. Composed here rather than cropped from a photograph, so the card
   carries the shop's own logo and the barber pole that stands beside it on the
   home page, on the site's white background.

   The wording is drawn as part of the artwork rather than set in Archivo,
   because that font is a web font and is not installed on the machine that
   runs this build. The logo already carries the shop name, so the text below
   it is only a strapline. */
async function socialCard(width, height) {
  const poleH = Math.round(height * (height === width ? 0.42 : 0.60));
  const pole = await sharp(poleCut).resize({ height: poleH }).png().toBuffer();
  const poleW = (await sharp(pole).metadata()).width;

  const logoW = Math.round(poleH * 1.15);
  const logo = await sharp('source-images/logo-dark.webp')
    .resize({ width: logoW }).png().toBuffer();
  const logoH = (await sharp(logo).metadata()).height;

  const gap = Math.round(width * 0.045);
  const lockupW = logoW + gap + poleW;
  const lockupX = Math.round((width - lockupW) / 2);

  /* The lockup and the two lines of text are treated as one block and centred
     vertically, so the square card does not end up bottom-heavy. */
  const lockupH = Math.max(poleH, logoH);
  const titleSize = Math.round(width * 0.038);
  const subSize = Math.round(width * 0.026);
  const textGap = Math.round(height * 0.075);
  const textBlockH = titleSize + Math.round(subSize * 1.9);
  const blockH = lockupH + textGap + textBlockH;
  const lockupTop = Math.round((height - blockH) / 2);

  /* A soft red wash in two corners, echoing the blobs used on the pages. */
  const background = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs>
      <radialGradient id="a" cx="8%" cy="6%" r="62%">
        <stop offset="0%" stop-color="#dc0303" stop-opacity="0.16"/>
        <stop offset="100%" stop-color="#dc0303" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="b" cx="94%" cy="96%" r="58%">
        <stop offset="0%" stop-color="#ff7878" stop-opacity="0.20"/>
        <stop offset="100%" stop-color="#ff7878" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="#ffffff"/>
    <rect width="${width}" height="${height}" fill="url(#a)"/>
    <rect width="${width}" height="${height}" fill="url(#b)"/>
    <rect x="0" y="${height - Math.round(height * 0.014)}" width="${width}"
          height="${Math.round(height * 0.014)}" fill="#dc0303"/>
  </svg>`);

  const textTop = lockupTop + lockupH + textGap + titleSize;
  const text = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <text x="${width / 2}" y="${textTop}" text-anchor="middle"
          font-family="Archivo, Segoe UI, Helvetica, Arial, sans-serif"
          font-size="${titleSize}" font-weight="700" fill="#3d0b0b"
          letter-spacing="-0.5">Traditional &amp; Modern Gentlemen's Hairdressing</text>
    <text x="${width / 2}" y="${textTop + Math.round(subSize * 1.9)}" text-anchor="middle"
          font-family="Karla, Segoe UI, Helvetica, Arial, sans-serif"
          font-size="${subSize}" fill="#8c4a4a"
          letter-spacing="1.5">10a HARBOUR ROAD, PAR, CORNWALL &#183; 01726 983 678</text>
  </svg>`);

  return sharp(background)
    .composite([
      { input: logo, left: lockupX, top: lockupTop + Math.round((Math.max(poleH, logoH) - logoH) / 2) },
      { input: pole, left: lockupX + logoW + gap, top: lockupTop },
      { input: text, left: 0, top: 0 },
    ])
    .jpeg({ quality: 88, mozjpeg: true });
}

await (await socialCard(1200, 630)).toFile(`${OUT}/og-image.jpg`);
await (await socialCard(1200, 1200)).toFile(`${OUT}/og-image-square.jpg`);
console.log('social ', `${OUT}/og-image.jpg`, `${OUT}/og-image-square.jpg`);

/* A plain photograph of the shop front, for the structured data. The social
   cards above are branding rather than a picture of the place, and Google asks
   for an actual photo of the business in a LocalBusiness image field. */
await sharp('source-images/1.jpg').resize({ width: 1200 })
  .jpeg({ quality: 80, mozjpeg: true }).toFile(`${OUT}/photo-shopfront-1200.jpg`);
console.log('photo  ', `${OUT}/photo-shopfront-1200.jpg`);

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
