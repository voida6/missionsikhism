import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildQuestions, type QuizContent } from './quiz.ts';

// A fixture rather than the real collections: the invariants below have to hold
// for any content, and a test that reads src/content would start failing for
// reasons that have nothing to do with this code.
const content: QuizContent = {
  events: [
    { id: 'a', title: 'Event A', year: 1704, eraId: 'guru', eraTitle: 'Guru Period', placeName: 'Chamkaur' },
    { id: 'b', title: 'Event B', year: 1705, eraId: 'guru', eraTitle: 'Guru Period', placeName: 'Muktsar' },
    { id: 'c', title: 'Event C', year: 1799, eraId: 'empire', eraTitle: 'Sikh Empire', placeName: 'Lahore' },
    { id: 'd', title: 'Event D', year: 1849, eraId: 'modern', eraTitle: 'Modern Era', placeName: 'Multan' },
    { id: 'e', title: 'Event E', year: 1919, eraId: 'reform', eraTitle: 'Singh Sabha', placeName: 'Amritsar' },
  ],
  people: [
    { id: 'n', name: 'Guru Nanak', category: 'guru', role: 'First Sikh Guru', guruNumber: 1 },
    { id: 'an', name: 'Guru Angad', category: 'guru', role: 'Second Sikh Guru', guruNumber: 2 },
    { id: 'am', name: 'Guru Amar Das', category: 'guru', role: 'Third Sikh Guru', guruNumber: 3 },
    { id: 'rd', name: 'Guru Ram Das', category: 'guru', role: 'Fourth Sikh Guru', guruNumber: 4 },
    { id: 'mb', name: 'Mai Bhago', category: 'general', role: 'Warrior; commander at Khidrana' },
  ],
  terms: [
    { id: 'seva', term: 'Seva', definition: 'Selfless service. Performed without reward.' },
    { id: 'langar', term: 'Langar', definition: 'The free community kitchen. Open to all.' },
    { id: 'ardas', term: 'Ardas', definition: 'The formal congregational prayer. Said standing.' },
    { id: 'hukam', term: 'Hukam', definition: 'The divine order. Also a daily reading.' },
  ],
};

const questions = buildQuestions(content);

test('a question always offers three distinct wrong answers', () => {
  assert.ok(questions.length > 0, 'fixture produced no questions');
  for (const q of questions) {
    assert.equal(q.distractors.length, 3, `${q.id} has ${q.distractors.length} distractors`);
    assert.equal(new Set(q.distractors).size, 3, `${q.id} repeats a distractor`);
    assert.ok(!q.distractors.includes(q.answer), `${q.id} offers its own answer as a distractor`);
  }
});

test('the answer is never given away by the prompt', () => {
  for (const q of questions) {
    assert.ok(!q.prompt.includes(q.answer), `${q.id} states the answer in the prompt`);
  }
});

test('generation is deterministic, so the build output is stable', () => {
  assert.deepEqual(buildQuestions(content), questions);
});

test('ids are unique, so scores cannot collide', () => {
  assert.equal(new Set(questions.map((q) => q.id)).size, questions.length);
});

test('succession follows guruNumber, not birth order or file order', () => {
  const q = questions.find((x) => x.id === 'succession-an');
  assert.ok(q, 'no succession question for Guru Angad');
  assert.equal(q.answer, 'Guru Amar Das');
  assert.equal(q.href, '/people/am');
  // The question belongs to the entry it asks *about*, which is how a page
  // claims its own questions.
  assert.equal(q.topic, 'people:an');
});

test('a title that contains its own answer drops the question', () => {
  const giveaway = buildQuestions({
    ...content,
    events: content.events.concat({
      id: 'v1984',
      title: 'The Anti-Sikh Violence of November 1984',
      year: 1984,
      eraId: 'modern',
      eraTitle: 'Modern Era',
      placeName: 'Delhi',
    }),
  });
  assert.equal(
    giveaway.find((q) => q.id === 'year-v1984'),
    undefined,
    'asked for a year that the title already states'
  );
  // The other questions about that entry are unaffected.
  assert.ok(giveaway.find((q) => q.id === 'place-v1984'), 'dropped more than the giveaway');
});

test('a partial overlap with the answer counts as giving it away', () => {
  const near = buildQuestions({
    ...content,
    events: content.events.concat({
      id: 'chamkaur',
      title: 'The Battle of Chamkaur',
      year: 1704,
      eraId: 'guru',
      eraTitle: 'Guru Period',
      // Not a substring of the title, but the distinguishing word is.
      placeName: 'Chamkaur Sahib',
    }),
  });
  assert.equal(
    near.find((q) => q.id === 'place-chamkaur'),
    undefined,
    'asked where a battle named after the place happened'
  );
});

test('honorifics shared by the whole corpus do not count as a giveaway', () => {
  // "Which Guru succeeded Guru Angad?" overlaps its answer on `guru` alone.
  // Counting that would delete every succession question on the site.
  const q = questions.find((x) => x.id === 'succession-an');
  assert.ok(q, 'lost the succession question to a shared honorific');
  const role = questions.find((x) => x.id === 'role-an');
  assert.ok(role, 'lost the role question to a shared honorific');
  assert.equal(role.answer, 'Second Sikh Guru');
});

test('year distractors are the nearest years, not the whole span', () => {
  const q = questions.find((x) => x.id === 'year-c');
  assert.ok(q, 'no year question for Event C');
  assert.equal(q.answer, '1799');
  // 1704 and 1705 are the far end of the fixture; 1849 and 1919 are nearer.
  // With only four other years the pool is all of them, so assert the ordering
  // rule itself on a spread wide enough to exclude something.
  const wide = buildQuestions({
    events: [1700, 1750, 1800, 1801, 1802, 1803, 1804, 1805, 1806, 1900].map((year, i) => ({
      id: `y${i}`,
      title: `Event ${i}`,
      year,
      eraId: 'g',
      eraTitle: 'Guru Period',
    })),
    people: [],
    terms: [],
  });
  const far = wide.find((x) => x.id === 'year-y9'); // the 1900 entry
  assert.ok(far);
  assert.ok(!far.distractors.includes('1700'), 'offered the most distant year on the site');
});

test('era answers drop the "Era n" prefix the page headings carry', () => {
  const prefixed = buildQuestions({
    ...content,
    events: content.events.map((e) => ({ ...e, eraTitle: `Era 4 — ${e.eraTitle}` })),
  });
  const q = prefixed.find((x) => x.id === 'era-c');
  assert.ok(q);
  assert.equal(q.answer, 'Sikh Empire');
  assert.ok(
    !q.distractors.some((d) => d.includes('Era 4')),
    'left the numbering in, which gives the round away'
  );
});

test('a pool too thin to supply three wrong answers drops the question', () => {
  const thin = buildQuestions({
    events: [{ id: 'only', title: 'Only Event', year: 1469, eraId: 'g', eraTitle: 'Guru Period' }],
    people: [],
    terms: [],
  });
  assert.deepEqual(thin, [], 'shipped a question with nothing plausible to offer against it');
});

test('every question points at an entry that can explain it', () => {
  for (const q of questions) {
    assert.match(q.href, /^\/(events|people|glossary)\/[a-z0-9-]+$/, `${q.id} has href ${q.href}`);
    assert.match(q.topic, /^(events|people|glossary):[a-z0-9-]+$/, `${q.id} has topic ${q.topic}`);
  }
});
