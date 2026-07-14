import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * A single citation. This shape is reused by every collection.
 * `title` is the only strictly required field so that even an offline
 * primary source (a physical book, a manuscript) can be cited, but a
 * `url` is strongly encouraged for anything available online.
 */
const source = z.object({
  title: z.string(),
  author: z.string().optional(),
  publisher: z.string().optional(),
  year: z.number().optional(),
  url: z.string().url().optional(),
  page: z.string().optional(),
  note: z.string().optional(),
});

/**
 * The core promise of the site: every fact is sourced.
 * `.min(1)` makes `sources` a REQUIRED, NON-EMPTY array. If any content
 * file omits it or leaves it empty, `astro build` fails. The guarantee is
 * enforced by the build, not by reviewer memory.
 */
const sources = z.array(source).min(1);

// Six historical eras (1469 to today).
const eras = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/eras' }),
  schema: z.object({
    title: z.string(),
    order: z.number(), // controls timeline / nav ordering
    startYear: z.number(),
    endYear: z.number().optional(), // omit for the ongoing/current era
    summary: z.string(),
    sources,
  }),
});

// Individual historical events. These carry coordinates so the history
// pages AND the Global Map generate from the same files — one source of truth.
const events = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/events' }),
  schema: z.object({
    title: z.string(),
    year: z.number(),
    date: z.string().optional(), // human-readable date if known, e.g. "15 April 1469"
    era: reference('eras'), // must match an existing era id
    lat: z.number(), // required: drives the map pin
    lng: z.number(),
    location: z.string().optional(), // human-readable place name
    people: z.array(reference('people')).optional(),
    summary: z.string(),
    sources,
  }),
});

// People: Gurus, historical figures, scholars.
const people = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/people' }),
  schema: z.object({
    name: z.string(),
    born: z.number().optional(),
    died: z.number().optional(),
    role: z.string().optional(),
    summary: z.string(),
    sources,
  }),
});


// The Faith: evergreen topics (beliefs, practices, values). Non-chronological,
// so no year/era — but still sourced like everything else.
const faith = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/faith' }),
  schema: z.object({
    title: z.string(),
    order: z.number().default(100), // controls listing order on /faith
    summary: z.string(),
    sources,
  }),
});

export const collections = { eras, events, people, faith };
