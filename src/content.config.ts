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
  // Phase A (additive): a soft link to a `works` bibliography entry. Kept as a
  // plain string for now; becomes reference('works') once that collection
  // exists (Phase I). Lets Library dedupe citations against canonical works.
  work: z.string().optional(),
});

/**
 * The core promise of the site: every fact is sourced.
 * `.min(1)` makes `sources` a REQUIRED, NON-EMPTY array. If any content
 * file omits it or leaves it empty, `astro build` fails. The guarantee is
 * enforced by the build, not by reviewer memory.
 */
const sources = z.array(source).min(1);

/**
 * Shared, optional image object (Phase A, additive; populated in Phase K).
 * `alt` is required *within* the object so any image that ships is described;
 * the whole object stays optional so nothing needs an image yet.
 */
const image = z.object({
  src: z.string(),
  alt: z.string(),
  credit: z.string().optional(),
  creditUrl: z.string().url().optional(),
});

// Six historical eras (1469 to today).
const eras = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/eras' }),
  schema: z.object({
    title: z.string(),
    order: z.number(), // controls timeline / nav ordering
    startYear: z.number(),
    endYear: z.number().optional(), // omit for the ongoing/current era
    summary: z.string(),
    // Phase A (additive):
    color: z.string().optional(), // era accent colour (e.g. "#b45309"); tightened in Phase D
    shortName: z.string().optional(), // compact label for chips/legends
    image: image.optional(),
    sources,
  }),
});

// Canonical locations (Phase C). One place, many events: dedupes coordinates,
// powers map clustering, and gives every location its own page.
const places = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/places' }),
  schema: z.object({
    name: z.string(),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    type: z.enum([
      'sacred-site', // gurdwara, takht, historic religious site
      'city', // settlement / urban centre
      'battlefield',
      'fort',
      'institution', // school, press, org HQ
      'region', // a broad area, not a point (use a representative centroid)
      'other',
    ]),
    region: z.string().optional(), // "Punjab, India"
    modernName: z.string().optional(), // if the historical name differs from today's
    aliases: z.array(z.string()).optional(), // alternate spellings for search
    summary: z.string(),
    image: image.optional(),
    sources,
  }),
});

// Individual historical events. These carry coordinates so the history
// pages AND the Global Map generate from the same files — one source of truth.
const events = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/events' }),
  schema: z
    .object({
      title: z.string(),
      year: z.number(),
      endYear: z.number().optional(), // Phase A: for events that span years
      date: z.string().optional(), // human-readable date if known, e.g. "15 April 1469"
      era: reference('eras'), // must match an existing era id
      // Phase C: `place` is now a reference to the places collection (the
      // preferred source of coordinates). lat/lng remain as a precise override
      // or fallback for a specific spot within a broader place.
      place: reference('places').optional(),
      lat: z.number().min(-90).max(90).optional(), // override / fallback for the map pin
      lng: z.number().min(-180).max(180).optional(),
      location: z.string().optional(), // human-readable place name (free display string)
      type: z
        .enum([
          'founding',
          'battle',
          'martyrdom',
          'institution',
          'treaty',
          'massacre',
          'migration',
          'reform',
          'publication',
          'life-event',
          'other',
        ])
        .optional(), // Phase A optional; tightened (required) in Phase D
      people: z.array(reference('people')).optional(),
      relatedEvents: z.array(reference('events')).optional(), // Phase A
      faith: z.array(reference('faith')).optional(), // Phase A: linked doctrine/topics
      image: image.optional(),
      summary: z.string(),
      sources,
    })
    // Locatability check (Phase A/C): an event must be placeable on the map by
    // EITHER a `place` reference OR explicit coordinates (lat AND lng). Every
    // current event carries lat/lng, so this passes with zero content edits.
    .refine(
      (d) =>
        d.place != null ||
        (typeof d.lat === 'number' && typeof d.lng === 'number'),
      {
        message:
          'An event must be locatable: reference a place, or provide both lat and lng.',
        path: ['place'],
      }
    ),
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
    // Phase A (additive):
    category: z
      .enum([
        'guru',
        'martyr',
        'general',
        'scholar',
        'reformer',
        'ruler',
        'saint',
        'modern-figure',
        'other',
      ])
      .optional(), // tightened (required) in Phase D
    sortName: z.string().optional(), // for alphabetical listing (e.g. "Nanak, Guru")
    honorific: z.string().optional(), // "Sri", "Ji", etc., kept out of the id/name
    relatedPeople: z.array(reference('people')).optional(), // e.g. Guru succession
    birthPlace: z.string().optional(),
    deathPlace: z.string().optional(),
    image: image.optional(),
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
    // Phase A (additive):
    tags: z.array(z.string()).optional(),
    image: image.optional(),
    sources,
  }),
});

export const collections = { eras, places, events, people, faith };
