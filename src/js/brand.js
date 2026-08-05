// ============ Brand marks ============
// Original artwork, drawn for this project — no third-party logo is used anywhere,
// which keeps the emblem free of any licensing question.
//
// The emblem is a German sign plate seen head-on: rounded plate, gold rule, and a
// road curving away to a vanishing point. It reads at 20px as well as at 200px.

/** Attribute-safe escaping; a partial quote-only replace is not enough. */
const escAttr = v => String(v ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function emblem({ size = 30, label = 'Führerschein Hero' } = {}) {
  return `<svg class="emblem" width="${size}" height="${size}" viewBox="0 0 32 32"
    role="img" aria-label="${escAttr(label)}">
    <defs>
      <linearGradient id="em-plate" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#2b3247"/>
        <stop offset="1" stop-color="#171b28"/>
      </linearGradient>
      <linearGradient id="em-gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#f5d98a"/>
        <stop offset="1" stop-color="#b8831c"/>
      </linearGradient>
    </defs>
    <rect x="1.6" y="1.6" width="28.8" height="28.8" rx="4"
      fill="url(#em-plate)" stroke="url(#em-gold)" stroke-width="2.2"/>
    <!-- The road, in gold: wide at the driver, narrowing toward the horizon. Bold
         enough to survive at 20px, where finer geometry turned into a smudge.
         A circle above the taper was tried first and read as a head — the mark
         became a pedestrian sign — so the horizon is a bar instead. -->
    <path d="M6.8 25.8 L12.9 12.6 h6.2 L25.2 25.8 Z" fill="url(#em-gold)"/>
    <!-- one dark centre dash: the only interior detail that survives small -->
    <path d="M14.85 24.2 h2.3 l-.75 -7.2 h-.8 Z" fill="#141821"/>
    <!-- horizon -->
    <rect x="9.2" y="8.6" width="13.6" height="2.4" rx="1.2" fill="#f5d98a"/>
  </svg>`;
}

// National flags, drawn from the published specifications. Flag designs are not
// copyrightable; these are simplified to read at 16px.
const FLAGS = {
  de: `<rect width="24" height="5.33" y="0" fill="#0b0b0b"/>
       <rect width="24" height="5.33" y="5.33" fill="#b31217"/>
       <rect width="24" height="5.34" y="10.66" fill="#f0c000"/>`,
  ar: `<rect width="24" height="5.33" y="0" fill="#74acdf"/>
       <rect width="24" height="5.33" y="5.33" fill="#ffffff"/>
       <rect width="24" height="5.34" y="10.66" fill="#74acdf"/>
       <circle cx="12" cy="8" r="2.1" fill="#f6b40e" stroke="#85340a" stroke-width=".3"/>`,
  it: `<rect width="8" height="16" x="0" fill="#008c45"/>
       <rect width="8" height="16" x="8" fill="#f4f5f0"/>
       <rect width="8" height="16" x="16" fill="#cd212a"/>`,
};

export function flag(code, { width = 20, label = '' } = {}) {
  const g = FLAGS[code];
  if (!g) return '';
  const a11y = label ? `role="img" aria-label="${escAttr(label)}"` : 'aria-hidden="true"';
  return `<svg class="flag" width="${width}" height="${(width * 16 / 24).toFixed(1)}"
    viewBox="0 0 24 16" ${a11y}>${g}</svg>`;
}
