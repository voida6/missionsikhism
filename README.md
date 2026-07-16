# Mission Sikhism

A non-profit, fully-sourced history of the Sikh faith (1469 to today), built as a
static site with [Astro](https://astro.build). Content lives as Markdown in Git —
no database, no CMS, nothing to hack.

## The core rule: every fact is sourced

Content is organised into content collections — `eras`, `places`, `events`,
`people`, `faith`, `culture`, `works`, `glossary`, and `nitnem` (see
`src/content.config.ts`). Every entry **must**
include a non-empty `sources` list. If a content file omits it, **the build
fails.** The site's "every fact sourced" promise is enforced by the build, not
by memory. Beyond `sources`, the build also enforces the controlled
vocabularies — every event needs a `type`, every person a `category`, and every
era a hex `color`, or the build fails.

## Content lives here

```
src/content/
  eras/     one file per historical era (title, order, colour, sources)
  places/   one file per location (coords, type, region, sources)
  events/   one file per event — links to a place, an era, people, a type
  people/   one file per person (grouped by category)
  faith/    one file per evergreen faith topic
  culture/  one file per culture & heritage topic
  works/    one file per canonical book/source (the bibliography)
  glossary/ one file per term (with Gurmukhi + transliteration)
  nitnem/   one file per daily prayer (bani)
```

Each event references a `place` for its coordinates (with an optional lat/lng
override for a precise spot), so the history pages, the place pages, and the
Global Map are all generated from the same files. Write the event once; its map
pin, place listing, and timeline entry all follow automatically.

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

Deployed via Cloudflare.
