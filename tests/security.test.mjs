// Security tests. These read as the SPECIFICATION for src/js/security.js — each
// assertion corresponds to a line in that module's CONTRACT doc blocks. If a
// contract changes, a test here must change with it, deliberately.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { safeUrl, sanitizeState } from '../src/js/security.js';
import { esc, md } from '../src/js/ui.js';
import { icon } from '../src/js/icons.js';
import { emblem, flag } from '../src/js/brand.js';
import { glyph } from '../src/js/glyphs.js';

// ---------------------------------------------------------------- safeUrl

test('safeUrl passes through the schemes we actually link to', () => {
  for (const u of [
    'https://service.berlin.de/dienstleistung/327537/',
    'http://localhost:4173/',
    'mailto:someone@example.com',
    'tel:+4930115',
  ]) assert.equal(safeUrl(u), u, u);
});

test('safeUrl passes through in-app router links untouched', () => {
  assert.equal(safeUrl('#/phrases'), '#/phrases');
  assert.equal(safeUrl('#/task/c-firstaid'), '#/task/c-firstaid');
  assert.equal(safeUrl('#'), '#');
});

test('safeUrl neutralises javascript: — the case esc() cannot catch', () => {
  // esc() escapes quotes and angle brackets, so a javascript: URL survives it
  // intact and would execute on click. This is the whole reason safeUrl exists.
  const attacks = [
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    '  javascript:alert(1)',
    'java\nscript:alert(1)',
    'java\tscript:alert(1)',
    'java script:alert(1)',
    'javascript\u0000:alert(1)',
    'vbscript:msgbox(1)',
    'data:text/html,<script>alert(1)</script>',
    'data:image/svg+xml,<svg onload=alert(1)>',
  ];
  for (const a of attacks) {
    const out = safeUrl(a);
    assert.equal(out, '#', `expected '#' for ${JSON.stringify(a)}, got ${JSON.stringify(out)}`);
  }
});

test('safeUrl never returns anything containing a script scheme', () => {
  const fuzz = [
    'jAvAsCrIpT:void(0)', '\u0001javascript:alert(1)', 'javascript:/*x*/alert(1)',
    'livescript:alert(1)', 'x-javascript:alert(1)', 'JAVASCRIPT:alert(1)',
  ];
  for (const f of fuzz) {
    const out = safeUrl(f).toLowerCase().replace(/\s/g, '');
    assert.ok(!out.includes('script:'), `leaked a script scheme: ${out}`);
  }
});

test('safeUrl is total — no input throws, junk becomes #', () => {
  for (const v of [null, undefined, '', '   ', 0, 42, {}, [], NaN, true, Symbol.iterator ? 'ok' : '']) {
    const out = safeUrl(v);
    assert.equal(typeof out, 'string');
    if (v !== 'ok') assert.equal(out, '#', String(v));
  }
});

test('safeUrl rejects exotic schemes that are not on the allowlist', () => {
  for (const u of ['file:///etc/passwd', 'chrome://settings', 'about:blank', 'blob:https://x/y', 'ftp://x/y']) {
    assert.equal(safeUrl(u), '#', u);
  }
});

// ---------------------------------------------------------------- esc / md

test('esc neutralises every character that can break out of HTML', () => {
  assert.equal(esc('<script>alert(1)</script>'),
    '&lt;script&gt;alert(1)&lt;/script&gt;');
  assert.equal(esc('" onmouseover="alert(1)'), '&quot; onmouseover=&quot;alert(1)');
  assert.equal(esc("' onfocus='x"), '&#39; onfocus=&#39;x');
  assert.equal(esc('a & b'), 'a &amp; b');
  assert.equal(esc(null), '');
  assert.equal(esc(undefined), '');
});

test('md escapes before converting markdown, so tags cannot survive', () => {
  const out = md('**bold** and <img src=x onerror=alert(1)>');
  assert.match(out, /<strong>bold<\/strong>/, 'markdown still works');
  assert.ok(!out.includes('<img'), 'raw tag must not survive');
  assert.match(out, /&lt;img/, 'the tag is shown as text');
});

test('md cannot be used to inject an attribute or a script', () => {
  for (const payload of [
    '`<script>alert(1)</script>`',
    '- <iframe src=javascript:alert(1)>',
    '*<svg onload=alert(1)>*',
  ]) {
    const out = md(payload);
    assert.ok(!/<(script|iframe|svg)/i.test(out), `leaked a tag for ${payload}: ${out}`);
  }
});

// ---------------------------------------------------------------- sanitizeState

