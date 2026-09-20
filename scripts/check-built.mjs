// Guards the invariants that only exist in the *built* output, where two
// silent failures have already shipped. Neither threw anything a build or a
// test could see: the page rendered, the console carried the reason, and the
// feature was simply gone.
//
// 1. Minified CSS keeps only the last of `backdrop-filter` /
//    `-webkit-backdrop-filter`, and Chrome has dropped the -webkit- alias, so
//    shipping the prefixed form alone removes every blur on the site. Source
//    order is the fix; see the note in global.css.
//
// 2. Pagefind compiles a WebAssembly module to run search in the browser. A
//    CSP without 'wasm-unsafe-eval' refuses that compile and /search hangs on
//    "Searching for ..." forever. See the note in public/_headers.
//
// ponytail: two greps over the emitted output, run after the full build. New
// checks go here rather than into a framework.
import { readdir, readFile } from 'node:fs/promises';

const fail = (msg) => { console.error(`check-built: ${msg}`); process.exitCode = 1; };

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
  fail(
    `${prefixedOnly} -webkit-backdrop-filter declaration(s) survived minification with ` +
      `no unprefixed twin. Chrome ignores the prefixed form, so the blur is dead. In ` +
      `global.css write -webkit-backdrop-filter FIRST and backdrop-filter second.`
  );
} else {
  console.log(`check-built: ${standard} backdrop-filter declaration(s), all unprefixed`);
}

// Pagefind ships its WASM base64-inlined in pagefind.js, so there is no .wasm
// file to look for — the presence of the search bundle is what says the site
// needs a CSP that permits WebAssembly compilation.
const searchShips = await readFile('dist/pagefind/pagefind.js', 'utf8').then(() => true, () => false);
const headers = await readFile('dist/_headers', 'utf8').catch(() => '');
const csp = headers.match(/^\s*Content-Security-Policy:.*$/m)?.[0] ?? '';

if (searchShips && csp && !csp.includes("'wasm-unsafe-eval'")) {
  fail(
    `dist/pagefind/pagefind.js ships but the CSP has no 'wasm-unsafe-eval'. The browser ` +
      `will refuse to compile Pagefind's WebAssembly and /search will hang on ` +
      `"Searching for ..." with the reason only in the console. Add the token to ` +
      `script-src in public/_headers.`
  );
} else if (searchShips) {
  console.log(`check-built: search ships and the CSP permits its WebAssembly`);
}

if (process.exitCode) process.exit(1);
