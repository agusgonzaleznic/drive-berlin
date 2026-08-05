// Builds src/js/icons.js from the locally stored Lucide SVGs.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const DIR = ROOT + '/src/assets/icons';

const files = readdirSync(DIR).filter(f => f.endsWith('.svg')).sort();
const paths = {};
for (const f of files) {
  const raw = readFileSync(DIR + '/' + f, 'utf8');
  const inner = raw
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>[\s\S]*$/, '')
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .trim();
  if (!inner) { console.warn('empty after strip:', f); continue; }
  paths[f.replace(/\.svg$/, '')] = inner;
}

const entries = Object.entries(paths)
  .map(([k, v]) => '  ' + JSON.stringify(k) + ': ' + JSON.stringify(v))
  .join(',\n');

const lines = [
  '// ============ Icon set ============',
  '// Lucide icons, ISC licence — see src/assets/icons/LICENSE.lucide. The original',
  '// .svg files are kept next to that licence for provenance; this module holds only',
  '// their drawing commands, so the whole set costs zero network requests and every',
  '// icon inherits currentColor from whatever it sits in.',
  '//',
  '// Regenerate after adding files: see docs/assets-provenance.md',
  '',
  'const PATHS = {',
  entries,
  '};',
  '',
  'const DEFAULTS = { size: 20, stroke: 1.75 };',
  '',
  '/**',
  ' * Inline SVG for an icon. Returns an empty string for an unknown name so a',
  ' * missing icon degrades to nothing instead of throwing mid-render.',
  ' * Pass `label` for a meaningful icon; omit it and the icon is aria-hidden.',
  ' */',
  'export function icon(name, opts = {}) {',
  '  const d = PATHS[name];',
  '  if (!d) return \'\';',
  '  const size = opts.size || DEFAULTS.size;',
  '  const stroke = opts.stroke || DEFAULTS.stroke;',
  '  const cls = opts.cls ? \' \' + opts.cls : \'\';',
  '  const a11y = opts.label',
  '    ? \'role="img" aria-label="\' + String(opts.label).replace(/"/g, \'&quot;\') + \'"\'',
  '    : \'aria-hidden="true"\';',
  '  return \'<svg class="ico\' + cls + \'" width="\' + size + \'" height="\' + size +',
  '    \'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="\' + stroke +',
  '    \'" stroke-linecap="round" stroke-linejoin="round" \' + a11y + \'>\' + d + \'</svg>\';',
  '}',
  '',
  'export const hasIcon = name => Object.prototype.hasOwnProperty.call(PATHS, name);',
  'export const iconNames = () => Object.keys(PATHS);',
  '',
].join('\n');

writeFileSync(ROOT + '/src/js/icons.js', lines);
console.log('icons.js written:', Object.keys(paths).length, 'icons,', Math.round(lines.length / 1024) + 'KB');
