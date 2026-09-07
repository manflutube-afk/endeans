/* check-links.mjs — walks every page in public/ and makes sure each local
   href, src and srcset actually points at a file that exists. Catches the
   one mistake that is easy to make on a site of hand-written pages: a typo
   in a path that only shows up as a broken image in production.

       npm run check

   Exits non-zero if anything is missing, so it works in CI as well. */

import { readdir, readFile, stat } from 'node:fs/promises';
import { join, extname, posix } from 'node:path';

const ROOT = 'public';

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (extname(entry.name) === '.html') yield path;
  }
}

async function exists(urlPath) {
  /* A directory URL such as /services/ is served by its index.html. */
  const rel = urlPath.endsWith('/') ? posix.join(urlPath, 'index.html') : urlPath;
  try {
    const info = await stat(join(ROOT, rel));
    if (info.isDirectory()) {
      await stat(join(ROOT, rel, 'index.html'));
    }
    return true;
  } catch {
    return false;
  }
}

const problems = [];
let checked = 0;

for await (const page of walk(ROOT)) {
  const html = await readFile(page, 'utf8');
  const targets = new Set();

  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) targets.add(m[1]);
  /* srcset holds a comma-separated list of "url width" pairs. */
  for (const m of html.matchAll(/srcset="([^"]+)"/g)) {
    for (const part of m[1].split(',')) targets.add(part.trim().split(/\s+/)[0]);
  }
  for (const m of html.matchAll(/data-full="([^"]+)"/g)) targets.add(m[1]);

  for (const target of targets) {
    /* Only local absolute paths are ours to verify. */
    if (!target.startsWith('/')) continue;
    checked++;
    if (!(await exists(target))) problems.push(`${page}  ->  ${target}`);
  }
}

if (problems.length) {
  console.error(`\n${problems.length} broken local link${problems.length === 1 ? '' : 's'}:\n`);
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}

console.log(`All good — ${checked} local links checked, none broken.`);