test('sanitizeState blocks prototype pollution through an imported file', () => {
  // Verified empirically: JSON.parse creates __proto__ as an OWN property and
  // Object.assign(target, that) DOES change the target's prototype.
  const hostile = JSON.parse('{"__proto__":{"polluted":true},"constructor":{"x":1},"xp":5}');
  const clean = sanitizeState(hostile);
  assert.equal(Object.getPrototypeOf(clean), Object.prototype, 'prototype must be untouched');
  assert.equal(({}).polluted, undefined, 'Object.prototype must stay clean');
  assert.ok(!Object.prototype.hasOwnProperty.call(clean, '__proto__'));
  assert.ok(!Object.prototype.hasOwnProperty.call(clean, 'constructor'));
  assert.equal(clean.xp, 5, 'legitimate keys still come through');
});

test('sanitizeState drops unknown keys — allowlist, not denylist', () => {
  const clean = sanitizeState({ xp: 1, evil: 'x', innerHTML: '<script>', __v: 1 });
  assert.deepEqual(Object.keys(clean).sort(), ['xp']);
});

test('sanitizeState fixes the type confusion that would crash a view', () => {
  // badges as a string would make .includes() do substring matching, and
  // exams as an object would make .filter() throw mid-render.
  const clean = sanitizeState({ badges: 'ignition', exams: { a: 1 }, counters: 'nope', xp: 'lots' });
  assert.deepEqual(clean.badges, [], 'badges must be an array');
  assert.deepEqual(clean.exams, [], 'exams must be an array');
  assert.deepEqual(clean.counters, { correct: 0, answered: 0 });
  assert.equal(clean.xp, 0, 'a non-numeric xp becomes 0');
  assert.equal(typeof clean.badges.filter, 'function');
});

test('sanitizeState refuses impossible progress values', () => {
  const clean = sanitizeState({
    xp: -5000,
    level: 99.9,
    quiz: { q1: { box: 99, right: -3, wrong: 'x' } },
    counters: { correct: -1, answered: Infinity },
  });
  assert.equal(clean.xp, 0, 'negative xp clamps to 0');
  assert.equal(clean.level, 99, 'level is an integer');
  assert.equal(clean.quiz.q1.box, 4, 'box clamps to the top Leitner box');
  assert.equal(clean.quiz.q1.right, 0);
  assert.equal(clean.quiz.q1.wrong, 0);
  assert.equal(clean.counters.correct, 0);
  assert.equal(clean.counters.answered, 0, 'Infinity is not a finite count');
});

test('sanitizeState validates the profile against the real path options', () => {
  const clean = sanitizeState({ profile: { path: 'admin', name: 'x'.repeat(5000), residenceSince: 'not-a-date' } });
  assert.equal(clean.profile.path, null, 'an unknown path is rejected');
  assert.equal(clean.profile.name.length, 60, 'name is truncated');
  assert.equal(clean.profile.residenceSince, '', 'a malformed date is dropped');
  const good = sanitizeState({ profile: { path: 'convert', residenceSince: '2026-05-15' } });
  assert.equal(good.profile.path, 'convert');
  assert.equal(good.profile.residenceSince, '2026-05-15');
});

test('sanitizeState caps collection sizes so a huge file cannot hang a render', () => {
  const exams = Array.from({ length: 5000 }, (_, i) => ({ date: i, errorPoints: 1, passed: true, total: 30 }));
  const quiz = {};
  for (let i = 0; i < 20000; i++) quiz['q' + i] = { box: 1, right: 1, wrong: 0, last: 1 };
  const clean = sanitizeState({ exams, quiz, badges: Array(5000).fill('x') });
  assert.ok(clean.exams.length <= 500, `exams capped, got ${clean.exams.length}`);
  assert.ok(Object.keys(clean.quiz).length <= 5000, 'quiz capped');
  assert.ok(clean.badges.length <= 200, 'badges capped');
});

test('sanitizeState is total — never throws, whatever it is handed', () => {
  const cyclic = { xp: 1 }; cyclic.self = cyclic;
  for (const v of [null, undefined, 0, 'string', [], [1, 2], true, NaN, cyclic, { profile: null }, { tasks: [] }]) {
    const out = sanitizeState(v);
    assert.equal(typeof out, 'object');
    assert.equal(Object.getPrototypeOf(out), Object.prototype);
  }
});

