/**
 * The question bank, generated from the content that already exists.
 *
 * Nothing here is written by hand. Every question is a view over frontmatter
 * the build already enforces — an event's era, a place, a year, a glossary
 * definition, a Guru's succession number — so the bank grows on its own
 * whenever an entry is added, and it can never drift from the entries the way
 * a hand-maintained quiz would.
 *
 * Two properties are deliberate:
 *
 * 1. **Distractors come from the same pool as the answer.** The wrong options
 *    for "which era" are other eras, for "where" other places. They are always
 *    plausible and never nonsense, which is what makes a generated quiz worth
 *    taking. It also means a question is skipped rather than shipped weak when
 *    its pool cannot supply three distinct wrong answers.
 *
 * 2. **Generation is deterministic.** Same content in, same bank out, byte for
 *    byte. A build that shuffled would churn the output on every run and make
 *    the diff useless. The shuffling belongs in the browser, at the moment a
 *    question is shown, which is also the only place it matters — otherwise
 *    the answer would sit in the same slot for every visitor.
 *
 * ponytail: plain data in, plain data out, no astro imports, so this is
 * testable with `node --test` and reusable by both /quiz and the per-entry
 * block without either one owning it.
 */

export type Tier = 'easy' | 'medium' | 'hard';

export type Question = {
  id: string;
  tier: Tier;
  /** Shown as the question. May contain the entry title; never the answer. */
  prompt: string;
  answer: string;
  /** Exactly three, distinct from each other and from the answer. */
  distractors: string[];
  /** The entry this was generated from, so a wrong answer can be read up on. */
  href: string;
  /** `collection:id` of the source entry — how a page asks for its own questions. */
  topic: string;
};

export type QuizEvent = {
  id: string;
  title: string;
  year: number;
  eraId: string;
  eraTitle: string;
  placeName?: string;
};

export type QuizPerson = {
  id: string;
  name: string;
  category: string;
  role?: string;
  guruNumber?: number;
};

export type QuizTerm = {
  id: string;
  term: string;
  definition: string;
};

export type QuizContent = {
  events: QuizEvent[];
  people: QuizPerson[];
  terms: QuizTerm[];
};

/** FNV-1a. Small, stable across runs, and good enough to spread a pool. */
const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

/**
 * Three wrong answers from `pool`, excluding the answer and any duplicate of
 * it. Ordering is by hash of (seed + value) so the choice is stable but not
 * alphabetical — picking neighbours would make "which era" always offer the
 * two adjacent eras. Returns [] when the pool is too thin, and the caller
 * drops the question.
 */
const distractorsFrom = (pool: string[], answer: string, seed: string): string[] => {
  const unique = [...new Set(pool)].filter((v) => v !== answer && v.length > 0);
  if (unique.length < 3) return [];
  return unique
    .map((value) => ({ value, order: hash(seed + value) }))
    .sort((a, b) => a.order - b.order || a.value.localeCompare(b.value))
    .slice(0, 3)
    .map((x) => x.value);
};

/**
 * Era titles are written "Era 1 — The Guru Period", which is right for a page
 * heading and wrong for a quiz answer: four options all starting "Era n —"
 * make it a question about numbering rather than about history, and the
 * numbers are a running giveaway across a round. The name after the dash is
 * what a reader would actually say.
 */
const eraLabel = (title: string) => {
  const parts = title.split('—');
  return (parts.length > 1 ? parts[parts.length - 1] : title).trim();
};

/** First sentence, for prompts built from a definition or summary. */
const firstSentence = (text: string) => {
  const end = text.search(/[.?!]\s/);
  return end === -1 ? text : text.slice(0, end + 1);
};

/**
 * Prompts put the title first and the question after a dash. Entry titles are
 * written as titles, not as sentence fragments — "Founding of Amritsar" does
 * not slot into "In what year did ___ happen?" without reading badly — and
 * this form works for every one of them without editing a single title to suit
 * the quiz.
 */
