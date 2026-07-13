# Mission Sikhism

A non-profit, fully-sourced history of the Sikh faith (1469 to today), built as a
static site with [Astro](https://astro.build). Content lives as Markdown in Git —
no database, no CMS, nothing to hack.

## The core rule: every fact is sourced

Content is organised into three collections — `eras`, `events`, and `people`
(see `src/content.config.ts`). Every entry **must** include a non-empty
`sources` list. If a content file omits it, **the build fails.** The site's
"every fact sourced" promise is enforced by the build, not by memory.

## Content lives here

```
src/content/
  eras/     one file per historical era
  events/   one file per event — each carries lat/lng for the map
  people/   one file per person
```

Events carry coordinates, so the history pages and the Global Map are generated
from the same files. Write the event once; the map pin appears automatically.

## Running locally

```bash
nvm use          # picks up Node from .nvmrc (22.12.0)
npm install
npm run dev      # http://localhost:4321
npm run build    # production build into dist/
npm run preview  # preview the built site
```

## Editing content (for non-developers)

You can edit any file under `src/content/` directly on github.com or with
GitHub Desktop — no coding needed. Just keep the `sources` list filled in, or
the site won't build.

## Deployment

Pushes to the `main` branch auto-deploy via Cloudflare Pages.

- Build command: `npm run build`
- Output directory: `dist`
- **Set `NODE_VERSION` = `22.12.0`** in the Pages project (Cloudflare's default
  Node is too old for current Astro). The `.nvmrc` in this repo covers it too.
