// ============ Security primitives ============
//
// Small, pure, heavily tested. Everything here exists because of a specific,
// verified weakness — each function's doc block states the CONTRACT a test may
// rely on, so the tests in tests/security.test.mjs read as a specification.
//
// Threat model: this app has no backend and no accounts. The realistic hostile
// inputs are (1) a "progress file" someone is sent and imports, and (2) content
// that reaches innerHTML. Nothing here defends against a user attacking their own
// browser, which is not a threat.

/**
 * URL schemes allowed in an href we render.
 * `javascript:` and `data:` are the dangerous ones: esc() escapes quotes and
 * angle brackets but does NOT neutralise a scheme, so `javascript:alert(1)`
 * survives escaping intact and executes on click.
 */
const SAFE_SCHEMES = ['http:', 'https:', 'mailto:', 'tel:'];

/**
 * Make a URL safe to place in an href.
 *
 * CONTRACT — a test may rely on all of this:
 * - Returns in-app hash links unchanged ('#/foo' → '#/foo'), because those are
 *   the app's own router targets.
 * - Returns http/https/mailto/tel URLs unchanged.
 * - Returns '#' for anything else, including `javascript:`, `data:`, `vbscript:`,
 *   and scheme-obfuscation attempts ('JaVaScRiPt:', leading/embedded whitespace,
 *   control characters, and Unicode look-alikes that the URL parser folds).
 * - Returns '#' for null/undefined/empty/non-string input rather than throwing.
 * - Never returns a string starting with 'javascript' in any casing.
 *
 * @param {unknown} url
 * @returns {string} a URL that is safe in an href, or '#'
 */
export function safeUrl(url) {
  if (typeof url !== 'string') return '#';
  const raw = url.trim();
  if (!raw) return '#';
  // In-app router links.
  if (raw.startsWith('#')) return raw;

  // Browsers ignore control characters and assorted whitespace inside a scheme,
  // so "java\nscript:" and "java script:" both execute. Strip them before the
  // scheme test. The class is written with escapes rather than pasted literal
  // control characters, which silently corrupted this pattern the first time.
  const deObfuscated = raw.replace(/[\u0000-\u0020\u00a0\u1680\u2000-\u200d\u2028\u2029\u202f\u205f\u3000\ufeff]/g, '');
  if (/^[a-z0-9.+-]*script:/i.test(deObfuscated)) return '#';

  try {
    // A base is required for protocol-relative and relative URLs; we only read
    // the protocol off the result, never the resolved href.
    const parsed = new URL(raw, 'https://local.invalid/');
    if (!SAFE_SCHEMES.includes(parsed.protocol)) return '#';
    // Relative inputs resolve against the dummy base — hand back the original so
    // a relative path keeps working.
    if (/^[a-z][a-z0-9.+-]*:/i.test(raw) || raw.startsWith('//')) return parsed.href;
    return raw;
  } catch {
    return '#';
  }
}

// ---------------------------------------------------------------------------

/** Keys importState is allowed to write, with how each is coerced. */
const STATE_SHAPE = {
  profile: 'profile',
  tasks: 'taskMap',
  lessons: 'lessonMap',
  quiz: 'quizMap',
  exams: 'examList',
  counters: 'counters',
  daily: 'daily',
  xp: 'nonNegInt',
  level: 'nonNegInt',
  badges: 'stringList',
  streak: 'streak',
};

