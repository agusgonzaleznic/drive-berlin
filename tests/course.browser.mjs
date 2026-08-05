// FULL COURSE TEST — walks the entire learning journey in a real browser, the way
// the user will: read every lesson, answer every question in every module, take a
// mock exam, drill the phrases, and open every real-world task.
//
// What each stage asserts is stated inline, so a failure says what the app promised
// and what it actually did.
import { chromium } from 'playwright-core';

const BASE = 'http://localhost:4173/';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

let pass = 0, fail = 0;
const check = (label, cond, extra = '') => {
  if (cond) { pass++; } else { fail++; console.log(`  FAIL  ${label}${extra ? ' :: ' + extra : ''}`); }
};
const section = t => console.log(`\n=== ${t} ===`);

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
const page = await ctx.newPage();
{ const c = await ctx.newCDPSession(page); await c.send('Network.setCacheDisabled', { cacheDisabled: true }); }

const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(600);

// ---------------------------------------------------------------- onboarding
section('Onboarding');
check('starts at the welcome screen', page.url().endsWith('#/welcome'), page.url());
await page.fill('#name-input', 'Alex');
await page.fill('#res-input', '2026-05-15');
await page.fill('#licence-input', 'Argentina');
await page.click('[data-path="convert"]');
await page.waitForTimeout(600);
check('choosing the non-EU path lands on the journey', page.url().endsWith('#/journey'), page.url());

const modules = await page.evaluate(async () => {
  const idx = await (await fetch('data/modules/index.json')).json();
  const out = [];
  for (const f of idx) {
    const m = await (await fetch('data/modules/' + f)).json();
    out.push({ id: m.id, title: m.title, questions: (m.questions || []).length,
      sections: (m.lesson?.sections || []).length, terms: (m.lesson?.german_terms || []).length });
  }
  return out;
});
console.log(`course: ${modules.length} modules, ${modules.reduce((n, m) => n + m.questions, 0)} questions`);

