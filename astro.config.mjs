// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { existsSync, createReadStream } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Pagefind builds its index into dist/pagefind during `npm run build`, so in
// `npm run dev` the /pagefind/* assets don't exist and search 404s. This tiny
// middleware serves the *last built* index during dev — run `npm run build`
// once and search works locally from then on.
const pagefindDev = {
  name: 'pagefind-dev',
  apply: 'serve',
  configureServer(server) {
    const dist = fileURLToPath(new URL('./dist/pagefind', import.meta.url));
    const types = {
      '.js': 'text/javascript',
      '.mjs': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.wasm': 'application/wasm',
    };
    server.middlewares.use('/pagefind', (req, res, next) => {
      const path = (req.url || '').split('?')[0];
      const file = join(dist, path);
      if (!file.startsWith(dist) || !existsSync(file)) return next();
      res.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream');
      createReadStream(file).pipe(res);
    });
  },
};

// https://astro.build/config
export default defineConfig({
  // The public URL of the finished site. We build against the intended launch
  // domain (missionsikhism.org) so canonical/OG/sitemap URLs describe the real
  // site. The preview currently serves from a *.workers.dev host; if that is
  // still the canonical host at cutover, update this one line then.
  // See docs/07-ROADMAP.md (Phase 0).
  site: 'https://missionsikhism.org',
  integrations: [mdx(), sitemap()],
  vite: { plugins: [pagefindDev] },
});
