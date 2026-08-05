// ============ UI helpers: escaping, mini-markdown, toast, modal, confetti ============

import { glyph } from './glyphs.js';

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// Tiny markdown: paragraphs, **bold**, *italic*, `code`, "- " lists.
export function md(text) {
  if (!text) return '';
  const inline = s => esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
  return String(text).split(/\n{2,}/).map(block => {
    const lines = block.split('\n');
    if (lines.every(l => /^\s*-\s+/.test(l))) {
      return '<ul>' + lines.map(l => `<li>${inline(l.replace(/^\s*-\s+/, ''))}</li>`).join('') + '</ul>';
    }
    return `<p>${lines.map(inline).join('<br>')}</p>`;
  }).join('');
}

// ---------- toast ----------
// Queued, not replaced: finishing a lesson can fire "lesson complete", "badge
// earned" and "level up" in the same tick, and the old implementation deleted the
// first two before they were ever read.
const toastQueue = [];
let toastShowing = false;

function nextToast() {
  const root = document.getElementById('toast-root');
  if (!root) return;
  if (!toastQueue.length) { toastShowing = false; return; }
  toastShowing = true;
  const { msg, emoji, ms } = toastQueue.shift();
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `${emoji ? glyph(emoji, { size: 16 }) : ''}<span>${esc(msg)}</span>`;
  root.appendChild(el);
  setTimeout(() => {
    el.classList.add('leaving');
    setTimeout(() => { el.remove(); nextToast(); }, 320);
  }, ms);
}

export function toast(msg, { emoji = '', ms = 2600 } = {}) {
  // Collapse exact duplicates so a burst cannot spam the same line.
  if (!toastQueue.some(t => t.msg === msg)) toastQueue.push({ msg, emoji, ms });
  if (!toastShowing) nextToast();
}

// ---------- modal ----------
export function openModal(html, { onClose } = {}) {
  const root = document.getElementById('modal-root');
  root.innerHTML = `<div class="modal-backdrop"><div class="modal-card">${html}</div></div>`;
  const backdrop = root.firstElementChild;
  const close = () => { root.innerHTML = ''; onClose && onClose(); };
  backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
  root.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', close));
  return close;
}
export function closeModal() { document.getElementById('modal-root').innerHTML = ''; }

// ---------- confetti ----------
export const prefersReducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

// A celebration hierarchy, so the big moments actually feel bigger. Every call
// site previously fired the same full-screen burst, which made reading a lesson
// feel identical to passing an exam.
export const CELEBRATE = {
  small: 0,    // no confetti, because a toast is enough (a single correct answer, a step)
  medium: 70,  // lesson finished, task completed
  large: 140,  // badge earned, level up
  huge: 240,   // mock exam passed, licence obtained
};

let confettiRunning = false;
export function confetti(count = 160) {
  // A CSS media query cannot stop a canvas animation, so check it here too.
  if (prefersReducedMotion() || count <= 0) return;
  const canvas = document.getElementById('confetti');
  if (!canvas || confettiRunning) return;
  confettiRunning = true;
  const ctx = canvas.getContext('2d');
  canvas.width = innerWidth; canvas.height = innerHeight;
  // Warm, signage-forward confetti so it reads against the dark ground.
  const colors = ['#e0a82e', '#f5d98a', '#4ade80', '#7cb0ff', '#ff7b7e', '#ffce00'];
  const parts = Array.from({ length: count }, () => ({
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * canvas.height * 0.4,
    w: 6 + Math.random() * 6, h: 8 + Math.random() * 8,
    vy: 2.2 + Math.random() * 3.4, vx: -1.6 + Math.random() * 3.2,
    rot: Math.random() * Math.PI, vr: -0.12 + Math.random() * 0.24,
    color: colors[(Math.random() * colors.length) | 0]
  }));
  const t0 = performance.now();
  (function frame(t) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of parts) {
      p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.vy += 0.03;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.color; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (t - t0 < 2800) requestAnimationFrame(frame);
    else { ctx.clearRect(0, 0, canvas.width, canvas.height); confettiRunning = false; }
  })(t0);
}

// ---------- progress ring ----------
// `textColor`/`trackColor` are overridable because the ring sits on several
// surfaces; the defaults suit a plate on the dark ground.
export function ring(pct, {
  size = 72, stroke = 9, color = 'var(--gold)', label = '',
  textColor = 'var(--ink)', trackColor = '#252b3b',
} = {}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.min(1, Math.max(0, pct)));
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${esc(label)}">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${trackColor}" stroke-width="${stroke}"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}"
      stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${off}"
      transform="rotate(-90 ${size / 2} ${size / 2})"/>
    <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle"
      font-weight="900" font-size="${size / 4.4}" fill="${textColor}">${esc(label || Math.round(pct * 100) + '%')}</text>
  </svg>`;
}

// ---------- misc ----------
export function eur(v) { return v == null ? 'n/a' : `€${v}`; }

export function plural(n, one, many) { return n === 1 ? `${n} ${one}` : `${n} ${many || one + 's'}`; }
export function gmapsLink(query) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
