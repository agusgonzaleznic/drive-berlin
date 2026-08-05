// Keyboard-only journey: can a user with no mouse actually use the app?
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
const p = await ctx.newPage();
  { const _c = await ctx.newCDPSession(p); await _c.send('Network.setCacheDisabled', { cacheDisabled: true }); }
let fail = 0;
const check = (l, c, extra='') => { console.log(`${c?'PASS':'FAIL'}  ${l}${c?'':' :: '+extra}`); if(!c) fail++; };

await p.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
await p.waitForTimeout(800);

// 1. Can we reach and activate a path choice with the keyboard alone?
const reachable = await p.evaluate(() => {
  const el = document.querySelector('[data-path]');
  return { tag: el.tagName, focusable: el.tabIndex >= 0 || ['A','BUTTON'].includes(el.tagName) };
});
check('onboarding path choice is a natively focusable element', reachable.focusable, reachable.tag);

// Tab until focus lands on a path choice, then press Enter.
let landed = false;
for (let i = 0; i < 40 && !landed; i++) {
  await p.keyboard.press('Tab');
  landed = await p.evaluate(() => !!document.activeElement?.closest?.('[data-path]'));
}
check('a path choice is reachable by Tab', landed);
if (landed) {
  await p.keyboard.press('Enter');
  await p.waitForTimeout(600);
  check('Enter activates it and leaves onboarding', p.url().includes('#/journey'), p.url());
}

// 2. Focus indicator must be visible on the focused element.
await p.keyboard.press('Tab');
const ring = await p.evaluate(() => {
  const el = document.activeElement;
  const s = getComputedStyle(el);
  return { tag: el.tagName, outlineWidth: s.outlineWidth, outlineStyle: s.outlineStyle, boxShadow: s.boxShadow };
});
const hasRing = (parseFloat(ring.outlineWidth) > 0 && ring.outlineStyle !== 'none') || (ring.boxShadow && ring.boxShadow !== 'none');
check('focused element shows a visible focus indicator', hasRing, JSON.stringify(ring));

// 3. Journey task cards must be keyboard-operable links.
await p.evaluate(() => { location.hash = '#/journey'; });
await p.waitForTimeout(700);
const cards = await p.evaluate(() => {
  const els = [...document.querySelectorAll('.task-card .card')];
  return { n: els.length, tags: [...new Set(els.map(e => e.tagName))], hrefs: els.filter(e => e.getAttribute('href')).length };
});
check('every journey task card is a link with an href', cards.n > 0 && cards.tags.length === 1 && cards.tags[0] === 'A' && cards.hrefs === cards.n, JSON.stringify(cards));

// 4. Module cards too.
await p.evaluate(() => { location.hash = '#/learn'; });
await p.waitForTimeout(700);
const mods = await p.evaluate(() => {
  const els = [...document.querySelectorAll('.module-card')];
  return { n: els.length, tags: [...new Set(els.map(e => e.tagName))] };
});
check('every module card is a link', mods.n > 0 && mods.tags.length === 1 && mods.tags[0] === 'A', JSON.stringify(mods));

// 5. Focus moves into the view on route change (not stranded in the tab bar).
await p.evaluate(() => { location.hash = '#/glossary'; window.dispatchEvent(new Event('hashchange')); });
await p.waitForTimeout(500);
const focusMoved = await p.evaluate(() => document.activeElement?.id === 'view' || !!document.activeElement?.closest?.('#view'));
check('focus moves into the main view after navigation', focusMoved);

// 6. Reduced motion must suppress confetti.
const ctx2 = await b.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
const p2 = await ctx2.newPage();
  { const _c = await ctx2.newCDPSession(p2); await _c.send('Network.setCacheDisabled', { cacheDisabled: true }); }
await p2.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
await p2.waitForTimeout(600);
const suppressed = await p2.evaluate(async () => {
  const { confetti, prefersReducedMotion } = await import('./js/ui.js');
  if (!prefersReducedMotion()) return 'media query not applied';
  const c = document.getElementById('confetti');
  const g = c.getContext('2d');
  let painted = false;
  const orig = g.fillRect.bind(g);
  g.fillRect = (...a) => { painted = true; orig(...a); };
  confetti(50);
  await new Promise(r => setTimeout(r, 300));
  return painted ? 'confetti still painted' : 'suppressed';
});
check('reduced-motion suppresses confetti', suppressed === 'suppressed', String(suppressed));

await b.close();
console.log(fail ? `\nFAILURES: ${fail}` : '\nKEYBOARD + MOTION: ALL GREEN');
process.exit(fail ? 1 : 0);
