/**
 * Content checks the Astro build cannot do.
 *
 * The content schema enforces that every entry HAS sources. It cannot check
 * that the `{{n}}` citation markers in the prose point at a source that exists,
 * or that the /events/... links in a body resolve to an entry. Both fail
 * silently: a dangling `{{7}}` renders as a superscript link to nothing, and a
 * link to a deleted entry renders as a normal link that 404s.
 *
 * Run: node scripts/check-content.mjs   (also runs as part of `npm test`)
 *
 * Note the limit of the citation check: it verifies the number is IN RANGE, not
 * that it points at the source the sentence means. Inserting a source into the
 * middle of a list renumbers everything after it and this will not notice — so
 * append new sources at the END of the list, or re-read the body.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'src/content';
// URL segment -> collection directory. Only routes that resolve to an entry.
const ROUTES = {
  events: 'events', people: 'people', places: 'places', glossary: 'glossary',
  faith: 'faith', culture: 'culture', nitnem: 'nitnem', paths: 'paths',
  history: 'eras',
};

const ids = Object.fromEntries(
  Object.entries(ROUTES).map(([seg, dir]) => [
    seg,
    new Set(readdirSync(join(ROOT, dir)).map((f) => f.replace(/\.mdx?$/, ''))),
  ])
);

const files = [];
for (const dir of new Set(Object.values(ROUTES)).add('works')) {
  for (const f of readdirSync(join(ROOT, dir))) {
    if (/\.mdx?$/.test(f)) files.push(join(ROOT, dir, f));
  }
}

const problems = [];

for (const file of files) {
  const raw = readFileSync(file, 'utf8');
  const parts = raw.split('\n---');
  if (parts.length < 2) continue;
  const frontmatter = parts[0];
  const body = parts.slice(1).join('\n---');

  // 1. Citation markers must land inside the source list.
  const sourceCount = (frontmatter.match(/^ {2}- title:/gm) ?? []).length;
  const cited = new Set();
  for (const m of body.matchAll(/\{\{([\d,\s]+)\}\}/g)) {
    for (const n of m[1].split(',')) {
      const i = Number(n.trim());
      if (i) cited.add(i);
    }
  }
  for (const i of [...cited].sort((a, b) => a - b)) {
    if (i < 1 || i > sourceCount) {
      problems.push(`${file}: citation {{${i}}} but the entry lists ${sourceCount} source(s)`);
    }
  }

  // 2. Internal links must resolve to an entry that exists.
  for (const m of body.matchAll(/\]\(\/([a-z]+)\/([a-z0-9-]+)\)/g)) {
    const [, seg, slug] = m;
    if (ids[seg] && !ids[seg].has(slug)) {
      problems.push(`${file}: link /${seg}/${slug} does not resolve to an entry`);
    }
  }
}

if (problems.length) {
  console.error(`\ncheck-content: ${problems.length} problem(s)\n`);
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log(`check-content: ${files.length} entries, citations and internal links all resolve`);