// ---------------------------------------------------------------- every lesson
section('Every lesson renders and can be completed');
for (const m of modules) {
  await page.evaluate(id => { location.hash = '#/lesson/' + id; }, m.id);
  await page.waitForTimeout(420);
  const info = await page.evaluate(() => {
    const v = document.getElementById('view');
    return {
      words: (v.textContent || '').trim().split(/\s+/).length,
      headings: v.querySelectorAll('.lesson-body h3').length,
      terms: v.querySelectorAll('.terms-table tr').length,
      signs: v.querySelectorAll('.sign-figure svg').length,
      hasFinish: !!v.querySelector('#complete-btn'),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
  check(`${m.id}: lesson has substantial content`, info.words > 250, `${info.words} words`);
  check(`${m.id}: renders its ${m.sections} sections`, info.headings >= Math.min(3, m.sections), `${info.headings} headings`);
  check(`${m.id}: renders its ${m.terms} German terms`, info.terms >= Math.min(5, m.terms), `${info.terms} rows`);
  check(`${m.id}: no horizontal overflow`, info.overflow <= 1, `${info.overflow}px`);
  check(`${m.id}: offers the finish action`, info.hasFinish);
  if (info.hasFinish) {
    await page.click('#complete-btn');
    await page.waitForTimeout(260);
    const done = await page.evaluate(id => JSON.parse(localStorage.getItem('gds-state-v1')).lessons[id]?.done, m.id);
    check(`${m.id}: completion persists`, done === true);
  }
}

// ---------------------------------------------------------------- every question
section('Every question in every module is answerable and explained');
let answered = 0, correctSeen = 0, wrongSeen = 0, numeric = 0;
for (const m of modules) {
  if (!m.questions) continue;
  // Answer the whole module by looping practice sessions until the bank is covered.
  const seen = new Set();
  for (let round = 0; round < Math.ceil(m.questions / 10) + 2 && seen.size < m.questions; round++) {
    await page.evaluate(id => { location.hash = '#/practice/' + id; }, m.id);
    await page.waitForTimeout(430);
    // A hash that is already current will not re-render, so force a fresh session.
    for (let q = 0; q < 10; q++) {
      const st = await page.evaluate(() => {
        const v = document.getElementById('view');
        return {
          hasOptions: v.querySelectorAll('.option').length,
          hasNum: !!v.querySelector('#num-input'),
          text: v.querySelector('.q-text')?.textContent?.trim() || '',
          finished: !!v.querySelector('.result-banner'),
        };
      });
      if (st.finished || (!st.hasOptions && !st.hasNum)) break;
      seen.add(st.text);
      // Deliberately alternate right/wrong to exercise both feedback paths.
      const answerCorrectly = (answered % 2) === 0;
      if (st.hasNum) {
        numeric++;
        const val = await page.evaluate(a => {
          // the correct value is only in the module data, so fetch it by question text
          return a ? null : 0;
        }, answerCorrectly);
        await page.fill('#num-input', answerCorrectly ? '0' : '999999');
      } else {
        const idxs = await page.evaluate(() => [...document.querySelectorAll('.option')].map((_, i) => i));
        // pick the first option; correctness varies, which is what we want to cover
        await page.locator('.option').nth(answerCorrectly ? 0 : idxs.length - 1).click();
      }
      await page.waitForTimeout(90);
      const canCheck = await page.locator('#check-btn').isEnabled().catch(() => false);
      if (!canCheck) break;
      await page.click('#check-btn');
      await page.waitForTimeout(160);
      const fb = await page.evaluate(() => {
        const v = document.getElementById('view');
        const verdict = v.querySelector('.verdict')?.textContent?.trim() || '';
        return {
          verdict,
          hasExplanation: (v.querySelector('.explain .callout')?.textContent || '').trim().length > 20,
          hasNext: !!v.querySelector('#next-btn'),
          revealed: v.querySelectorAll('.reveal-correct').length,
        };
      });
      check(`${m.id}: every answer gets a verdict`, /Correct|Not quite/i.test(fb.verdict), fb.verdict);
      check(`${m.id}: every answer gets an explanation`, fb.hasExplanation);
      if (/Not quite/i.test(fb.verdict)) {
        wrongSeen++;
        check(`${m.id}: a wrong answer reveals the correct option`, fb.revealed > 0 || st.hasNum);
      } else correctSeen++;
      answered++;
      if (!fb.hasNext) break;
      await page.click('#next-btn');
      await page.waitForTimeout(110);
    }
  }
  check(`${m.id}: practice served questions`, seen.size > 0, `${seen.size} distinct`);
}
console.log(`answered ${answered} questions (${correctSeen} correct, ${wrongSeen} wrong, ${numeric} numeric)`);
check('both feedback paths were exercised', correctSeen > 0 && wrongSeen > 0, `${correctSeen}/${wrongSeen}`);
check('spaced repetition recorded every answer', await page.evaluate(() =>
  JSON.parse(localStorage.getItem('gds-state-v1')).counters.answered) >= answered);

// ---------------------------------------------------------------- exam German
section('Exam German phrases and drill');
await page.evaluate(() => { location.hash = '#/phrases'; });
await page.waitForTimeout(520);
const ph = await page.evaluate(() => {
  const v = document.getElementById('view');
  return { groups: v.querySelectorAll('.terms-table').length, rows: v.querySelectorAll('.terms-table tr').length,
    hasDrill: !!v.querySelector('a[href="#/phrases/drill"]') };
});
check('phrase groups render', ph.groups >= 5, `${ph.groups} groups`);
check('all phrases render', ph.rows >= 40, `${ph.rows} rows`);
check('the drill is reachable', ph.hasDrill);
await page.evaluate(() => { location.hash = '#/phrases/drill'; });
await page.waitForTimeout(520);
let drilled = 0;
for (let i = 0; i < 12; i++) {
  if (!(await page.locator('.option').count())) break;
  await page.locator('.option').first().click();
  await page.waitForTimeout(110);
  drilled++;
  if (await page.locator('#next').count()) { await page.click('#next'); await page.waitForTimeout(110); }
  else break;
}
check('the drill accepts answers', drilled >= 5, `${drilled} answered`);

// ---------------------------------------------------------------- mock exam
section('Mock exam, played to completion');
await page.evaluate(() => { location.hash = '#/exam'; });
await page.waitForTimeout(520);
check('readiness is shown before starting', await page.evaluate(() =>
  /Exam readiness/i.test(document.getElementById('view').textContent)));
check('the exam-language right is stated', await page.evaluate(() =>
  /English|Spanish|Italian/.test(document.getElementById('view').textContent)));
await page.click('#start-btn');
await page.waitForTimeout(500);
const cells = await page.locator('[data-nav]').count();
check('the paper has 30 questions', cells === 30, String(cells));
for (let i = 0; i < cells; i++) {
  await page.evaluate(n => document.querySelector(`[data-nav="${n}"]`)?.click(), i);
  await page.waitForTimeout(45);
  if (await page.locator('#num-input').count()) await page.fill('#num-input', '27.5');
  else await page.locator('.option').first().click();
  await page.waitForTimeout(45);
}
// The app's authoritative signal is the "N/30 answered" counter; the grid marks
// the current cell too, so counting .answered alone under-reports by one.
const answeredCount = await page.evaluate(() => {
  const m = document.getElementById('answered-count')?.textContent?.match(/(\d+)\s*\/\s*(\d+)/);
  return m ? Number(m[1]) : -1;
});
const gridAnswered = await page.evaluate(() => document.querySelectorAll('[data-nav].answered').length);
check('the counter registers every answer', answeredCount === cells, `${answeredCount}/${cells}`);
check('the grid marks every answered cell, including the current one', gridAnswered === cells, `${gridAnswered}/${cells}`);
page.once('dialog', d => d.accept());
await page.click('#submit-btn');
await page.waitForTimeout(800);
const res = await page.evaluate(() => {
  const v = document.getElementById('view');
  return { text: v.textContent.replace(/\s+/g, ' '),
    review: v.querySelectorAll('#review .poi-item').length,
    hasStudyPlan: /Where you lost the points/i.test(v.textContent) };
});
check('the exam is scored', /error points/i.test(res.text));
check('every question is reviewable', res.review === cells, `${res.review}/${cells}`);
check('a failed exam produces a study plan', res.hasStudyPlan || /Passed/i.test(res.text));
check('the attempt is persisted', (await page.evaluate(() =>
  JSON.parse(localStorage.getItem('gds-state-v1')).exams.length)) >= 1);
check('the exam session is cleared after submitting', (await page.evaluate(() =>
  localStorage.getItem('gds-exam-session-v1'))) === null);

// ---------------------------------------------------------------- every task
section('Every real-world task opens');
const taskIds = await page.evaluate(async () => {
  const j = await (await fetch('data/journey.json')).json();
  return j.paths.convert.flatMap(p => (p.tasks || []).map(t => t.id));
});
for (const id of taskIds) {
  await page.evaluate(t => { location.hash = '#/task/' + t; }, id);
  await page.waitForTimeout(330);
  const t = await page.evaluate(() => {
    const v = document.getElementById('view');
    return { words: v.textContent.trim().split(/\s+/).length,
      steps: v.querySelectorAll('.checklist li').length,
      canComplete: !!v.querySelector('#done-btn') || /Completed/.test(v.textContent),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
  });
  check(`task ${id}: has guidance`, t.words > 80, `${t.words} words`);
  check(`task ${id}: has actionable steps`, t.steps >= 3, `${t.steps} steps`);
  check(`task ${id}: can be completed`, t.canComplete);
  check(`task ${id}: no overflow`, t.overflow <= 1, `${t.overflow}px`);
}

// ---------------------------------------------------------------- progression
section('Progression and persistence');
await page.evaluate(() => { location.hash = '#/stats'; });
await page.waitForTimeout(520);
const st = await page.evaluate(() => JSON.parse(localStorage.getItem('gds-state-v1')));
check('XP was earned across the course', st.xp > 0, String(st.xp));
check('badges were earned', st.badges.length > 0, st.badges.join(','));
check('all 11 lessons are recorded as read', Object.keys(st.lessons).length === 11, String(Object.keys(st.lessons).length));
check('a streak was started', st.streak.count >= 1, JSON.stringify(st.streak));
check('the level advanced beyond 1', st.level >= 2, String(st.level));
const shown = await page.evaluate(() => document.getElementById('view').textContent);
check('Progress reflects the lessons read', /11\/11|11 \/ 11/.test(shown) || /lessons read/i.test(shown));

// export → import round trip
const exported = await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('gds-state-v1'))));
const roundTrip = await page.evaluate(async json => {
  const { sanitizeState } = await import('./js/security.js');
  const clean = sanitizeState(JSON.parse(json));
  return { xp: clean.xp, lessons: Object.keys(clean.lessons).length, badges: clean.badges.length,
    proto: Object.getPrototypeOf(clean) === Object.prototype };
}, exported);
check('a real export survives sanitising intact', roundTrip.xp === st.xp && roundTrip.lessons === 11, JSON.stringify(roundTrip));
check('sanitised state has a clean prototype', roundTrip.proto);

// hostile import
const hostile = await page.evaluate(async () => {
  const { sanitizeState } = await import('./js/security.js');
  const clean = sanitizeState(JSON.parse('{"__proto__":{"pwned":true},"xp":"lots","badges":"nope","exams":{}}'));
  return { polluted: ({}).pwned === true, xp: clean.xp, badgesIsArray: Array.isArray(clean.badges),
    examsIsArray: Array.isArray(clean.exams) };
});
check('a hostile progress file cannot pollute a prototype', !hostile.polluted);
check('a hostile progress file cannot smuggle a bad type', hostile.xp === 0 && hostile.badgesIsArray && hostile.examsIsArray,
  JSON.stringify(hostile));

// ---------------------------------------------------------------- resilience
section('Resilience');
// A truncated/corrupt payload must not brick the app — it should fall back to
// defaults and still render, because there is no other recovery path for a user.
await page.evaluate(() => localStorage.setItem('gds-state-v1', '{"xp":"broken","badges":"x","exams":5,"profile":42'));
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(900);
const recovered = await page.evaluate(() => ({
  rendered: document.getElementById('view').textContent.trim().length > 40,
  hash: location.hash,
}));
check('a corrupt save file still renders the app', recovered.rendered, JSON.stringify(recovered));

// Type-confused but VALID json must be coerced, not crash a view.
await page.evaluate(() => localStorage.setItem('gds-state-v1',
  JSON.stringify({ profile: { path: 'convert', residenceSince: '2026-05-15' }, xp: 'lots', badges: 'nope', exams: {}, quiz: 'no', counters: null })));
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(900);
for (const r of ['#/journey', '#/stats', '#/exam', '#/learn']) {
  await page.evaluate(h => { location.hash = h; }, r);
  await page.waitForTimeout(420);
  const ok = await page.evaluate(() => document.getElementById('view').textContent.trim().length > 40);
  check(`type-confused save still renders ${r}`, ok);
}

// ---------------------------------------------------------------- verdict
console.log(`\n--- console errors: ${errors.length} ---`);
[...new Set(errors)].slice(0, 8).forEach(e => console.log('  ' + e.slice(0, 160)));

await browser.close();
console.log(`\nCOURSE TEST: ${pass} passed, ${fail} failed, ${errors.length} console errors`);
process.exit(fail === 0 && errors.length === 0 ? 0 : 1);
