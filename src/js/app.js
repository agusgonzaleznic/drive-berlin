// ============ App bootstrap: router, header, global events ============

import { loadData } from './data.js';
import { state, levelInfo, streakStatus } from './state.js';
import { toast, confetti, esc, CELEBRATE } from './ui.js';
import { icon } from './icons.js';
import { emblem } from './brand.js';

import * as journey from './views/journey.js';
import * as task from './views/task.js';
import * as learn from './views/learn.js';
import * as quiz from './views/quiz.js';
import * as exam from './views/exam.js';
import * as stats from './views/stats.js';
import * as glossary from './views/glossary.js';
import * as mapview from './views/mapview.js';
import * as onboarding from './views/onboarding.js';
import * as phrases from './views/phrases.js';

const routes = {
  journey, task, learn, lesson: learn, practice: quiz,
  exam, stats, glossary, map: mapview, welcome: onboarding, phrases,
};

function parseHash() {
  const parts = location.hash.replace(/^#\/?/, '').split('/');
  return { route: parts[0] || 'journey', params: parts.slice(1).map(decodeURIComponent) };
}

// Keeps the chip narrow once XP runs into five figures.
const compactXP = n => (n >= 10000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(n));

function renderHeader() {
  const el = document.getElementById('header-stats');
  const lvl = levelInfo();
  const pct = Math.round(lvl.pct * 100);
  // streakStatus() decays a lapsed streak; state.streak.count alone would keep
  // claiming a streak the user has already lost.
  const streak = streakStatus();
  el.innerHTML = `
    <span class="stat-chip streak" title="${streak.count ? `${streak.count}-day study streak (best ${streak.best})` : `No active streak (best ${streak.best})`
}">
      ${icon('flame', { size: 14, cls: 'emoji' })}${streak.count}<span class="sr-only"> day streak</span></span>
    <span class="stat-chip xp" title="${state.xp} XP${lvl.nextXp ? ` · ${lvl.nextXp - state.xp} XP to level ${lvl.n + 1}` : ''}">
      ${icon('star', { size: 14, cls: 'emoji' })}${compactXP(state.xp)}<span class="chip-unit"> XP</span>
      <span class="xp-mini-bar" aria-hidden="true"><i style="width:${pct}%"></i></span>
    </span>
    <span class="stat-chip level" title="Level ${lvl.n}: ${esc(lvl.title)} (${esc(lvl.en)})">
      ${icon('medal', { size: 14, cls: 'emoji' })}Lv ${lvl.n}</span>`;
}

let firstRender = true;
let lastRoute = null;
// Returning from a task to a 14-item journey used to dump him back at the top.
const scrollMemory = new Map();

function render() {
  const { route, params } = parseHash();
  if (lastRoute) scrollMemory.set(lastRoute, window.scrollY);
  if (!state.profile.path && route !== 'welcome') {
    location.hash = '#/welcome';
    return;
  }
  const view = routes[route] || journey;
  const main = document.getElementById('view');
  main.innerHTML = '';
  view.render(main, { route, params });
  // Move focus into the new view so keyboard and screen-reader users land in the
  // content they just navigated to instead of staying stranded in the tab bar.
  if (!firstRender) main.focus({ preventScroll: true });
  firstRender = false;
  lastRoute = route;
  document.querySelectorAll('#tabs a').forEach(a => {
    const r = a.dataset.route;
    const active = r === route ||
      (r === 'journey' && route === 'task') ||
      (r === 'learn' && ['lesson', 'practice', 'phrases'].includes(route));
    a.classList.toggle('active', active);
  });
  // Restore where they were on list-style screens; start at the top elsewhere.
  const remembered = ['journey', 'learn', 'glossary', 'map'].includes(route)
    ? (scrollMemory.get(route) || 0) : 0;
  window.scrollTo({ top: remembered });
  renderHeader();
}

// Global gamification feedback
document.addEventListener('gds:xp', e => {
  if (e.detail.n >= 40) toast(`+${e.detail.n} XP`, { emoji: '⭐', ms: 1800 });
});
document.addEventListener('gds:levelup', e => {
  confetti(CELEBRATE.large);
  toast(`Level ${e.detail.level.n}: ${e.detail.level.title} (${e.detail.level.en})!`, { emoji: '🏅', ms: 4200 });
});
document.addEventListener('gds:badge', e => {
  confetti(CELEBRATE.large);
  toast(`Badge earned: ${e.detail.badge.name}!`, { emoji: e.detail.badge.emoji, ms: 4200 });
});
document.addEventListener('gds:state', renderHeader);
window.addEventListener('hashchange', render);

// The emblem and tab icons live as empty placeholders in the HTML so the markup
// stays free of inline SVG; they are filled once, at boot.
function mountChrome() {
  const mark = document.getElementById('brand-mark');
  if (mark) mark.innerHTML = emblem({ size: 30 });
  document.querySelectorAll('.tab-ico[data-icon]').forEach(el => {
    el.innerHTML = icon(el.dataset.icon, { size: 19 });
  });
}

loadData().then(() => {
  mountChrome();
  if (!location.hash) location.hash = state.profile.path ? '#/journey' : '#/welcome';
  render();
});
