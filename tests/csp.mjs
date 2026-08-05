// Prove the CSP does not break the app AND that the app is genuinely first-party.
//
// Leaflet and both font families used to come from unpkg and Google Fonts. They
// are now vendored under src/assets/, so this test asserts two things at once:
//   1. nothing is broken: Leaflet executes, the map initialises, tiles fetch,
//      both font families load, and there are zero CSP violations;
//   2. nothing leaks: the ONLY third-party origin the page is allowed to touch
//      is the OpenStreetMap tile host. Any new CDN, font host or analytics
//      snippet fails this test rather than shipping quietly.
import { chromium } from 'playwright-core';

// The one third-party origin this app is permitted to contact. Tiles are raster
// images that cannot be vendored (there are millions of them), so this is the
// documented residual dependency.
const ALLOWED_THIRD_PARTY = /^https:\/\/([a-z]+\.)?tile\.openstreetmap\.org$/;
const ORIGIN = 'http://localhost:4173';

const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
const p = await ctx.newPage();
{ const c = await ctx.newCDPSession(p); await c.send('Network.setCacheDisabled', { cacheDisabled: true }); }

const violations = [], failed = [], tiles = [], requests = [];
p.on('console', m => { if (m.type() === 'error') violations.push(m.text()); });
// Leaflet cancels in-flight tiles whenever the view changes, and fitBounds moves
// the view right after the first paint, so ERR_ABORTED on a tile is ordinary
// behaviour rather than a fault. Everything else is a real failure: a 404 here
// is how a missing vendored font or script would show up.
p.on('requestfailed', r => {
  const err = r.failure()?.errorText || '';
  if (r.url().includes('tile.openstreetmap.org') && err === 'net::ERR_ABORTED') return;
  failed.push(r.url().slice(0, 90) + ' :: ' + err);
});
p.on('request', r => { if (/^https?:/.test(r.url())) requests.push(r.url()); });
p.on('response', r => { if (r.url().includes('tile.openstreetmap.org')) tiles.push(r.status()); });

// securitypolicyviolation fires for violations the console may format differently
// (and for style-src-attr, which is the one we are deliberately still allowing).
await p.addInitScript(() => {
  window.__csp = [];
  document.addEventListener('securitypolicyviolation', e => {
    window.__csp.push(`${e.violatedDirective} blocked ${e.blockedURI}`);
  });
});

await p.goto(ORIGIN + '/', { waitUntil: 'networkidle' });
await p.evaluate(() => localStorage.setItem('gds-state-v1', JSON.stringify({
  profile:{name:'A',path:'convert',residenceSince:'2026-05-15',startedAt:Date.now()},
  xp:0,level:1,badges:[],streak:{last:null,count:0,best:0},counters:{correct:0,answered:0},exams:[],tasks:{},lessons:{},quiz:{} })));
await p.reload({ waitUntil: 'networkidle' });
await p.waitForTimeout(1200);

const leaflet = await p.evaluate(() => typeof window.L);
const leafletVersion = await p.evaluate(() => window.L?.version ?? null);
console.log(`Leaflet loaded from this origin: ${leaflet === 'object' ? 'YES (v' + leafletVersion + ')' : 'NO (' + leaflet + ')'}`);

await p.evaluate(() => { location.hash = '#/map'; });
await p.waitForTimeout(3500);
const mapUp = await p.evaluate(() => !!document.querySelector('.leaflet-container'));
console.log(`Leaflet map initialised: ${mapUp ? 'YES' : 'NO'}`);
console.log(`OSM tile responses: ${tiles.length} (statuses: ${[...new Set(tiles)].join(',') || 'none'})`);

