// Prove the CSP + SRI do not break the app: Leaflet must still load and execute,
// tiles must still fetch, and there must be zero CSP violation reports.
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
const p = await ctx.newPage();
{ const c = await ctx.newCDPSession(p); await c.send('Network.setCacheDisabled', { cacheDisabled: true }); }
const violations = [], failed = [], tiles = [];
p.on('console', m => { if (m.type() === 'error') violations.push(m.text()); });
p.on('requestfailed', r => failed.push(r.url().slice(0, 90) + ' :: ' + (r.failure()?.errorText || '')));
p.on('response', r => { if (r.url().includes('tile.openstreetmap.org')) tiles.push(r.status()); });

await p.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
await p.evaluate(() => localStorage.setItem('gds-state-v1', JSON.stringify({
  profile:{name:'A',path:'convert',residenceSince:'2026-05-15',startedAt:Date.now()},
  xp:0,level:1,badges:[],streak:{last:null,count:0,best:0},counters:{correct:0,answered:0},exams:[],tasks:{},lessons:{},quiz:{} })));
await p.reload({ waitUntil: 'networkidle' });
await p.waitForTimeout(1200);

const leaflet = await p.evaluate(() => typeof window.L);
console.log(`Leaflet loaded under SRI + CSP: ${leaflet === 'object' ? 'YES' : 'NO (' + leaflet + ')'}`);

await p.evaluate(() => { location.hash = '#/map'; });
await p.waitForTimeout(3500);
const mapUp = await p.evaluate(() => !!document.querySelector('.leaflet-container'));
console.log(`Leaflet map initialised: ${mapUp ? 'YES' : 'NO'}`);
console.log(`OSM tile responses: ${tiles.length} (statuses: ${[...new Set(tiles)].join(',') || 'none'})`);

const fonts = await p.evaluate(() => document.fonts ? [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family) : []);
console.log(`fonts loaded: ${[...new Set(fonts)].join(', ') || 'none (fallback stack in use)'}`);

const cspViolations = violations.filter(v => /Content Security Policy|Refused to/i.test(v));
console.log(`\nCSP violations: ${cspViolations.length}`);
cspViolations.slice(0, 6).forEach(v => console.log('  ' + v.slice(0, 160)));
const other = violations.filter(v => !/Content Security Policy|Refused to/i.test(v));
console.log(`other console errors: ${other.length}`);
other.slice(0, 4).forEach(v => console.log('  ' + v.slice(0, 140)));
console.log(`failed requests: ${failed.length}`);
failed.slice(0, 5).forEach(f => console.log('  ' + f));

await b.close();
const ok = leaflet === 'object' && mapUp && tiles.some(s => s === 200) && cspViolations.length === 0;
console.log(ok ? '\nCSP + SRI: ALL GREEN' : '\nCSP + SRI: PROBLEM');
process.exit(ok ? 0 : 1);