const num = (v, fallback = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
const nonNegInt = v => Math.max(0, Math.floor(num(v)));
const str = (v, max = 200) => (typeof v === 'string' ? v.slice(0, max) : '');
const bool = v => v === true;
const isoDateish = v => (/^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? String(v) : '');
const plainObject = v =>
  v !== null && typeof v === 'object' && !Array.isArray(v) ? v : {};

/**
 * Own enumerable string keys, excluding the prototype-poisoning ones.
 * Verified empirically: `JSON.parse('{"__proto__":{...}}')` creates `__proto__`
 * as an OWN property, and `Object.assign(target, that)` DOES change target's
 * prototype. So these keys must never be copied.
 */
function safeKeys(obj) {
  return Object.keys(obj).filter(k => k !== '__proto__' && k !== 'constructor' && k !== 'prototype');
}

const COERCE = {
  profile: v => {
    const p = plainObject(v);
    return {
      name: str(p.name, 60),
      path: ['convert', 'eu', 'new'].includes(p.path) ? p.path : null,
      startedAt: num(p.startedAt, null) || null,
      residenceSince: isoDateish(p.residenceSince),
      licenceCountry: str(p.licenceCountry, 60),
    };
  },
  taskMap: v => {
    const out = {};
    const src = plainObject(v);
    for (const k of safeKeys(src).slice(0, 500)) {
      const t = plainObject(src[k]);
      const steps = {};
      for (const s of safeKeys(plainObject(t.steps)).slice(0, 200)) {
        if (/^\d+$/.test(s)) steps[s] = bool(t.steps[s]);
      }
      out[str(k, 80)] = { done: bool(t.done), doneAt: num(t.doneAt, null) || null, steps };
    }
    return out;
  },
  lessonMap: v => {
    const out = {};
    const src = plainObject(v);
    for (const k of safeKeys(src).slice(0, 500)) {
      const l = plainObject(src[k]);
      out[str(k, 80)] = { done: bool(l.done), doneAt: num(l.doneAt, null) || null };
    }
    return out;
  },
  quizMap: v => {
    const out = {};
    const src = plainObject(v);
    for (const k of safeKeys(src).slice(0, 5000)) {
      const q = plainObject(src[k]);
      out[str(k, 80)] = {
        box: Math.min(4, nonNegInt(q.box)),
        right: nonNegInt(q.right),
        wrong: nonNegInt(q.wrong),
        last: num(q.last, null) || null,
      };
    }
    return out;
  },
  examList: v => (Array.isArray(v) ? v : []).slice(-500).map(e => {
    const x = plainObject(e);
    return {
      date: num(x.date, 0),
      errorPoints: nonNegInt(x.errorPoints),
      fiveWrong: nonNegInt(x.fiveWrong),
      passed: bool(x.passed),
      total: nonNegInt(x.total),
    };
  }),
  counters: v => {
    const c = plainObject(v);
    return { correct: nonNegInt(c.correct), answered: nonNegInt(c.answered) };
  },
  daily: v => {
    const d = plainObject(v);
    return { day: isoDateish(d.day), answered: nonNegInt(d.answered), correct: nonNegInt(d.correct) };
  },
  nonNegInt,
  stringList: v => (Array.isArray(v) ? v : []).filter(x => typeof x === 'string').slice(0, 200).map(x => str(x, 60)),
  streak: v => {
    const s = plainObject(v);
    return { last: isoDateish(s.last) || null, count: nonNegInt(s.count), best: nonNegInt(s.best) };
  },
};

/**
 * Turn arbitrary parsed JSON into a state object that is safe to merge.
 *
 * CONTRACT — a test may rely on all of this:
 * - Returns a plain object whose prototype is Object.prototype, ALWAYS.
 * - Never copies `__proto__`, `constructor` or `prototype` keys, so importing
 *   `{"__proto__":{"polluted":true}}` cannot change any prototype.
 * - Drops unknown top-level keys entirely (allowlist, not denylist).
 * - Coerces every value to the type the app expects: `xp: "lots"` becomes 0,
 *   `badges: "nope"` becomes [], `exams: {}` becomes [], so no view can be made
 *   to call .filter on a string.
 * - Clamps quiz box to 0..4 and forces counts non-negative, so a hostile file
 *   cannot fabricate impossible progress that breaks the readiness maths.
 * - Caps collection sizes so an enormous file cannot hang a render.
 * - Truncates strings, so `profile.name` cannot be a megabyte of text.
 * - Never throws for any input, including null, arrays, primitives and cycles.
 *
 * @param {unknown} parsed  result of JSON.parse on an untrusted file
 * @returns {object} a sanitised, prototype-clean partial state
 */
export function sanitizeState(parsed) {
  const src = plainObject(parsed);
  const out = Object.create(null);
  for (const key of safeKeys(src)) {
    const kind = STATE_SHAPE[key];
    if (!kind) continue; // allowlist: unknown keys are dropped
    out[key] = COERCE[kind](src[key]);
  }
  // Hand back a normal object literal so downstream `in`/hasOwnProperty and
  // JSON.stringify behave conventionally.
  return { ...out };
}
