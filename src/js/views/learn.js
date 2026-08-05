// ============ Learn: module list + lesson reader ============

import { data, moduleById, allQuestions } from '../data.js';
import { state, completeLesson } from '../state.js';
import { esc, md, confetti, toast, CELEBRATE } from '../ui.js';
import { icon } from '../icons.js';
import { glyph } from '../glyphs.js';
import { signFigure } from '../signs.js';
import { masteredCount } from '../engine/scoring.js';
import { moduleMastery, dueCount } from '../engine/progress.js';

export function render(el, ctx) {
  if (ctx.route === 'lesson' && ctx.params[0]) return renderLesson(el, ctx.params[0]);
  renderList(el);
}

function renderList(el) {
  const mods = data.modules;
  // Weakest module first, so the app answers "what should I study?" instead of
  // leaving him to guess from 11 identical cards.
  const ranked = moduleMastery(mods, state.quiz);
  const weakest = ranked.find(m => m.total > 0 && m.ratio < 0.9);
  const due = dueCount(allQuestions(), state.quiz);

  el.innerHTML = `
    <div class="spread" style="margin-bottom:18px;">
      <div style="flex:1;min-width:240px;">
        <span class="eyebrow">Leg two · the theory</span>
        <h1 style="margin:6px 0 4px;">Theory school</h1>
        <p class="muted mt0 mb0">Everything the official exam asks, in English.
        Read a lesson, then prove it on the quiz.</p>
      </div>
      <a class="btn btn-amber" href="#/practice" style="flex:0 0 auto;">${icon('target', { size: 15 })} Smart practice${due ? ` · ${due} due` : ''}</a>
    </div>
    ${weakest ? `
      <div class="card featured" style="margin-bottom:14px;">
        <span class="plate-band">Weakest ground: start here</span>
        <div class="spread">
          <div style="flex:1;min-width:200px;">
            <h3 class="mb0">${glyph(weakest.icon || '📘', { size: 18 })} ${esc(weakest.title)}</h3>
            <small class="muted">${weakest.mastered}/${weakest.total} mastered${weakest.seen === 0 ? ' · not started' : ''}</small>
          </div>
          <div class="row" style="flex:0 0 auto;gap:6px;">
            <a class="btn btn-amber small" href="#/practice/${encodeURIComponent(weakest.id)}">Practise</a>
            <a class="btn btn-ghost small" href="#/lesson/${encodeURIComponent(weakest.id)}">Read</a>
          </div>
        </div>
      </div>` : ''}
    <a class="card clickable" href="#/phrases" style="margin-bottom:14px;">
      <div class="module-top">
        <div class="module-icon" aria-hidden="true">${icon('message-square-quote', { size: 21 })}</div>
        <div style="flex:1;">
          <b>Exam German: what the examiner will say</b><br>
          <small class="muted">Your practical exam is in German only. Learn the commands, then drill them.</small>
        </div>
        <span class="pill blue">essential</span>
      </div>
    </a>
    ${!mods.length ? `<div class="card center">${icon('layers', { size: 40, cls: 'big-ico' })}
      <h3>Lessons are being prepared…</h3><p class="muted">The learning modules haven't been generated yet.</p></div>` : ''}
    <div class="grid grid-2" id="mods" style="margin-top:10px;"></div>`;

  const grid = el.querySelector('#mods');
  for (const m of mods) {
    const qs = m.questions || [];
    const mastered = masteredCount(qs, state.quiz);
    const lessonDone = !!state.lessons[m.id]?.done;
    const pct = qs.length ? Math.round((mastered / qs.length) * 100) : 0;
    const div = document.createElement('a');
    div.className = 'card clickable module-card';
    div.href = `#/lesson/${encodeURIComponent(m.id)}`;
    div.innerHTML = `
      <div class="module-top">
        <div class="module-icon" aria-hidden="true">${glyph(m.icon || '📘', { size: 21 })}</div>
        <div style="flex:1;">
          <b>${esc(m.title)}</b><br>
          <small class="de-term">${esc(m.german || '')}</small>
        </div>
        ${lessonDone ? `<span class="pill green">${icon('check', { size: 12 })} read</span>` : ''}
      </div>
      <div class="row" style="gap:8px;flex-wrap:nowrap;">
        <div class="bar" style="flex:1;min-width:40px;"><i style="width:${pct}%"></i></div>
        <small style="flex:0 0 auto;white-space:nowrap;"><b>${mastered}</b>/${qs.length} mastered</small>
      </div>
      <div class="row">
        ${m.category === 'zusatz' ? '<span class="pill purple">Class B specific</span>' : ''}
        ${m.category === 'bonus' ? '<span class="pill blue">Berlin bonus</span>' : ''}
        <span class="pill">${qs.length} questions</span>
      </div>`;
    grid.appendChild(div);
  }
}

