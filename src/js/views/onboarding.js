// ============ Onboarding: which licence do you hold, and since when do you live here ============

import { state, save } from '../state.js';
import { esc, confetti } from '../ui.js';
import { isoDay } from '../engine/deadline.js';
import { emblem, flag } from '../brand.js';

const PATHS = [
  {
    id: 'convert', flag: 'ar', title: 'I have a non-EU licence (e.g. Argentina)',
    body: 'Your licence counts here only for a limited time after you move in. We\'ll track that legal ' +
          'deadline for you and walk you through converting it (Umschreibung), which is usually far less work than starting over.',
    recommended: true,
  },
  {
    id: 'eu', flag: 'it', title: 'I have a licence from an EU/EEA country',
    body: 'Good news: it stays valid in Germany with no exams. We\'ll cover the optional exchange and the few cases where it becomes mandatory.',
  },
  {
    id: 'new', flag: 'de', title: 'I have no driving licence at all',
    body: 'The full quest: paperwork → theory → practical, with a driving school. We train you for both exams in English.',
  },
];

export function render(el) {
  el.innerHTML = `
    <div class="onboard">
      <div class="card hero center">
        ${emblem({ size: 54 })}
        <h1>Führerschein Hero</h1>
        <p>Your gamified, English-language guide to driving legally in Berlin,
        built for people who'd rather not decode German bureaucracy alone.</p>
      </div>

      <div class="card" style="margin-top:16px;">
        <h2>Which licence do you hold today?</h2>
        <div class="path-choice">
          ${PATHS.map(p => `
            <button type="button" class="card flat clickable" data-path="${p.id}">
              <h3>${flag(p.flag, { width: 22 })} ${esc(p.title)} ${p.recommended ? '<span class="pill amber">most likely you</span>' : ''}</h3>
              <p class="mb0 muted">${esc(p.body)}</p>
            </button>`).join('')}
        </div>
      </div>

      <div class="card" style="margin-top:14px;">
        <h3>A couple of details</h3>
        <p class="muted mt0" style="font-size:.9rem;">Everything stays in your browser. Nothing is uploaded anywhere.</p>
        <label for="name-input" style="font-weight:800;">What should we call you? <small class="muted">(optional)</small></label>
        <input id="name-input" class="glossary-search" style="margin-top:6px;" maxlength="30"
          placeholder="Your name" value="${esc(state.profile.name || '')}">

        <label for="res-input" style="font-weight:800;">When did you register your Berlin address (Anmeldung)?</label>
        <p class="muted" style="margin:.2em 0 .5em;font-size:.88rem;">
          This starts the legal clock on a non-EU licence, so we can warn you before it runs out.
          Approximate is fine. You can change it later.</p>
        <input id="res-input" type="date" class="glossary-search" max="${isoDay(new Date())}"
          value="${esc(state.profile.residenceSince || '')}">

        <label for="licence-input" style="font-weight:800;">Which country issued your licence? <small class="muted">(optional)</small></label>
        <input id="licence-input" class="glossary-search" style="margin-top:6px;" maxlength="40"
          placeholder="e.g. Argentina" value="${esc(state.profile.licenceCountry || '')}">
      </div>
      <p class="center muted" style="font-size:.85rem;margin-top:12px;">
        Pick a path above to start. This app is a study and planning aid, not legal advice, so
        always confirm your own case with the Berlin licensing authority.</p>
    </div>`;

  el.querySelectorAll('[data-path]').forEach(cardEl => {
    cardEl.addEventListener('click', () => {
      state.profile.path = cardEl.dataset.path;
      state.profile.name = el.querySelector('#name-input').value.trim();
      state.profile.residenceSince = el.querySelector('#res-input').value || '';
      state.profile.licenceCountry = el.querySelector('#licence-input').value.trim();
      state.profile.startedAt = state.profile.startedAt || Date.now();
      save();
      confetti(90);
      location.hash = '#/journey';
    });
  });
}
