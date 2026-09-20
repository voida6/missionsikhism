// Guards one invariant of the *built* CSS, which is where this bug lived: the
// minifier folds `backdrop-filter` and `-webkit-backdrop-filter` into whichever
// is written last, and Chrome has dropped the -webkit- alias. Shipping only the
// prefixed form silently removes every blur on the site — nothing errors, the
// header just stops frosting and the era ribbon scrolls through it in hard
// colour bands. Source order is the fix (see the note in global.css); this makes
// a regression fail the build instead of reaching readers.
//
// ponytail: one grep over the emitted CSS, run after `astro build`. If the
// output ever needs broader checking, this is where a real CSS assertion goes.
import { readdir, readFile } from 'node:fs/promises';

const dir = 'dist/_astro';
const files = (await readdir(dir)).filter((f) => f.endsWith('.css'));
let prefixedOnly = 0;
let standard = 0;

for (const f of files) {
  const css = await readFile(`${dir}/${f}`, 'utf8');
  for (const m of css.matchAll(/(-webkit-)?backdrop-filter/g)) {
    if (m[1]) prefixedOnly++;
    else standard++;
  }
}

if (prefixedOnly > 0) {
  console.error(
    `check-built-css: ${prefixedOnly} -webkit-backdrop-filter declaration(s) survived ` +
      `minification with no unprefixed twin. Chrome ignores the prefixed form, so the ` +
      `blur is dead. In global.css write -webkit-backdrop-filter FIRST and ` +
      `backdrop-filter second.`
  );
  process.exit(1);
}

console.log(`check-built-css: ${standard} backdrop-filter declaration(s), all unprefixed`);