test('sanitizeState keeps a legitimate export intact through a round trip', () => {
  const real = {
    profile: { name: 'Agus', path: 'convert', startedAt: 1770000000000, residenceSince: '2026-05-15', licenceCountry: 'Argentina' },
    tasks: { 'c-verdict': { done: true, doneAt: 1770000000000, steps: { 0: true, 1: false } } },
    lessons: { 'm01-system': { done: true, doneAt: 1770000000000 } },
    quiz: { 'm01-system-q01': { box: 3, right: 4, wrong: 1, last: 1770000000000 } },
    exams: [{ date: 1770000000000, errorPoints: 8, fiveWrong: 0, passed: true, total: 30 }],
    counters: { correct: 96, answered: 132 },
    daily: { day: '2026-08-05', answered: 7, correct: 5 },
    xp: 1180, level: 5, badges: ['ignition', 'translated'],
    streak: { last: '2026-08-05', count: 6, best: 9 },
  };
  const clean = sanitizeState(JSON.parse(JSON.stringify(real)));
  assert.equal(clean.profile.name, 'Agus');
  assert.equal(clean.profile.path, 'convert');
  assert.equal(clean.tasks['c-verdict'].done, true);
  assert.equal(clean.tasks['c-verdict'].steps['0'], true);
  assert.equal(clean.quiz['m01-system-q01'].box, 3);
  assert.equal(clean.exams[0].errorPoints, 8);
  assert.equal(clean.xp, 1180);
  assert.deepEqual(clean.badges, ['ignition', 'translated']);
  assert.equal(clean.streak.count, 6);
});

// ---------------------------------------------------------------- shipped data

test('no shipped data file contains a dangerous URL scheme', () => {
  // Belt and braces: safeUrl protects the render path, and this catches a bad
  // link being introduced into content in the first place.
  const dir = new URL('../src/data/', import.meta.url).pathname;
  const files = [];
  const walk = d => readdirSync(d, { withFileTypes: true }).forEach(e => {
    const p = d + e.name;
    if (e.isDirectory()) walk(p + '/'); else if (e.name.endsWith('.json')) files.push(p);
  });
  walk(dir);
  assert.ok(files.length > 5, 'expected to find the data files');
  for (const f of files) {
    const raw = readFileSync(f, 'utf8');
    assert.ok(!/javascript\s*:/i.test(raw), `${f} contains a javascript: URL`);
    assert.ok(!/<script/i.test(raw), `${f} contains a script tag`);
    assert.ok(!/\son\w+\s*=/i.test(raw), `${f} contains an inline event handler`);
  }
});

// ------------------------------------------------ first-party loading surface
//
// Leaflet used to be fetched from unpkg and both font families from Google
// Fonts. Both are now vendored under src/assets/, which removed two origins
// whose compromise would have meant arbitrary script or CSS in every visitor's
// browser, and stopped the app leaking visitor IP addresses to Google.
//
// These assertions are the ENFORCEABLE half of that decision. They are plain
// file reads with no browser, so they run under `npm test`, which is the suite
// CI executes: a re-introduced CDN now fails a pull request. tests/csp.mjs
// proves the same property against a real browser, but it needs system Chrome
// at a hardcoded macOS path and so does not run in CI (see .github/workflows/ci.yml).
//
// THERE IS NOW ONE EXCEPTION, and it is consented rather than silent. Analytics
// adds googletagmanager.com as a script origin and the GA4 endpoints as connect
// targets. The fonts stay vendored, so the old leak this section was written
// about (an IP address handed to Google before a glyph is drawn, with nobody
// asked) is still fixed: no request reaches any Google host until a visitor opts
// in. The lists below pin that exception to exactly those origins, and
// tests/consent.browser.mjs proves the "not before opt-in" half in a browser.

const SRC = new URL('../src/', import.meta.url).pathname;
const readSrc = p => readFileSync(SRC + p, 'utf8');

// index.html plus the two stylesheets ARE the fetch-and-execute surface: between
// them they decide every script, style, font and image the browser loads.
// Outbound links in src/js and src/data are deliberately out of scope, because a
// link the user chooses to click is not a subresource.
const LOADING_SURFACE = ['index.html', 'css/base.css', 'css/components.css'];

// The origins index.html is allowed to name, each for a stated reason.
//
// The tile hosts are a genuine third-party dependency: tiles are raster images
// generated per viewport, so there is nothing to vendor. The w3.org URI is the
// SVG namespace inside the inline --grain texture, which is an identifier rather
// than a request.
//
// The Google hosts are analytics, and they are here deliberately rather than by
// accident. googletagmanager.com serves gtag.js, and it cannot be pinned with
// Subresource Integrity because Google reissues that file at will. The rest are
// where GA4 sends its hits. Nothing is requested from any of them until a visitor
// opts in, which is the property tests/consent.browser.mjs and tests/csp.mjs
// enforce against a real browser. Do NOT extend this list to make a test pass:
// an origin arriving here without that reasoning is the failure this guards.
const ALLOWED_ORIGINS = new Set([
  'https://tile.openstreetmap.org',
  'https://*.tile.openstreetmap.org',
  'http://www.w3.org',
  'https://www.googletagmanager.com',
  'https://www.google-analytics.com',
  'https://analytics.google.com',
  'https://*.google-analytics.com',
]);

