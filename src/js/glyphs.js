// ============ Glyphs: one place that turns meaning into a mark ============
//
// The data files (journey.json, modules, badges, phrases) each carry an emoji as a
// compact semantic key. Rather than rewrite every one of them, this module maps
// those keys onto real line icons. Emoji were doing three jobs badly: they render
// differently on every platform, they read as juvenile at this size, and screen
// readers announce them as words ("party popper Every waypoint cleared").
//
// Anything unmapped falls through to the original character, so adding a new emoji
// to the data degrades to the emoji instead of vanishing.

import { icon, hasIcon } from './icons.js';
import { esc } from './ui.js';

const MAP = {
  // navigation / structure
  '🗺️': 'route', '🗺': 'route', '📚': 'book-open', '📝': 'clipboard-check',
  '📍': 'map-pin', '🏆': 'trophy', '🇩🇪': 'languages', '🛣️': 'milestone', '🛣': 'milestone',

  // journey phases and tasks
  '⚖️': 'scale', '⚖': 'scale', '⏳': 'hourglass', '📜': 'scroll-text',
  '⛑️': 'heart-pulse', '⛑': 'heart-pulse', '🏫': 'graduation-cap',
  '🏛️': 'landmark', '🏛': 'landmark', '⏱️': 'clock', '⏱': 'clock',
  '🗣️': 'message-square-quote', '🗣': 'message-square-quote',
  '🚗': 'car-front', '🚫': 'octagon-x', '🪪': 'id-card', '📄': 'file-text',
  '🎯': 'target', '📋': 'clipboard-check', '✅': 'circle-check', '🆕': 'sunrise',
  '🇪🇺': 'landmark', '🇦🇷': 'plane-takeoff', '🎓': 'graduation-cap',

  // theory modules
  '🪧': 'signpost-big', '🚦': 'traffic-cone', '🏎️': 'gauge', '🏎': 'gauge',
  '🔄': 'repeat-2', '🚶': 'footprints', '🌙': 'moon', '🅿️': 'square-parking',
  '🅿': 'square-parking', '🔧': 'wrench', '🐻': 'landmark', '📘': 'book-marked',

  // badges
  '🔑': 'key', '👁️': 'eye', '👁': 'eye', '📸': 'camera', '🧠': 'brain',
  '🗝️': 'key', '🗝': 'key', '⚔️': 'swords', '⚔': 'swords',
  '🎬': 'clapperboard', '💎': 'gem', '🔥': 'flame', '⭐': 'star', '🏅': 'medal',
  '🪑': 'users',

  // feedback / callouts
  '💡': 'lightbulb', '⚠️': 'triangle-alert', '⚠': 'triangle-alert',
  '🚨': 'siren', '🎉': 'trophy', '💪': 'zap', '🌱': 'sunrise',
  '❌': 'circle-alert', '✓': 'check', '🏁': 'flag-triangle-right',
  '🧭': 'compass', '▶': 'chevron-right', '↩️': 'corner-up-left',
  '🗑️': 'x', '🗑': 'x', '💾': 'file-text', '📥': 'file-text', '🔀': 'git-fork',
  '⚙️': 'wrench', '⚙': 'wrench', '🎖️': 'medal', '🎖': 'medal',
  '💶': 'banknote', '📅': 'calendar-clock', '🚧': 'traffic-cone', '📦': 'layers',
  '🙈': 'eye', '🎧': 'message-square-quote', '👑': 'trophy', '🚀': 'zap',
  '📌': 'map-pin', '↗': 'arrow-right', '→': 'arrow-right',
};

/**
 * Render a data glyph as an icon. Falls back to the raw character when unmapped,
 * always aria-hidden unless a label is given, because these sit beside real text.
 */
export function glyph(ch, opts = {}) {
  const name = MAP[ch];
  if (name && hasIcon(name)) return icon(name, opts);
  // Unmapped: keep the character but hide it from assistive tech so it is not
  // read out as a word next to the label it decorates.
  // Escaped: this is a rendering primitive, so it must be safe even if a data
  // file one day carries something other than an emoji here.
  return ch ? `<span aria-hidden="true">${esc(ch)}</span>` : '';
}

/** The icon name for a glyph, or null — for callers that need the name itself. */
export const glyphIcon = ch => MAP[ch] || null;
