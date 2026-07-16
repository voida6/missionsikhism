// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // The public URL of the finished site. We build against the intended launch
  // domain (missionsikhism.org) so canonical/OG/sitemap URLs describe the real
  // site. The preview currently serves from a *.workers.dev host; if that is
  // still the canonical host at cutover, update this one line then.
  // See docs/07-ROADMAP.md (Phase 0).
  site: 'https://missionsikhism.org',
  integrations: [mdx(), sitemap()],
});