test('nothing in the loading surface points at a third-party origin', () => {
  for (const f of LOADING_SURFACE) {
    for (const m of readSrc(f).matchAll(/https?:\/\/[^\s"'()>;,]+/g)) {
      const origin = m[0].replace(/^(https?:\/\/[^/]+).*$/, '$1');
      assert.ok(ALLOWED_ORIGINS.has(origin),
        `${f} references ${origin}. Vendor it under src/assets/ instead, or add it to ALLOWED_ORIGINS and to the CSP deliberately.`);
    }
  }
});

test('every subresource in index.html is a same-origin relative path', () => {
  const html = readSrc('index.html');
  const refs = [...html.matchAll(/<(?:script|link)\b[^>]*?\b(?:src|href)="([^"]+)"/gi)].map(m => m[1]);
  assert.ok(refs.length >= 5, `expected to find the subresource tags, found ${refs.length}`);
  for (const r of refs) {
    assert.ok(!/^(?:https?:)?\/\//.test(r), `${r} is loaded from another origin`);
  }
  // gtag.js is the one external script this app runs, and it is injected by
  // js/consent.js after an explicit opt-in. As a static tag it would load for
  // every visitor before anyone had been asked anything, which is the entire
  // thing the consent module exists to prevent.
  assert.ok(!/<script[^>]+googletagmanager/i.test(html),
    'gtag.js must be injected after consent, never shipped as a static script tag');
  // SRI pins bytes we do not control. Every STATIC subresource is in this
  // repository, so an integrity attribute would be describing our own files to
  // ourselves. If one reappears here, a CDN has come back as a static tag.
  // (gtag.js cannot be pinned at all: see ALLOWED_ORIGINS above.)
  assert.ok(!/\bintegrity=/.test(html), 'integrity= implies a third-party subresource');
  assert.ok(!/\brel="preconnect"/.test(html),
    'preconnect implies a third-party origin, and a preconnect to Google would ' +
    'open a connection before the visitor had consented to anything');
});

test('the measurement ID in the repository is still the placeholder', () => {
  const html = readSrc('index.html');
  const m = html.match(/<meta name="ga-measurement-id" content="([^"]*)">/);
  assert.ok(m, 'js/consent.js reads the ID from this meta tag, so the tag must exist');
  assert.equal(m[1], '__GA_MEASUREMENT_ID__',
    'a real G-xxxx measurement ID must never be committed. The Pages workflow ' +
    'substitutes it at deploy time; the placeholder is what keeps development ' +
    'and every fork from talking to Google.');
});

// Every directive is pinned with deepEqual rather than a "contains" check, so
// widening the policy by one origin fails here and has to be argued for in a
// diff. That is the point: the CSP is the only thing standing between this app
// and the next well-meaning snippet.
test('the CSP allows analytics and nothing else beyond this origin', () => {
  const csp = readSrc('index.html').match(/http-equiv="Content-Security-Policy"\s+content="([^"]*)"/i)?.[1];
  assert.ok(csp, 'the CSP meta tag must be present');
  const d = Object.fromEntries(csp.split(';')
    .map(x => x.trim().split(/\s+/)).filter(x => x[0]).map(x => [x[0], x.slice(1)]));

  assert.deepEqual(d['default-src'], ["'self'"]);
  // gtag.js is the ONE external origin allowed to execute script here, and it
  // cannot be integrity-pinned. A second entry in this list is a second party
  // that can run arbitrary code in every visitor's browser.
  assert.deepEqual(d['script-src'], ["'self'", 'https://www.googletagmanager.com'],
    'googletagmanager.com is the only external script origin');
  assert.deepEqual(d['font-src'], ["'self'"], 'the font families are vendored, so no font host is needed');
  // The GA4 collection endpoints, including the regional variants
  // (region1.google-analytics.com and so on) that the wildcard covers.
  assert.deepEqual(d['connect-src'],
    ["'self'", 'https://www.google-analytics.com', 'https://analytics.google.com', 'https://*.google-analytics.com']);
  assert.deepEqual(d['object-src'], ["'none'"]);
  assert.deepEqual(d['base-uri'], ["'none'"]);
  assert.deepEqual(d['form-action'], ["'none'"]);
  // style-src keeps 'unsafe-inline' because the views set style="" on many
  // elements. What it must never regain is an external origin.
  assert.deepEqual(d['style-src'], ["'self'", "'unsafe-inline'"]);
  // The last entry is gtag's pixel transport, used only when fetch and
  // sendBeacon are both unavailable.
  assert.deepEqual(d['img-src'],
    ["'self'", 'data:', 'https://tile.openstreetmap.org', 'https://*.tile.openstreetmap.org',
      'https://www.google-analytics.com']);
});

test('every vendored file the app asks for is actually in the repository', () => {
  // A browser catches a bad relative path as a 404. CI has no browser, so check
  // the paths against the filesystem instead: this is what would fail if a
  // vendored font or the Leaflet build were ever left out of a commit.
  const wanted = [
    ...[...readSrc('index.html').matchAll(/\b(?:src|href)="((?:assets|css|js)\/[^"]+)"/g)]
      .map(m => ({ from: 'index.html', path: join(SRC, m[1]) })),
    ...[...readSrc('css/base.css').matchAll(/url\('(\.\.\/assets\/[^']+)'\)/g)]
      .map(m => ({ from: 'css/base.css', path: join(SRC, 'css', m[1]) })),
  ];
  assert.ok(wanted.length >= 11, `expected the vendored references, found ${wanted.length}`);
  for (const w of wanted) assert.ok(existsSync(w.path), `${w.from} references a missing file: ${w.path}`);

  // The two families and the licence text that the OFL requires we ship.
  for (const f of ['assets/fonts/LICENSE.cinzel', 'assets/fonts/LICENSE.dm-sans', 'assets/vendor/leaflet/LICENSE.leaflet']) {
    assert.ok(existsSync(SRC + f), `missing licence file: ${f}`);
  }
});

// ------------------------------------------------ rendering-primitive escaping
//
// These four build HTML by string concatenation, so they are the last line of
// defence if a data file ever carries hostile text. Escaping only the double
// quote was a real shipped bug. Worse, src/js/icons.js is GENERATED by
// scripts/gen-icons.mjs, so regenerating it silently reverted the fix while the
// whole suite stayed green. These tests exist so that cannot happen twice.

const HOSTILE = `a&b<c>d"e'f`;
const FULLY_ESCAPED = 'a&amp;b&lt;c&gt;d&quot;e&#39;f';

test('icon() fully escapes its aria-label', () => {
  const out = icon('arrow-right', { label: HOSTILE });
  assert.ok(out.includes(`aria-label="${FULLY_ESCAPED}"`),
    `label not fully escaped: ${out.match(/aria-label="[^"]*"/)?.[0]}`);
  for (const raw of ['&b', '<c', '>d', "'f"]) {
    assert.ok(!out.includes(raw), `unescaped ${raw} survived into the markup`);
  }
});

test('emblem() and flag() fully escape their labels', () => {
  for (const out of [emblem({ label: HOSTILE }), flag('de', { label: HOSTILE })]) {
    assert.ok(out.includes(FULLY_ESCAPED), 'label not fully escaped');
    assert.ok(!/<c|>d/.test(out.replace(/<\/?[a-z][^>]*>/g, '')),
      'raw angle brackets from the label reached the markup');
  }
});

test('glyph() escapes an unmapped character rather than interpolating it raw', () => {
  const out = glyph('<img src=x onerror=alert(1)>');
  assert.ok(!out.includes('<img'), 'raw tag interpolated from the glyph fallback');
  // Strip the one wrapper element this function legitimately emits, then nothing
  // resembling markup may remain. Searching the whole string for "onerror=" would
  // be a false positive: escaped inside text content it is inert, and asserting on
  // it would fail a function that is actually correct.
  const textOnly = out.replace(/^<span aria-hidden="true">/, '').replace(/<\/span>$/, '');
  assert.ok(!/[<>]/.test(textOnly), `unescaped angle bracket in glyph text: ${textOnly}`);
  assert.ok(textOnly.includes('&lt;img'), 'the character was dropped rather than escaped');
});

test('the generated icons.js still carries the full escape set', () => {
  // Guards against a stale scripts/gen-icons.mjs quietly reverting the fix.
  const src = readFileSync(new URL('../src/js/icons.js', import.meta.url).pathname, 'utf8');
  assert.match(src, /replace\(\/\[&<>"/,
    'icons.js escapes fewer characters than it should; regenerate with the current generator');
  const gen = readFileSync(new URL('../scripts/gen-icons.mjs', import.meta.url).pathname, 'utf8');
  assert.match(gen, /\[&<>"/,
    'gen-icons.mjs emits partial escaping; fix the generator, not just its output');
});
