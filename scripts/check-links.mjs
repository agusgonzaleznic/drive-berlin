// Verifies the Markdown in this repository: heading anchors, relative file
// paths, and the house style rule about em dashes. Exits non-zero on any
// failure so it can gate CI. Run it with `npm run check:links`.
//
// WHY THIS EXISTS: a README anchor can rot silently. It is a plain string, it
// renders as a normal link, and nothing complains when it points at a heading
// that no longer exists. Two of them were already broken when this was written,
// both for the same non-obvious reason described under slug() below.
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname, relative, join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');

// Directories that never contain prose we own.
const SKIP_DIRS = new Set(['node_modules', '.git', '.claude-flow']);

// Files whose prose must contain no em dash. This is a house style rule, and it
// is a rule about writing rather than about Markdown, so it is a deliberate
// allowlist rather than a repository-wide sweep.
//
// docs/knowledge-base/ IS EXCLUDED ON PURPOSE. Those files are sourced research
// carrying several hundred em dashes between them. Rewriting them is a content
// decision, not a lint failure, and folding them in here would mean CI could
// never go green.
const NO_EM_DASH = [
  'README.md',
  'SECURITY.md',
  'CONTRIBUTING.md',
  'CODE_OF_CONDUCT.md',
  '.github/PULL_REQUEST_TEMPLATE.md',
];

function findMarkdown(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.name !== '.github') continue;
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...findMarkdown(full));
    else if (entry.name.endsWith('.md')) out.push(full);
  }
  return out;
}

// Lines inside fenced code blocks are not Markdown. Without this, a shell
// comment like `# open http://localhost:4173` is read as an h1 and a mermaid
// node label can be read as a heading.
function fencedLines(lines) {
  const inFence = new Array(lines.length).fill(false);
  let fence = null;
  lines.forEach((line, i) => {
    const m = line.match(/^\s*(```+|~~~+)/);
    if (m) {
      if (fence === null) { fence = m[1][0]; inFence[i] = true; return; }
      if (m[1][0] === fence) { fence = null; inFence[i] = true; return; }
    }
    inFence[i] = fence !== null;
  });
  return inFence;
}

// Reproduces GitHub's heading-to-anchor conversion: lowercase, drop punctuation
// and symbols, spaces to hyphens, then a -1/-2 suffix for repeats.
//
// THE SUBTLE PART, AND THE BUG THIS SCRIPT WAS WRITTEN FOR: GitHub strips the
// emoji itself but KEEPS U+FE0F, the invisible variation selector that some
// emoji carry. So `## 🏗️ Architecture` does not become `#-architecture`. It
// becomes `#<U+FE0F>-architecture`, with an invisible character after the hash.
// Emoji without a variation selector, such as 🚀, do give the clean `#-x` form,
// which is why only some anchors in a file break. The \p{M} in the character
// class below is what preserves that selector, and the behaviour was confirmed
// against GitHub's own renderer via `POST /markdown` rather than assumed.
function slug(text) {
  let t = text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1'); // link syntax to label
  t = t.replace(/[*_`~]/g, '');                          // emphasis markers
  t = t.trim().toLowerCase();
  t = t.replace(/[^\p{L}\p{N}\p{M}\- _]/gu, '');
  return t.replace(/ /g, '-');
}

function parse(file) {
  const src = readFileSync(file, 'utf8');
  const lines = src.split('\n');
  const inFence = fencedLines(lines);

  const seen = new Map();
  const anchors = new Set();
  lines.forEach((line, i) => {
    if (inFence[i]) return;
    const m = line.match(/^(#{1,6})\s+(.*?)\s*#*\s*$/);
    if (!m) return;
    let s = slug(m[2]);
    if (seen.has(s)) {
      const n = seen.get(s) + 1;
      seen.set(s, n);
      s = `${s}-${n}`;
    } else {
      seen.set(s, 0);
    }
    anchors.add(s);
  });
  // Explicit HTML anchors count too.
  for (const m of src.matchAll(/<a[^>]+(?:name|id)="([^"]+)"/g)) anchors.add(m[1]);

  const links = [
    ...[...src.matchAll(/\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)]
      .map(m => ({ label: m[1], target: m[2], idx: m.index })),
    ...[...src.matchAll(/(?:href|src)="([^"]+)"/g)]
      .map(m => ({ label: '(html)', target: m[1], idx: m.index })),
  ].map(l => ({ ...l, line: src.slice(0, l.idx).split('\n').length }));

  return { src, anchors, links };
}

const files = findMarkdown(ROOT);
const parsed = new Map(files.map(f => [f, parse(f)]));
const failures = [];
let anchorCount = 0;
let pathCount = 0;

for (const [file, { anchors, links }] of parsed) {
  const rel = relative(ROOT, file);
  for (const link of links) {
    const t = link.target;
    if (/^[a-z][a-z0-9+.-]*:/i.test(t) || t.startsWith('//')) continue; // external

    const [rawPath, rawFrag] = [t.split('#')[0], t.split('#').slice(1).join('#')];
    const frag = rawFrag ? decodeURIComponent(rawFrag) : '';

    // `#/journey` is one of the app's own hash routes, not a heading anchor.
    // Documentation quotes these when describing the router, so treat any
    // fragment beginning with a slash as a route and leave it alone.
    if (!rawPath && frag.startsWith('/')) continue;

    if (!rawPath) {
      // Same-file anchor.
      anchorCount++;
      if (!anchors.has(frag)) {
        failures.push(`${rel}:${link.line}  anchor #${frag} matches no heading  [${link.label}]`);
      }
      continue;
    }

    // Relative path, optionally with an anchor into that other file.
    pathCount++;
    const target = resolve(dirname(file), decodeURIComponent(rawPath));
    if (!existsSync(target)) {
      failures.push(`${rel}:${link.line}  path does not exist: ${rawPath}`);
      continue;
    }
    if (frag && target.endsWith('.md') && statSync(target).isFile()) {
      anchorCount++;
      const other = parsed.get(target) ?? parse(target);
      if (!other.anchors.has(frag)) {
        failures.push(`${rel}:${link.line}  anchor #${frag} matches no heading in ${rawPath}`);
      }
    }
  }
}

for (const rel of NO_EM_DASH) {
  const full = join(ROOT, rel);
  if (!existsSync(full)) continue;
  // Written as an escape rather than the literal character so that grepping the
  // repository for em dashes does not match this checker itself.
  const hits = readFileSync(full, 'utf8').split('\n')
    .map((line, i) => (line.includes('\u2014') ? i + 1 : 0)).filter(Boolean);
  if (hits.length) {
    failures.push(`${rel}  ${hits.length} em dash(es) on line(s) ${hits.join(', ')}. ` +
      `Rewrite the sentence: split it in two, or use a comma or a colon.`);
  }
}

console.log(`checked ${parsed.size} markdown files: ${anchorCount} anchors, ${pathCount} relative paths`);
if (failures.length) {
  console.error(`\n${failures.length} problem(s):\n`);
  for (const f of failures) console.error('  ' + f);
  console.error('\nAnchor slugs are computed the way GitHub computes them. If one looks');
  console.error('correct but fails, read the note above slug() in this file about U+FE0F.');
  process.exit(1);
}
console.log('all links resolve, no em dashes in the prose files');
