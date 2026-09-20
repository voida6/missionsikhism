import { getCollection } from 'astro:content';
import { buildQuestions, type Question, type QuizContent } from './quiz';

/**
 * The bridge between the collections and the generator: reads the content once
 * per build and hands `src/quiz.ts` the plain objects it wants. Kept apart from
 * the generator so that stays free of astro imports and testable, and apart
 * from the pages so /quiz and 180 entry pages cannot drift in how they map the
 * same fields.
 */
let cache: Question[] | undefined;

export async function allQuestions(): Promise<Question[]> {
  if (cache) return cache;

  const [events, people, places, eras, terms] = await Promise.all([
    getCollection('events'),
    getCollection('people'),
    getCollection('places'),
    getCollection('eras'),
    getCollection('glossary'),
  ]);

  const eraById = new Map(eras.map((e) => [e.id, e.data]));
  const placeById = new Map(places.map((p) => [p.id, p.data]));

  const content: QuizContent = {
    events: events.map((e) => ({
      id: e.id,
      title: e.data.title,
      year: e.data.year,
      eraId: e.data.era.id,
      eraTitle: eraById.get(e.data.era.id)?.title ?? e.data.era.id,
      placeName: e.data.place ? placeById.get(e.data.place.id)?.name : undefined,
    })),
    people: people.map((p) => ({
      id: p.id,
      name: p.data.name,
      category: p.data.category,
      role: p.data.role,
      guruNumber: p.data.guruNumber,
    })),
    terms: terms.map((t) => ({
      id: t.id,
      term: t.data.term,
      definition: t.data.definition,
    })),
  };

  cache = buildQuestions(content);
  return cache;
}

/**
 * The questions an entry page should offer. Its own come first — someone who
 * has just read the entry should be asked about it — and the rest of the round
 * is filled from the topics it is already linked to, so a five-question block
 * is possible on an entry that only generated two questions of its own.
 */
export async function questionsFor(topics: string[], limit = 5): Promise<Question[]> {
  const all = await allQuestions();
  const rank = new Map(topics.map((t, i) => [t, i]));
  return all
    .filter((q) => rank.has(q.topic))
    .sort((a, b) => (rank.get(a.topic) ?? 0) - (rank.get(b.topic) ?? 0))
    .slice(0, limit);
}