// ---------- fonts ----------
// Ask for each face explicitly so the assertion does not depend on which glyphs
// happen to be on screen, then confirm the umlauts and eszett really do resolve
// from the vendored latin subset rather than silently falling back.
const fonts = await p.evaluate(async () => {
  const ask = async spec => (await document.fonts.load(spec, 'Fahrerlaubnisbehörde straße')).length;
  const counts = {
    'Cinzel 700': await ask("700 16px 'Cinzel'"),
    'DM Sans 400': await ask("400 16px 'DM Sans'"),
    'DM Sans 500': await ask("500 16px 'DM Sans'"),
    'DM Sans 700': await ask("700 16px 'DM Sans'"),
    'DM Sans italic 400': await ask("italic 400 16px 'DM Sans'"),
  };
  return {
    counts,
    families: [...new Set([...document.fonts].filter(f => f.status === 'loaded').map(f => f.family))],
    // Widths must differ across the variable weight axis, otherwise one static
    // file is quietly serving three weights.
    variableAxisLive: (() => {
      const cv = document.createElement('canvas').getContext('2d');
      const w = wt => { cv.font = `${wt} 100px 'DM Sans'`; return cv.measureText('Fahrerlaubnis').width; };
      return new Set([w(400), w(500), w(700)]).size === 3;
    })(),
  };
});
const fontFiles = requests.filter(u => u.endsWith('.woff2'));
const fontsAreLocal = fontFiles.length > 0 && fontFiles.every(u => u.startsWith(ORIGIN + '/assets/fonts/'));
console.log(`font families loaded: ${fonts.families.join(', ') || 'none (fallback stack in use)'}`);
console.log(`  faces resolved: ${Object.entries(fonts.counts).map(([k, v]) => k + '=' + v).join(', ')}`);
console.log(`  woff2 files fetched: ${fontFiles.length}, all from ${ORIGIN}/assets/fonts/: ${fontsAreLocal ? 'YES' : 'NO'}`);
fontFiles.forEach(u => console.log('    ' + u.replace(ORIGIN, '')));
console.log(`  DM Sans variable weight axis live: ${fonts.variableAxisLive ? 'YES' : 'NO'}`);

// ---------- third-party surface ----------
const thirdParty = [...new Set(requests.map(u => new URL(u).origin))].filter(o => o !== ORIGIN);
const rogue = thirdParty.filter(o => !ALLOWED_THIRD_PARTY.test(o));
console.log(`\nthird-party origins contacted: ${thirdParty.length}`);
thirdParty.forEach(o => console.log(`  ${o} ${ALLOWED_THIRD_PARTY.test(o) ? '(allowed: map tiles)' : '<-- NOT ALLOWED'}`));

// ---------- violations ----------
const reported = await p.evaluate(() => window.__csp || []);
const cspViolations = [...violations.filter(v => /Content Security Policy|Refused to/i.test(v)), ...reported];
console.log(`\nCSP violations: ${cspViolations.length}`);
cspViolations.slice(0, 6).forEach(v => console.log('  ' + v.slice(0, 160)));
const other = violations.filter(v => !/Content Security Policy|Refused to/i.test(v));
console.log(`other console errors: ${other.length}`);
other.slice(0, 4).forEach(v => console.log('  ' + v.slice(0, 140)));
console.log(`failed requests (excluding cancelled tiles): ${failed.length}`);
failed.slice(0, 5).forEach(f => console.log('  ' + f));

await b.close();

const checks = {
  'Leaflet executes': leaflet === 'object',
  'map initialises': mapUp,
  'tiles fetch': tiles.some(s => s === 200),
  'both families load': ['Cinzel', 'DM Sans'].every(f => fonts.families.includes(f)),
  'every declared face resolves': Object.values(fonts.counts).every(n => n > 0),
  'fonts served from this origin': fontsAreLocal,
  'variable weight axis live': fonts.variableAxisLive,
  'no unexpected third-party origin': rogue.length === 0,
  'zero CSP violations': cspViolations.length === 0,
  'no failed requests beyond cancelled tiles': failed.length === 0,
};
console.log('');
for (const [name, ok] of Object.entries(checks)) console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}`);
const ok = Object.values(checks).every(Boolean);
console.log(ok ? '\nCSP + first-party surface: ALL GREEN' : '\nCSP + first-party surface: PROBLEM');
process.exit(ok ? 0 : 1);