function renderLesson(el, id) {
  const m = moduleById(id);
  if (!m) { location.hash = '#/learn'; return; }
  const l = m.lesson || {};
  const lessonDone = !!state.lessons[m.id]?.done;

  const sections = (l.sections || []).map(s => `
    <h3>${esc(s.heading)}</h3>
    ${s.sign_ids?.length ? `<div class="sign-row">${s.sign_ids.map(sid => signFigure(sid)).join('')}</div>` : ''}
    ${md(s.body)}
    ${s.callout ? `<div class="callout ${esc(s.callout.type || 'tip')}">${md(s.callout.text)}</div>` : ''}
  `).join('');

  el.innerHTML = `
    <a href="#/learn" class="muted" style="font-weight:800;">← All lessons</a>
    <div class="card" style="margin-top:10px;">
      <div class="module-top">
        <div class="module-icon" style="width:64px;height:64px;" aria-hidden="true">${glyph(m.icon || '📘', { size: 30 })}</div>
        <div>
          <h1 class="mb0">${esc(m.title)}</h1>
          <span class="de-term">${esc(m.german || '')}</span>
        </div>
      </div>
    </div>
    <div class="card lesson-body" style="margin-top:14px;">
      ${l.intro ? md(l.intro) : ''}
      ${sections}
      ${l.key_takeaways?.length ? `
        <div class="callout rule"><b>${icon('key', { size: 15 })} Key takeaways</b>
          <ul style="margin:6px 0 0;padding-left:18px;">${l.key_takeaways.map(k => `<li>${md(k).replace(/^<p>|<\/p>$/g, '')}</li>`).join('')}</ul>
        </div>` : ''}
      ${l.german_terms?.length ? `
        <h3>${icon('languages', { size: 17 })} Words you'll hear in the Fahrschule</h3>
        <div class="table-scroll">
          <table class="terms-table">${l.german_terms.map(t => `<tr><td>${esc(t.de)}</td><td>${esc(t.en)}</td></tr>`).join('')}</table>
        </div>` : ''}
    </div>
    <div class="center" style="margin-top:18px;">
      ${lessonDone
        ? `<span class="pill green" style="font-size:.95rem;padding:8px 16px;">${icon('check', { size: 14 })} Lesson completed</span>`
        : `<button class="btn btn-primary" id="complete-btn">${icon('check', { size: 15 })} Finish lesson · +50 XP</button>`}
      <a class="btn btn-amber" href="#/practice/${encodeURIComponent(m.id)}" style="margin-left:8px;">${icon('target', { size: 15 })} Quiz me on this</a>
    </div>`;

  el.querySelector('#complete-btn')?.addEventListener('click', () => {
    if (completeLesson(m.id)) {
      if (data.modules.every(mod => state.lessons[mod.id]?.done)) {
        import('../state.js').then(s => s.award('bookworm'));
      }
      confetti(CELEBRATE.medium);
      toast('Lesson complete. Now prove it on the quiz', { emoji: '📚' });

    }
    renderLesson(el, id);
  });
}
