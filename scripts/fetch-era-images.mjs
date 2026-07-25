/**
 * Bring the era images in-house.
 *
 * The six era images are currently hotlinked to upload.wikimedia.org. That is
 * fine for a preview, but poor practice on a real domain: Wikimedia asks that
 * you not hotlink, can rate-limit or block it, and if they do the images
 * silently disappear from the site. This downloads each one into
 * public/images/eras/ and rewrites the era frontmatter to point at the local
 * copy. Credit and licence lines are left untouched.
 *
 * Run once, from the project root:  node scripts/fetch-era-images.mjs
 * Everything it does is a file change, so `git diff` shows it and `git
 * checkout .` undoes it.
 */

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, extname } from 'node:path';

const ERAS_DIR = 'src/content/eras';
const OUT_DIR = 'public/images/eras';

/**
 * Wikimedia serves full-resolution originals that can run to several MB, so we
 * prefer a thumbnail. Important caveat, learned the hard way: Wikimedia only
 * hands out thumbnail widths it has already rendered. Ask for an arbitrary size
 * like 1400px and you get a 404, even though the original is far wider — which
 * is exactly how six dead image URLs ended up in the era frontmatter. 1280px is
 * one of the standard pre-rendered widths and resolves reliably.
 *
 * Returns the candidates in order of preference so the caller can fall back to
 * the original if a thumbnail still isn't available.
 */
const THUMB_WIDTH = 1280;

function candidates(url) {
  if (url.includes('/thumb/')) return [url];
  const m = url.match(/^(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons)\/([0-9a-f])\/([0-9a-f]{2})\/(.+)$/);
  if (!m) return [url];
  const [, base, a, ab, name] = m;
  return [`${base}/thumb/${a}/${ab}/${name}/${THUMB_WIDTH}px-${name}`, url];
}

const kb = (n) => `${Math.round(n / 1024)} KB`;

const files = (await readdir(ERAS_DIR)).filter((f) => f.endsWith('.md'));
await mkdir(OUT_DIR, { recursive: true });

let changed = 0;
for (const file of files) {
  const id = file.replace(/\.md$/, '');
  const path = join(ERAS_DIR, file);
  const md = await readFile(path, 'utf8');

  const match = md.match(/^(\s*src:\s*)"(https:\/\/[^"]+)"/m);
  if (!match) {
    console.log(`· ${id} — already local, skipping`);
    continue;
  }

  // The frontmatter URL is the rendition we actually want — its width/height
  // are declared alongside it — so try that first and only fall back if it has
  // gone missing upstream.
  const tries = [match[2], ...candidates(match[2]).filter((u) => u !== match[2])];

  let res = null;
  let url = null;
  for (const candidate of tries) {
    const attempt = await fetch(candidate, {
      headers: {
        // Wikimedia rejects requests without a descriptive User-Agent.
        'User-Agent': 'MissionSikhism/1.0 (static site build; contact@missionsikhism.org)',
      },
    });
    if (attempt.ok) {
      res = attempt;
      url = candidate;
      break;
    }
    console.warn(`  ↩ ${id} — ${attempt.status} for ${candidate}`);
  }
  if (!res) {
    console.error(`✗ ${id} — every candidate URL failed; frontmatter left alone`);
    continue;
  }
  if (url !== match[2]) {
    console.warn(`  ! ${id} — fell back to a different rendition; recheck width/height in ${file}`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  const ext = extname(new URL(url).pathname).toLowerCase() || '.jpg';
  const name = `${id}${ext}`;
  await writeFile(join(OUT_DIR, name), buf);
  await writeFile(path, md.replace(match[0], `${match[1]}"/images/eras/${name}"`));

  console.log(`✓ ${id} → ${OUT_DIR}/${name}  (${kb(buf.length)})`);
  changed++;
}

console.log(
  changed
    ? `\n${changed} image(s) now served from this site. Check them in the browser, then commit public/images/eras/ along with the era files.`
    : '\nNothing to do — no remote image URLs left in the era frontmatter.'
);
