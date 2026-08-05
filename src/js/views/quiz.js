// ============ Practice quiz: immediate feedback + spaced repetition ============

import { data, moduleById, allQuestions } from '../data.js';
import { state, recordAnswer } from '../state.js';
import { esc, md, confetti, CELEBRATE } from '../ui.js';
import { signSvg } from '../signs.js';
import { isAnswerCorrect, pickPractice } from '../engine/scoring.js';
import { icon } from '../icons.js';

const SESSION_SIZE = 10;

export function render(el, { params }) {
  const moduleId = params?.[0] || null;
  const pool = moduleId ? (moduleById(moduleId)?.questions || []) : allQuestions();
  if (!pool.length) {
    el.innerHTML = `<div class="card center">${icon('layers', { size: 40, cls: 'big-ico' })}
      <h3>No questions yet</h3><p class="muted">The question bank hasn't been generated yet.</p>
      <a class="btn btn-ghost" href="#/learn">← Back to lessons</a></div>`;
    return;
  }
  const session = {
    questions: pickPractice(pool, state.quiz, { count: Math.min(SESSION_SIZE, pool.length) }),
    idx: 0, correct: 0, xp: 0, results: [],
    title: moduleId ? moduleById(moduleId)?.title : 'Smart mix',
    moduleId,
  };
  renderQuestion(el, session);
}

export function renderQuestion(el, s) {
  if (s.idx >= s.questions.length) return renderDone(el, s);
  const q = s.questions[s.idx];
  const selected = new Set();
  const multi = (q.options || []).filter(o => o.correct).length > 1;

  el.innerHTML = `
    <div class="spread">
      <b>${esc(s.title)}</b>
      <a href="${s.moduleId ? `#/lesson/${encodeURIComponent(s.moduleId)}` : '#/learn'}" class="muted" style="font-weight:800;">${icon('x', { size: 14 })} quit</a>
    </div>
    <div class="quiz-progress">${s.questions.map((_, i) =>
      `<i class="${i < s.idx ? (s.results[i] ? 'done' : 'wrong') : (i === s.idx ? 'current' : '')}"></i>`).join('')}</div>
    <div class="card">
      <div class="q-points row">
        <span class="pill red">${q.points} error points</span>
        ${q.pool === 'zusatz' ? '<span class="pill purple">Class B</span>' : ''}
        ${multi ? '<span class="pill blue">Select all that apply</span>' : ''}
      </div>
      <div class="q-text">${esc(q.text)}</div>
      ${q.sign ? `<div class="q-sign">${signSvg(q.sign)}</div>` : ''}
      ${q.type === 'number' ? `
        <div class="num-answer">
          <input type="number" step="any" id="num-input" placeholder="?" autocomplete="off">
          <b>${esc(q.unit || '')}</b>
        </div>` : `
        <div class="options">
          ${q.options.map((o, i) => `
            <button class="option" data-i="${i}"><span class="box"></span><span>${esc(o.text)}</span></button>`).join('')}
        </div>`}
      <div class="center">
        <button class="btn btn-primary" id="check-btn" disabled>Check</button>
      </div>
      <div id="explain"></div>
    </div>`;

  const checkBtn = el.querySelector('#check-btn');
  const numInput = el.querySelector('#num-input');

  if (numInput) {
    numInput.focus();
    numInput.addEventListener('input', () => { checkBtn.disabled = numInput.value === ''; });
    numInput.addEventListener('keydown', e => { if (e.key === 'Enter' && !checkBtn.disabled) checkBtn.click(); });
  }
  el.querySelectorAll('.option').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = Number(btn.dataset.i);
      if (selected.has(i)) { selected.delete(i); btn.classList.remove('selected'); }
      else { selected.add(i); btn.classList.add('selected'); }
      checkBtn.disabled = selected.size === 0;
    });
  });

  checkBtn.addEventListener('click', () => {
    const answer = q.type === 'number' ? numInput.value : [...selected];
    const ok = isAnswerCorrect(q, answer);
    s.results.push(ok);
    if (ok) s.correct++;
    s.xp += recordAnswer(q.id, ok);

    // reveal
    el.querySelectorAll('.option').forEach(btn => {
      const i = Number(btn.dataset.i);
      btn.disabled = true;
      if (q.options[i].correct) btn.classList.add('reveal-correct');
      else if (selected.has(i)) btn.classList.add('reveal-wrong');
    });
    if (numInput) numInput.disabled = true;
    checkBtn.remove();

    el.querySelector('#explain').innerHTML = `
      <div class="explain">
        <div class="verdict">${icon(ok ? 'circle-check' : 'circle-alert', { size: 19 })} ${ok ? 'Correct!' : 'Not quite.'}</div>
        ${q.type === 'number' && !ok ? `<p><b>Correct answer: ${q.answer_number} ${esc(q.unit || '')}</b></p>` : ''}
        <div class="callout ${ok ? 'tip' : 'rule'}">${md(q.explanation || '')}
          ${q.rule_ref ? `<br><small class="muted">${icon('scroll-text', { size: 12 })} ${esc(q.rule_ref)}</small>` : ''}</div>
        <div class="center"><button class="btn btn-primary" id="next-btn">Continue →</button></div>
      </div>`;
    const nextBtn = el.querySelector('#next-btn');
    nextBtn.focus();
    nextBtn.addEventListener('click', () => { s.idx++; renderQuestion(el, s); });
  });
}

function renderDone(el, s) {
  const pct = Math.round((s.correct / s.questions.length) * 100);
  const medal = pct === 100 ? 'trophy' : pct >= 70 ? 'medal' : pct >= 40 ? 'zap' : 'sunrise';
  if (pct === 100) confetti(CELEBRATE.medium);
  // A rough round is exactly when he needs a reason to come back, so don't lead
  // with "+0 XP". Credit the work done instead.
  const reward = s.xp >= 10
    ? `<span class="pill amber" style="font-size:.95rem;">+${s.xp} XP earned</span>`
    : `<span class="pill blue" style="font-size:.95rem;">${s.questions.length} questions practised · these come back sooner</span>`;
  el.innerHTML = `
    <div class="card center result-banner">
      ${icon(medal, { size: 44, cls: 'big-ico' })}
      <div class="score">${s.correct}/${s.questions.length}</div>
      <p class="muted">${pct === 100 ? 'Perfect round!'
        : pct >= 70 ? 'Strong! Keep this pace.'
        : pct >= 40 ? 'Wrong answers come back sooner. That\'s how you learn.'

        : 'A hard round is the useful kind: every miss is now queued to return until it sticks.'}</p>
      <p>${reward}</p>
      <div class="row" style="justify-content:center;">
        <button class="btn btn-primary" id="again-btn">${icon('repeat-2', { size: 15 })} Another round</button>
        <a class="btn btn-ghost" href="#/learn">${icon('book-open', { size: 15 })} Lessons</a>
        <a class="btn btn-amber" href="#/exam">${icon('clipboard-check', { size: 15 })} Try a mock exam</a>
      </div>
    </div>`;
  // A fresh session, without a hash change (the route is already #/practice/...).
  el.querySelector('#again-btn').addEventListener('click', () => {
    render(el, { params: [s.moduleId].filter(Boolean) });
  });
}
