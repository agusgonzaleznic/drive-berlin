// Data-integrity tests: the content is generated, so these guard the seams
// between data files and code, where a typo fails silently in the browser.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const D = new URL('../src/data/', import.meta.url).pathname;

// Parse errors are reported with the file name and a pointer at the offending
// text. Without this, one bad byte anywhere in the content threw during module
// load, which aborts the whole file before a single test runs and prints a bare
// "Bad control character in string literal" with no filename. That happened for
// real: a prose edit put a literal newline inside a string, which JSON forbids,
// and the suite went from 81 passing to 66 with one opaque failure.
const J = f => {
  const raw = readFileSync(D + f, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (e) {
    const at = Number(/position (\d+)/.exec(e.message)?.[1] ?? -1);
    const near = at >= 0
      ? `\n  near: ...${JSON.stringify(raw.slice(Math.max(0, at - 70), at + 30))}`
      : '';
    throw new Error(
      `${f} is not valid JSON: ${e.message}${near}\n` +
      '  A literal newline or tab inside a JSON string is illegal. Use \\n, ' +
      'or keep the text on one line.');
  }
};

const manifest = J('modules/index.json');
const modules = manifest.map(f => J('modules/' + f));
const journey = J('journey.json');
const locations = J('locations.json');
const glossary = J('glossary.json');
const phrases = J('phrases.json');
const rules = J('rules.json');
const allTasks = Object.values(journey.paths).flatMap(p => p.flatMap(ph => ph.tasks || []));

test('module manifest matches the files on disk', () => {
  const onDisk = readdirSync(D + 'modules').filter(f => /^m\d+.*\.json$/.test(f)).sort();
  assert.deepEqual([...manifest].sort(), onDisk, 'index.json must list exactly the module files present');
});

test('every module has the shape the app renders', () => {
  for (const m of modules) {
    assert.ok(m.id && m.title && m.german && m.icon, `${m.id}: missing header fields`);
    assert.ok(['grund', 'zusatz', 'bonus'].includes(m.category), `${m.id}: bad category ${m.category}`);
    assert.ok(m.lesson?.sections?.length >= 3, `${m.id}: too few lesson sections`);
    assert.ok(m.lesson.key_takeaways?.length >= 3, `${m.id}: missing takeaways`);
    for (const s of m.lesson.sections) assert.ok(s.heading && s.body, `${m.id}: section missing heading/body`);
  }
});

test('question ids are globally unique', () => {
  const ids = modules.flatMap(m => (m.questions || []).map(q => q.id));
  assert.equal(new Set(ids).size, ids.length, 'duplicate question ids would corrupt spaced-repetition state');
});

test('every question is answerable and scoreable', () => {
  for (const m of modules) {
    for (const q of m.questions || []) {
      assert.ok(q.text, `${q.id}: no text`);
      assert.ok([2, 3, 4, 5].includes(q.points), `${q.id}: points ${q.points} outside the official 2-5 range`);
      assert.ok(['grund', 'zusatz'].includes(q.pool), `${q.id}: bad pool ${q.pool}`);
      assert.ok(q.explanation, `${q.id}: no explanation — the teaching moment is the point`);
      if (q.type === 'number') {
        assert.equal(typeof q.answer_number, 'number', `${q.id}: numeric answer must be a number`);
      } else {
        assert.equal(q.options?.length, 3, `${q.id}: official format is exactly 3 options`);
        const correct = q.options.filter(o => o.correct).length;
        // 1-3 correct is all legitimate: the real catalogue does include questions
        // where every listed answer applies. Zero is the only impossible case.
        assert.ok(correct >= 1, `${q.id}: no correct option — unanswerable`);
        for (const o of q.options) assert.ok(o.text, `${q.id}: empty option text`);
      }
    }
  }
});

test('the answer-count mix stays discriminating', () => {
  const choice = modules.flatMap(m => m.questions || []).filter(q => q.type !== 'number');
  const allThree = choice.filter(q => q.options.filter(o => o.correct).length === 3);
  const multi = choice.filter(q => q.options.filter(o => o.correct).length > 1);
  // All-three-correct is valid but tests little, so it should stay a rarity.
  assert.ok(allThree.length / choice.length < 0.1,
    `${allThree.length}/${choice.length} questions have every option correct — too many to discriminate`);
  // Conversely, multi-correct must be common: it is the real exam's main difficulty.
  assert.ok(multi.length / choice.length > 0.25,
    `only ${multi.length}/${choice.length} are multi-correct — the real exam leans on these`);
});

test('the bank can fill a full 30-question exam with the official split', () => {
  const qs = modules.flatMap(m => m.questions || []);
  assert.ok(qs.filter(q => q.pool === 'grund').length >= 20, 'need 20+ Grundstoff questions');
  assert.ok(qs.filter(q => q.pool === 'zusatz').length >= 10, 'need 10+ Zusatzstoff questions');
  assert.ok(qs.filter(q => q.points === 5).length >= 2, 'need 5-pointers to exercise the two-fives fail rule');
});

test('every referenced traffic sign exists in the SVG library', () => {
  const src = readFileSync(new URL('../src/js/signs.js', import.meta.url).pathname, 'utf8');
  const body = src.split('export const SIGNS = {')[1].split('\nexport function')[0];
  const defined = new Set([...body.matchAll(/^ {2}([a-z0-9_]+):\s*\{/gm)].map(m => m[1]));
  assert.ok(defined.size > 20, 'sign library failed to parse');
  const used = new Set();
  for (const m of modules) {
    for (const s of m.lesson.sections) (s.sign_ids || []).forEach(i => used.add(i));
    for (const q of m.questions || []) if (q.sign) used.add(q.sign);
  }
  const missing = [...used].filter(i => !defined.has(i));
  assert.deepEqual(missing, [], 'these sign ids would render as blank figures');
});

test('journey task ids are unique and every task is renderable', () => {
  const ids = allTasks.map(t => t.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate task ids collide in saved progress');
  for (const t of allTasks) {
    assert.ok(t.title && t.summary, `${t.id}: needs a title and summary`);
    assert.ok(typeof t.xp === 'number' && t.xp > 0, `${t.id}: needs positive XP`);
    assert.ok(Array.isArray(t.steps) && t.steps.length, `${t.id}: needs actionable steps`);
  }
});

test('journey badge ids all exist, so no badge is unwinnable', async () => {
  // award() returns false for an unknown id, which would fail silently in the UI.
  const src = readFileSync(new URL('../src/js/state.js', import.meta.url).pathname, 'utf8');
  const known = new Set([...src.matchAll(/\{\s*id:\s*'([a-z0-9-]+)'/g)].map(m => m[1]));
  assert.ok(known.size > 10, 'badge list failed to parse');
  const referenced = allTasks.flatMap(t => [t.badge, ...(t.badges || [])]).filter(Boolean);
  assert.ok(referenced.length >= 5, 'the journey should award several badges');
  assert.deepEqual(referenced.filter(b => !known.has(b)), [], 'these badges can never be awarded');
});

test('every defined badge is reachable — no permanently grey squares', () => {
  // Four badges were once unwinnable: nothing awarded them and no task referenced
  // them, so 21% of the collection could never be earned.
  const stateSrc = readFileSync(new URL('../src/js/state.js', import.meta.url).pathname, 'utf8');
  const defined = [...stateSrc.matchAll(/\{\s*id:\s*'([a-z0-9-]+)'/g)].map(m => m[1]);
  const reachable = new Set(allTasks.flatMap(t => [t.badge, ...(t.badges || [])]).filter(Boolean));
  for (const m of stateSrc.matchAll(/award\('([a-z0-9-]+)'\)/g)) reachable.add(m[1]);
  const viewsDir = new URL('../src/js/views/', import.meta.url).pathname;
  for (const f of readdirSync(viewsDir)) {
    const src = readFileSync(viewsDir + f, 'utf8');
    for (const m of src.matchAll(/award\(['"]([a-z0-9-]+)/g)) reachable.add(m[1]);
  }
  assert.deepEqual(defined.filter(b => !reachable.has(b)), [],
    'these badges have no award() call and no task granting them');
});

test('journey location_types all resolve to a map style', () => {
  const src = readFileSync(new URL('../src/js/map.js', import.meta.url).pathname, 'utf8');
  const styled = new Set([...src.matchAll(/^ {2}'([a-z-]+)':\s*\{ color/gm)].map(m => m[1]));
  const used = new Set(allTasks.flatMap(t => t.location_types || []));
  assert.ok(used.size >= 3, 'tasks should point at real-world places');
  assert.deepEqual([...used].filter(t => !styled.has(t)), [], 'unstyled location types render as grey blobs');
});

test('every location has coordinates the map can plot', () => {
  const src = readFileSync(new URL('../src/js/map.js', import.meta.url).pathname, 'utf8');
  const styled = new Set([...src.matchAll(/^ {2}'([a-z-]+)':\s*\{ color/gm)].map(m => m[1]));
  for (const l of locations) {
    assert.ok(l.name && l.address, `location missing name/address: ${JSON.stringify(l).slice(0, 60)}`);
    assert.ok(styled.has(l.type), `${l.name}: unknown type "${l.type}"`);
    // Berlin bounding box — catches swapped lat/lng, a mistake that silently
    // scatters pins into the North Sea.
    assert.ok(l.lat > 52.3 && l.lat < 52.7, `${l.name}: lat ${l.lat} outside Berlin`);
    assert.ok(l.lng > 13.0 && l.lng < 13.8, `${l.name}: lng ${l.lng} outside Berlin`);
  }
});

test('the legal rules the countdown depends on are present and sane', () => {
  assert.equal(rules.non_eu.recognition_months, 6, 'FeV § 29 Abs. 1 Satz 4');
  assert.ok(rules.non_eu.legal_basis.includes('§ 29'), 'the clock must cite its legal basis in the UI');
  assert.equal(rules.non_eu.conversion_deadline_months, null,
    'there is NO application deadline — a number here would invent the debunked three-year rule');
  assert.equal(rules.exam.max_error_points, 10);
  assert.equal(rules.exam.fail_on_two_five_point_wrong, true);
  for (const lang of ['English', 'Spanish', 'Italian']) {
    assert.ok(rules.exam.languages.includes(lang), `${lang} must be listed as an exam language`);
  }
});

test('reference content is populated', () => {
  assert.ok(glossary.length >= 50, `glossary has only ${glossary.length} entries`);
  for (const g of glossary) assert.ok(g.de && g.en, `glossary entry missing de/en: ${JSON.stringify(g)}`);
  const items = phrases.flatMap(g => g.items || []);
  assert.ok(items.length >= 25, `only ${items.length} examiner phrases`);
  for (const i of items) assert.ok(i.de && i.en, `phrase missing de/en: ${JSON.stringify(i)}`);
});

test('all three journey paths exist so no onboarding choice dead-ends', () => {
  for (const p of ['convert', 'eu', 'new']) {
    assert.ok(journey.paths[p]?.length, `path "${p}" has no phases`);
    assert.ok(journey.paths[p].every(ph => ph.title && ph.tasks?.length), `path "${p}" has an empty phase`);
  }
});
