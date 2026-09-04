// Checks that every external URL cited in the prose and the app data still
// resolves. Run it with `npm run check:external-links`.
//
// WHY THIS EXISTS: check-links.mjs covers links that point inside this
// repository, so it cannot see the failure that actually shipped. Three
// Erste Hilfe Station entries and one journey step linked to
// erste-hilfe-station.de for weeks after that domain was suspended. Nothing in
// CI noticed, because an external link is just a string to every other check we
// run. The knowledge base had the correct live domain the whole time, so this was
// pure rot, and rot is exactly what a periodic check catches and a one-off audit
// does not.
//
// This is NOT wired into pull requests, on purpose. Third-party availability is
// not a property of a contributor's diff: a scraper-hostile CDN, a rate limit or
// a two-minute outage would block an unrelated change for reasons its author
// cannot fix. It runs on a schedule instead, where a red run is a maintenance
// signal rather than a gate. See .github/workflows/external-links.yml.
//
// The classification below is deliberately conservative about what counts as
// broken, because the first version of this check (written by hand during the
// audit) produced more false alarms than real findings. Every WHY note on the
// rules below records an actual false positive from that run.

import { readdirSync, readFileSync, appendFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { request as httpsRequest } from 'node:https';
import { request as httpRequest } from 'node:http';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const SKIP_DIRS = new Set(['node_modules', '.git', '.claude-flow', 'dist']);

// A real browser UA. Several of the sites we cite (ADAC, TUEV SUED, Ko-fi) serve
// a challenge or a flat 403 to anything that looks automated, and one of them
// (berlin.de) varies its redirect behaviour by client.
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

// Generous, because several German public-sector sites are genuinely slow and a
// link check has no deadline to meet.
//
// WHY NOT fetch(): Node's fetch imposes its own 10-second CONNECT timeout that
// this constant cannot reach, and it surfaces as UND_ERR_CONNECT_TIMEOUT. Two
// live-but-slow sites tripped it and were reported unreachable. node:https lets
// the timeout mean what it says, and it also lets us drop the response the
// moment the headers arrive instead of buffering a body we never read.
const TIMEOUT_MS = 45_000;
const CONCURRENCY = 8;
const MAX_REDIRECTS = 12;

// Hosts that answer automated clients with 401/403/405/429 as policy. A block is
// not rot: the link works for the reader, which is who it is for. These are
// reported as "blocked" and do not fail the run.
//
// WHY: Ko-fi returns a Cloudflare challenge for EVERY path, including ones that
// certainly exist, which was confirmed by requesting an invented username and
// getting a byte-identical response. tuvsud.com returns 403 even for its own
// site root. Treating either as broken would mean this check is red forever.
const BOT_BLOCKED_HOSTS = new Set([
  'ko-fi.com',
  'www.tuvsud.com',
  'ealem.cancilleria.gob.ar',
  'www.linkedin.com',
]);

// URLs that are not links at all and must never be fetched.
//
// WHY each: w3.org/2000/svg is an XML namespace identifier that happens to look
// like a URL; the tile and Maps entries are template strings containing {z} or
// ${...} placeholders; localhost and local.invalid are development and test
// fixtures; a bare analytics origin legitimately 404s on GET because it only
// serves specific paths.
function isNotALink(url) {
  return (
    /^https?:\/\/(localhost|127\.0\.0\.1|local\.invalid|x\b)/.test(url) ||
    url.includes('{') || url.includes('$') || url.includes('*') ||
    url.startsWith('http://www.w3.org/') ||
    /^https?:\/\/(www\.)?(googletagmanager|google-analytics)\.com\/?$/.test(url) ||
    /^https?:\/\/(region1|analytics)\.google-analytics\.com/.test(url)
  );
}

// Prose and app data only. index.html is excluded because its Content-Security
// -Policy names origins as policy rather than linking to them, and fetching a CSP
// directive is meaningless.
const wanted = (rel) => rel.endsWith('.md') || /^src\/data\/.+\.json$/.test(rel);

// Only files git tracks, which is the set a reader can actually reach.
//
// WHY: several AI working notes live under docs/ and are gitignored on purpose.
// The first run of this check reported a dead unpkg URL that turned out to be the
// string "…/icons/NAME.svg" inside one of those local-only files, where NAME is a
// documented placeholder rather than a link. Scanning untracked files means
// reporting problems in text nobody publishes.
function trackedFiles() {
  try {
    return execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8' })
      .split('\0')
      .filter(rel => rel && wanted(rel))
      .map(rel => join(ROOT, rel));
  } catch {
    // No git available. Fall back to a filesystem walk so the check still runs,
    // and say so, because the file set is then wider than what is published.
    console.warn('git ls-files unavailable, walking the filesystem instead\n');
    return walk(ROOT);
  }
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.name !== '.github') continue;
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (wanted(relative(ROOT, full))) out.push(full);
  }
  return out;
}