export function buildQuestions(content: QuizContent): Question[] {
  const { events, people, terms } = content;
  const questions: Question[] = [];

  const add = (q: Omit<Question, 'distractors'> & { pool: string[] }) => {
    const { pool, ...rest } = q;
    // Entries are titled by their subject, so a prompt built from the title
    // routinely contains its own answer: "The Anti-Sikh Violence of November
    // 1984" asked for a year, "The Battle of Chamkaur" asked for a place.
    // Those are free points, not questions, and the only general fix is to
    // drop them — rewording the title would be editing history to suit a quiz.
    if (rest.prompt.toLowerCase().includes(rest.answer.toLowerCase())) return;
    const distractors = distractorsFrom(pool, rest.answer, rest.id);
    if (distractors.length === 3) questions.push({ ...rest, distractors });
  };

  const eraTitles = events.map((e) => eraLabel(e.eraTitle));
  const placeNames = events.map((e) => e.placeName ?? '');
  const allYears = events.map((e) => e.year);

  /**
   * The nearest other years on the site, not any three years at all. Offering
   * 1984 against 1604, 1606 and 1665 is a reading-comprehension question — the
   * one modern-looking number wins without knowing anything. Narrowing to the
   * closest handful first, then picking three of those, makes the question
   * about the date rather than about the spread.
   */
  const nearYears = (target: number) =>
    [...new Set(allYears)]
      .filter((y) => y !== target)
      .sort((a, b) => Math.abs(a - target) - Math.abs(b - target) || a - b)
      .slice(0, 8)
      .map(String);

  for (const e of events) {
    const href = `/events/${e.id}`;
    const topic = `events:${e.id}`;

    add({
      id: `era-${e.id}`,
      tier: 'easy',
      prompt: `${e.title} — which era?`,
      answer: eraLabel(e.eraTitle),
      pool: eraTitles,
      href,
      topic,
    });

    if (e.placeName) {
      add({
        id: `place-${e.id}`,
        tier: 'medium',
        prompt: `${e.title} — where did it happen?`,
        answer: e.placeName,
        pool: placeNames,
        href,
        topic,
      });
    }

    add({
      id: `year-${e.id}`,
      tier: 'hard',
      prompt: `${e.title} — in what year?`,
      answer: String(e.year),
      pool: nearYears(e.year),
      href,
      topic,
    });
  }

  const roles = people.map((p) => p.role ?? '');
  for (const p of people) {
    if (!p.role) continue;
    add({
      id: `role-${p.id}`,
      tier: 'medium',
      prompt: `Who was ${p.name}?`,
      answer: p.role,
      pool: roles,
      href: `/people/${p.id}`,
      topic: `people:${p.id}`,
    });
  }

  // Succession, which is the point of `guruNumber` existing: the order of
  // Guruship is not the order of birth, so this cannot be derived from dates.
  const gurus = people
    .filter((p): p is QuizPerson & { guruNumber: number } => typeof p.guruNumber === 'number')
    .sort((a, b) => a.guruNumber - b.guruNumber);
  const guruNames = gurus.map((g) => g.name);
  for (let i = 0; i < gurus.length - 1; i++) {
    const current = gurus[i];
    const next = gurus[i + 1];
    add({
      id: `succession-${current.id}`,
      tier: 'hard',
      prompt: `Which Guru succeeded ${current.name}?`,
      answer: next.name,
      pool: guruNames,
      href: `/people/${next.id}`,
      topic: `people:${current.id}`,
    });
  }

  // Definition first, term as the answer: four long definitions as options
  // would be a reading test rather than a recall one.
  const termNames = terms.map((t) => t.term);
  for (const t of terms) {
    add({
      id: `term-${t.id}`,
      tier: 'easy',
      prompt: `Which word means: ${firstSentence(t.definition)}`,
      answer: t.term,
      pool: termNames,
      href: `/glossary/${t.id}`,
      topic: `glossary:${t.id}`,
    });
  }

  return questions.sort((a, b) => a.id.localeCompare(b.id));
}
