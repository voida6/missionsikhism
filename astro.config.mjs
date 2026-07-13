// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  // The public URL of the finished site. Update to the custom domain at launch.
  site: 'https://missionsikhism.pages.dev',
  integrations: [mdx()],
});