// Pull URLs out of text without inheriting the surrounding markup.
//
// WHY the trimming loop: during the audit my first extractor reported two dead
// links that were both artefacts of its own regex. `**https://github.com/user**`
// lost to markdown bold, so the trailing asterisks became part of the URL, and a
// Wikipedia link whose path legitimately contains "(EU)" was truncated at the
// opening parenthesis. Balance the parentheses, then strip trailing punctuation.
function extractUrls(text) {
  const found = new Set();
  for (const match of text.matchAll(/https?:\/\/[^\s"'<>\\`]+/g)) {
    let url = match[0];
    // Markdown emphasis and JSON/markdown structure that cannot be part of a URL.
    url = url.replace(/[*_]+$/, '').replace(/[,.;:!]+$/, '');
    // Drop closing brackets the URL never opened, e.g. a markdown [text](url).
    for (const [open, close] of [['(', ')'], ['[', ']']]) {
      while (
        url.endsWith(close) &&
        url.split(open).length <= url.split(close).length
      ) {
        url = url.slice(0, -1);
      }
    }
    if (url.length > 12) found.add(url);
  }
  return found;
}

// One GET, following redirects by hand so we can carry cookies across them.
//
// WHY a cookie jar: personalausweisportal.de and some berlin.de pages sit behind
// an Apache cookie gate that 307s to a /cookie-check path and only serves the
// article once the cookie comes back. A client that drops cookies sees either a
// 400 or a redirect loop and calls a perfectly good page broken. Both were
// reported as failures during the audit and both were fine in a browser.
//
// WHY no HTTP/2 concern: Node's fetch speaks HTTP/1.1, which sidesteps the other
// audit false positive, where curl's HTTP/2 gave INTERNAL_ERROR on six
// gesetze-im-internet.de pages that all return 200 over HTTP/1.1.
async function probe(url) {
  const jar = new Map();
  let current = url;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const cookies = [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
    let res;
    try {
      res = await new Promise((resolve, reject) => {
        const target = new URL(current);
        const send = target.protocol === 'http:' ? httpRequest : httpsRequest;
        const req = send(
          target,
          {
            method: 'GET',
            headers: {
              'user-agent': UA,
              accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'accept-language': 'de-DE,de;q=0.9,en;q=0.8',
              ...(cookies ? { cookie: cookies } : {}),
            },
          },
          (r) => {
            // Headers are all we need. Dropping the socket here keeps a 1.5 MB
            // page from being pulled down just to learn it returned 200.
            const out = {
              status: r.statusCode,
              location: r.headers.location,
              setCookie: r.headers['set-cookie'] ?? [],
            };
            r.destroy();
            resolve(out);
          },
        );
        req.setTimeout(TIMEOUT_MS, () => req.destroy(Object.assign(new Error('timed out'), { code: 'ETIMEDOUT' })));
        req.on('error', reject);
        req.end();
      });
    } catch (err) {
      return { status: 0, error: String(err.code || err.message).slice(0, 120), final: current };
    }

    for (const raw of res.setCookie) {
      const [pair] = raw.split(';');
      const idx = pair.indexOf('=');
      if (idx > 0) jar.set(pair.slice(0, idx).trim(), pair.slice(idx + 1).trim());
    }

    if (res.status >= 300 && res.status < 400 && res.location) {
      current = new URL(res.location, current).toString();
      continue;
    }
    return { status: res.status, final: current };
  }
  return { status: -1, error: `more than ${MAX_REDIRECTS} redirects`, final: current };
}

// Three buckets, and the dividing line is whether a READER is affected.
//
// A 401/403/405/429 from a scraper-hostile site is not a reader's problem: the
// page opens fine in a browser, and only the robot is refused. Those are
// reported and do not fail the run.
//
// Everything else that fails to produce a page IS a reader's problem, whatever
// the cause, so it fails the run. That includes timeouts and 5xx, which are
// somebody else's outage rather than our mistake. The run being red for a day is
// the correct cost here, because nothing is gated on it and a link a reader
// cannot open is worth a look either way.
//
// WHY NOT SOMETHING CLEVERER: I tried to separate "conclusively dead" from
// "merely unreachable" by reading the network error, and it does not work. The
// suspended domain that motivated this whole check reports
// UND_ERR_CONNECT_TIMEOUT through fetch, and a direct TLS handshake to it times
// out too, which is byte-for-byte the same signal a live-but-slow site
// (boletinoficial.gob.ar) produces. An earlier version of this file trusted that
// distinction and quietly classified erste-hilfe-station.de as a transient blip,
// which would have made this script miss the exact bug it was written for.
function classify(url, result) {
  const host = (() => { try { return new URL(url).host; } catch { return ''; } })();

  if (result.status >= 200 && result.status < 300) return { level: 'ok' };

  if ([401, 403, 405, 429].includes(result.status)) {
    return BOT_BLOCKED_HOSTS.has(host)
      ? { level: 'blocked', note: `HTTP ${result.status}, known to refuse automated clients` }
      : { level: 'blocked', note: `HTTP ${result.status}, probably bot protection. Open it in a browser to confirm` };
  }

  if (result.status === -1) return { level: 'broken', note: result.error };
  if (result.status >= 500) return { level: 'broken', note: `HTTP ${result.status}, server-side or a WAF` };
  if (result.status === 0) return { level: 'broken', note: `no response: ${result.error}` };
  return { level: 'broken', note: `HTTP ${result.status}` };
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    }),
  );
  return out;
}

