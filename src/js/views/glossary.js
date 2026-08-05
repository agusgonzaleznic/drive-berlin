// ============ Glossary: survival German for the Fahrschule ============

import { data } from '../data.js';
import { esc } from '../ui.js';
import { icon } from '../icons.js';

export function render(el) {
  el.innerHTML = `
    <h1>${icon('languages', { size: 22 })} Survival glossary</h1>
    <p class="muted mt0">The German words you'll meet at the Fahrschule, the exam and the Amt,
    so nobody can confuse you.</p>
    <input class="glossary-search" id="q" placeholder="Search… e.g. Vorfahrt" autocomplete="off">
    <div class="card" id="list"></div>`;

  const list = el.querySelector('#list');
  const input = el.querySelector('#q');
  const paint = () => {
    const q = input.value.trim().toLowerCase();
    const items = data.glossary.filter(g =>
      !q || g.de.toLowerCase().includes(q) || g.en.toLowerCase().includes(q) ||
      (g.desc || '').toLowerCase().includes(q));
    list.innerHTML = items.map(g => `
      <div class="gloss-item">
        <b>${esc(g.de)}</b>: <span style="font-weight:700;">${esc(g.en)}</span>

        ${g.desc ? `<br><small class="muted">${esc(g.desc)}</small>` : ''}
      </div>`).join('') || '<p class="muted center" style="padding:20px;">No matches.</p>';
  };
  input.addEventListener('input', paint);
  paint();
}
