// Regenerates the README screenshots in docs/assets/screenshots/.
//
// Run with the dev server up:  npm run dev &  &&  node scripts/gen-screenshots.mjs
//
// Uses playwright-core against system Chrome (no browser download). State is seeded
// into localStorage so the shots show a session in progress rather than empty shells.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const BASE = 'http://localhost:4173/';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = new URL('../docs/assets/screenshots/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const today = new Date().toISOString().slice(0, 10);

// A mid-journey save: level 5, a six-day streak, two tasks done, one exam passed.
const SEED = {
  profile: { name: 'Alex', path: 'convert', residenceSince: '2026-05-15', startedAt: Date.now(), licenceCountry: 'Argentina' },
  xp: 1180, level: 5,
  badges: ['ignition', 'translated', 'first-aid', 'week-one'],
  streak: { last: today, count: 6, best: 9 },
  counters: { correct: 96, answered: 132 },
  daily: { day: today, answered: 12, correct: 10 },
  exams: [{ date: Date.now() - 864e5, errorPoints: 8, passed: true, total: 30 }],
  // real ids from src/data/journey.json (paths.convert[].tasks[].id)
  tasks: Object.fromEntries(['c-verdict', 'c-clock', 'c-translation', 'c-firstaid', 'c-school']
    .map((id, i) => [id, { done: true, doneAt: Date.now() - (9 - i) * 864e5, steps: {} }])),
  // real ids from src/data/modules/*.json (the `id` field)
  lessons: Object.fromEntries(['m01-system', 'm02-signs', 'm03-priority']
    .map((id, i) => [id, { done: true, doneAt: Date.now() - (4 - i) * 864e5 }])),
  quiz: {},
};

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 880 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
{ const c = await ctx.newCDPSession(page); await c.send('Network.setCacheDisabled', { cacheDisabled: true }); }

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.evaluate(s => localStorage.setItem('gds-state-v1', JSON.stringify(s)), SEED);
// A full reload is required for the seed to be picked up. `goto` with only a
// changed fragment is a same-document navigation: the app would not re-read
// localStorage and would save its empty in-memory state back over the seed.
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(600);

// name, then the route, then any in-page interaction needed to reach the shot
const SHOTS = [
  ['journey', '#/journey', null],
  ['learn', '#/learn', null],
  ['lesson', '#/learn/m01-system', null],
  ['quiz', '#/quiz', null],
  ['exam', '#/exam', async p => {
    const start = p.locator('button', { hasText: /start|begin/i }).first();
    if (await start.count()) { await start.click(); await p.waitForTimeout(600); }
  }],
  ['stats', '#/stats', null],
  ['map', '#/map', null],
  ['phrases', '#/phrases', null],
];

for (const [name, hash, act] of SHOTS) {
  await page.evaluate(h => { location.hash = h; }, hash);
  await page.waitForTimeout(1100);              // let ring/count-up animations settle
  if (act) await act(page);
  await page.screenshot({ path: `${OUT}${name}.jpg`, type: 'jpeg', quality: 86 });
  console.log('wrote', name + '.jpg');
}

// One mobile shot for the responsive claim.
const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const mp = await mctx.newPage();
await mp.goto(BASE, { waitUntil: 'networkidle' });
await mp.evaluate(s => localStorage.setItem('gds-state-v1', JSON.stringify(s)), SEED);
await mp.reload({ waitUntil: 'networkidle' });
await mp.evaluate(() => { location.hash = '#/journey'; });
await mp.waitForTimeout(1100);
await mp.screenshot({ path: `${OUT}mobile-journey.jpg`, type: 'jpeg', quality: 86 });
console.log('wrote mobile-journey.jpg');

await browser.close();