// ---------------------------------------------------------------- run

const files = trackedFiles();
const sources = new Map(); // url -> Set(file)
for (const file of files) {
  const rel = relative(ROOT, file);
  for (const url of extractUrls(readFileSync(file, 'utf8'))) {
    if (isNotALink(url)) continue;
    if (!sources.has(url)) sources.set(url, new Set());
    sources.get(url).add(rel);
  }
}

const urls = [...sources.keys()].sort();
console.log(`checking ${urls.length} external URLs from ${files.length} files\n`);

// When a URL fails, ask whether the host itself is answering. This is the one
// diagnostic that reliably separates "their site is down, wait" from "our link
// is wrong, fix it", and unlike reading the network error it actually works: a
// host-wide failure and a single dead path look nothing alike at the origin.
//
// It is a note, not a verdict. Both still count as unreachable, because a reader
// cannot open either one. The difference is what the maintainer should do next.
const originCache = new Map();
async function hostAlive(url) {
  let origin;
  try { origin = new URL(url).origin + '/'; } catch { return null; }
  if (!originCache.has(origin)) {
    originCache.set(origin, probe(origin).then(r => r.status >= 200 && r.status < 400));
  }
  return originCache.get(origin);
}

const results = await mapLimit(urls, CONCURRENCY, async (url) => {
  let verdict = classify(url, await probe(url));
  // A second chance, because one timeout is not evidence of anything. Only the
  // reader-affecting bucket is retried; a policy block will not change its mind.
  if (verdict.level === 'broken') {
    await new Promise(r => setTimeout(r, 1500));
    verdict = classify(url, await probe(url));
  }
  if (verdict.level === 'broken') {
    const alive = await hostAlive(url);
    verdict.note += alive === false
      ? '. The host is not serving its own root either, so this is a site-wide outage rather than a wrong path'
      : alive === true
        ? '. The host is up, so this path is the problem'
        : '';
  }
  return { url, ...verdict };
});

const broken = results.filter(r => r.level === 'broken');
const blocked = results.filter(r => r.level === 'blocked');

for (const r of broken) {
  console.log(`UNREACHABLE  ${r.url}\n         ${r.note}\n         cited in: ${[...sources.get(r.url)].join(', ')}`);
}
for (const r of blocked) {
  console.log(`blocked  ${r.url}  (${r.note})`);
}
console.log(
  `\n${results.length - broken.length - blocked.length} ok, ` +
  `${blocked.length} refused to robots, ${broken.length} unreachable`,
);

// A job summary so the schedule is readable without opening the log.
if (process.env.GITHUB_STEP_SUMMARY) {
  const lines = [
    '## External link check',
    '',
    `- ${results.length - broken.length - blocked.length} reachable`,
    `- ${blocked.length} refused to automated clients (reader unaffected, not a failure)`,
    `- **${broken.length} unreachable**`,
    '',
  ];
  if (broken.length) {
    lines.push('| URL | Problem | Cited in |', '| --- | --- | --- |');
    for (const r of broken) {
      lines.push(`| ${r.url} | ${r.note} | ${[...sources.get(r.url)].join('<br>')} |`);
    }
  } else {
    lines.push('Nothing to fix.');
  }
  if (blocked.length) {
    lines.push('', '<details><summary>Refused to automated clients</summary>', '');
    for (const r of blocked) lines.push(`- ${r.url} (${r.note})`);
    lines.push('', '</details>');
  }
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join('\n') + '\n');
}

// Non-zero only for links that are genuinely gone, so a red run always means
// there is something to fix in this repository.
process.exit(broken.length ? 1 : 0);
