/* set-domain.mjs — point the whole site at a different domain in one go.

   The pages carry absolute URLs in their canonical tags, Open Graph tags,
   structured data, robots.txt and sitemap.xml, because search engines want
   them absolute. That means moving to a real domain would otherwise be a
   find-and-replace across a dozen files. This does it for you:

       npm run set-domain endeansbarbers.co.uk

   Run it, check the diff, commit, push. Then re-verify the site in Google
   Search Console under the new address. */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const input = process.argv[2];
if (!input) {
  console.error('Usage: npm run set-domain <domain>');
  console.error('   eg: npm run set-domain endeansbarbers.co.uk');
  process.exit(1);
}

/* Accept "example.com", "www.example.com" or a full https:// URL. */
const next = 'https://' + input.replace(/^https?:\/\//, '').replace(/\/+$/, '');

/* Whatever the files currently point at. Read it out of the home page so this
   script keeps working however many times the domain changes. */
const home = await readFile('public/index.html', 'utf8');
const found = home.match(/<link rel="canonical" href="(https:\/\/[^"/]+)\/?"/);
if (!found) {
  console.error('Could not find the canonical tag in public/index.html — has it been edited?');
  process.exit(1);
}
const current = found[1];

if (current === next) {
  console.log(`Already set to ${next} — nothing to do.`);
  process.exit(0);
}

const EXTENSIONS = new Set(['.html', '.xml', '.txt', '.webmanifest']);

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (EXTENSIONS.has(extname(entry.name))) yield path;
  }
}

let changed = 0;
for await (const path of walk('public')) {
  const before = await readFile(path, 'utf8');
  const after = before.split(current).join(next);
  if (after !== before) {
    await writeFile(path, after);
    changed++;
    console.log('updated', path);
  }
}

console.log(`\n${current}  ->  ${next}`);
console.log(`${changed} file${changed === 1 ? '' : 's'} changed.`);
console.log('\nNext: commit and push, then add the new domain in the Cloudflare');
console.log('dashboard (Workers & Pages > endeans > Custom domains)');
console.log('and re-verify it in Google Search Console.');
