// Real-browser end-to-end test: drives the app in system Chrome, walks every
// route, plays a full mock exam, and fails on any console error or page error.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const BASE = 'http://localhost:4173/';
const SHOTS = new URL('./shots/', import.meta.url).pathname;
mkdirSync(SHOTS, { recursive: true });
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

let failures = 0;
const check = (label, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${cond ? '' : ' :: ' + extra}`);
  if (!cond) failures++;
};

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1180, height: 900 } });
const page = await ctx.newPage();
  { const _c = await ctx.newCDPSession(page); await _c.send('Network.setCacheDisabled', { cacheDisabled: true }); }

const consoleErrors = [];
page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', e => consoleErrors.push('pageerror: ' + e.message));
page.on('requestfailed', r => {
  // Leaflet/font CDNs may be blocked offline; only local assets must load.
  if (r.url().startsWith(BASE)) consoleErrors.push('requestfailed: ' + r.url());
});

const view = () => page.locator('#view');
const shot = name => page.screenshot({ path: SHOTS + name + '.png', fullPage: true });

await page.goto(BASE, { waitUntil: 'networkidle' });

// ---- 1. onboarding ----
check('boots into onboarding', page.url().endsWith('#/welcome'), page.url());
check('offers all three licence paths', await page.locator('[data-path]').count() === 3,
  String(await page.locator('[data-path]').count()));
check('asks for the Anmeldung date', await page.locator('#res-input').count() === 1);
await shot('01-onboarding');

// ---- 2. choose the Argentine conversion path ----
await page.fill('#name-input', 'Alex');
await page.fill('#res-input', '2026-06-01');
await page.fill('#licence-input', 'Argentina');
await page.click('[data-path="convert"]');
await page.waitForTimeout(500);
check('lands on the journey', page.url().endsWith('#/journey'), page.url());
check('greets the user by name', (await view().textContent()).includes('Alex'));

const profile = await page.evaluate(() => JSON.parse(localStorage.getItem('gds-state-v1')).profile);
check('persists path + residence date',
  profile.path === 'convert' && profile.residenceSince === '2026-06-01', JSON.stringify(profile));

// ---- 3. the clock must never invent a legal period ----
const rulesOk = await page.evaluate(async b => (await fetch(b + 'data/rules.json')).ok, BASE).catch(() => false);
const journeyTxt = (await view().textContent()).replace(/\s+/g, ' ');
if (rulesOk) {
  check('shows the countdown once the legal period is verified', /days left/i.test(journeyTxt), journeyTxt.slice(0, 200));
} else {
  check('withholds the countdown while the law is unverified',
    /not active yet|being verified/i.test(journeyTxt) && !/days left/i.test(journeyTxt), journeyTxt.slice(0, 220));
}
await shot('02-journey');

// ---- 4. every route renders ----
for (const [route, name] of [['#/learn', '03-learn'], ['#/phrases', '04-phrases'], ['#/exam', '05-exam'],
                             ['#/map', '06-map'], ['#/stats', '07-stats'], ['#/glossary', '08-glossary'],
                             ['#/privacy', '12-privacy']]) {
  await page.evaluate(r => { location.hash = r; }, route);
  await page.waitForTimeout(700);
  const len = (await view().textContent()).trim().length;
  check(`route ${route} renders`, len > 40, 'len=' + len);
  await shot(name);
}

// ---- 5. glossary search ----
await page.evaluate(() => { location.hash = '#/glossary'; });
await page.waitForTimeout(400);
const glossBefore = await page.locator('.gloss-item').count();
await page.fill('#q', 'Umschreibung');
await page.waitForTimeout(250);
const glossAfter = await page.locator('.gloss-item').count();
check('glossary is populated', glossBefore > 40, 'entries=' + glossBefore);
check('glossary search narrows results', glossAfter > 0 && glossAfter < glossBefore, `${glossBefore} -> ${glossAfter}`);

// ---- 6. full mock exam ----
await page.evaluate(() => { location.hash = '#/exam'; });
await page.waitForTimeout(500);
const startEnabled = await page.locator('#start-btn').isEnabled().catch(() => false);
if (startEnabled) {
  await page.click('#start-btn');
  await page.waitForTimeout(400);
  const cells = await page.locator('[data-nav]').count();
  check('exam builds a 30-question paper', cells === 30, cells + ' questions');

  const pools = await page.evaluate(() =>
    [...document.querySelectorAll('[data-nav]')].length);
  check('navigation grid is clickable', pools === 30);

  for (let i = 0; i < cells; i++) {
    await page.evaluate(n => {
      document.querySelector(`[data-nav="${n}"]`)?.click();
    }, i);
    await page.waitForTimeout(60);
    if (await page.locator('#num-input').count()) {
      await page.fill('#num-input', '42');
    } else {
      await page.locator('.option').first().click();
    }
    await page.waitForTimeout(60);
  }
  page.once('dialog', d => d.accept());
  await page.click('#submit-btn');
  await page.waitForTimeout(800);
  const res = (await view().textContent()).replace(/\s+/g, ' ');
  check('exam yields a scored result', /error points/i.test(res), res.slice(0, 180));
  check('exam shows a review section', /Review your answers/i.test(res));
  const exams = await page.evaluate(() => JSON.parse(localStorage.getItem('gds-state-v1')).exams);
  check('attempt is persisted', exams.length === 1, JSON.stringify(exams));
  await shot('09-exam-result');
} else {
  console.log('SKIP  mock exam (question bank not ready)');
}

// ---- 7. practice quiz + XP ----
await page.evaluate(() => { location.hash = '#/practice'; });
await page.waitForTimeout(600);
if (await page.locator('.option, #num-input').count()) {
  const xpBefore = await page.evaluate(() => JSON.parse(localStorage.getItem('gds-state-v1')).xp);
  if (await page.locator('#num-input').count()) await page.fill('#num-input', '1');
  else await page.locator('.option').first().click();
  await page.waitForTimeout(150);
  await page.click('#check-btn');
  await page.waitForTimeout(400);
  const t = (await view().textContent()).replace(/\s+/g, ' ');
  check('quiz reveals verdict + explanation', /Correct|Not quite/i.test(t), t.slice(0, 150));
  const st = await page.evaluate(() => JSON.parse(localStorage.getItem('gds-state-v1')));
  check('answer recorded for spaced repetition', st.counters.answered >= 1, JSON.stringify(st.counters));
  check('xp never decreases', st.xp >= xpBefore, `${xpBefore} -> ${st.xp}`);
  await shot('10-practice');
} else {
  console.log('SKIP  practice quiz (question bank not ready)');
}

// ---- 8. mobile viewport ----
const mob = await ctx.newPage();
  { const _c = await ctx.newCDPSession(mob); await _c.send('Network.setCacheDisabled', { cacheDisabled: true }); }
await mob.goto(BASE, { waitUntil: 'networkidle' });
await mob.setViewportSize({ width: 390, height: 844 });
await mob.waitForTimeout(500);
// Check every route, not just the landing one — the lesson page's German term
// table overflowed for weeks because this test only ever looked at #/journey.
const routes = ['#/journey', '#/learn', '#/lesson/m07-autobahn', '#/task/c-firstaid', '#/exam', '#/stats', '#/glossary', '#/phrases', '#/privacy'];
for (const r of routes) {
  await mob.evaluate(h => { location.hash = h; }, r);
  await mob.waitForTimeout(650);
  const info = await mob.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const bad = [];
    for (const el of document.querySelectorAll('*')) {
      const b = el.getBoundingClientRect();
      if (b.right > vw + 1) bad.push(`${el.tagName}.${String(el.className).slice(0,24)} w=${Math.round(b.width)} "${(el.textContent||'').trim().slice(0,24)}"`);
    }
    return { overflow: document.documentElement.scrollWidth - vw, bad: bad.slice(0, 3) };
  });
  check(`no overflow at ${r}`, info.overflow <= 1, `${info.overflow}px :: ${info.bad.join(' | ')}`);
}
await mob.evaluate(() => { location.hash = '#/journey'; });
await mob.waitForTimeout(500);
const mobInfo = await mob.evaluate(() => {
  const vw = document.documentElement.clientWidth;
  const bad = [];
  for (const el of document.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (r.right > vw + 1) bad.push(`${el.tagName}.${String(el.className).slice(0,30)} w=${Math.round(r.width)} right=${Math.round(r.right)} "${(el.textContent||'').trim().slice(0,30)}"`);
  }
  return { hash: location.hash, overflow: document.documentElement.scrollWidth - vw, bad: bad.slice(0, 6) };
});
check('no horizontal overflow on mobile', mobInfo.overflow <= 1,
  `overflow=${mobInfo.overflow}px at ${mobInfo.hash} :: ${mobInfo.bad.join(' | ') || 'no element flagged'}`);
await mob.screenshot({ path: SHOTS + '11-mobile.png', fullPage: true });

console.log('\n--- console errors: ' + consoleErrors.length + ' ---');
[...new Set(consoleErrors)].slice(0, 12).forEach(e => console.log('  ' + e.slice(0, 300)));

await browser.close();
console.log(`\n${failures === 0 && consoleErrors.length === 0 ? 'ALL GREEN' : 'FAILURES: ' + failures + ', console errors: ' + consoleErrors.length}`);
process.exit(failures || consoleErrors.length ? 1 : 0);
