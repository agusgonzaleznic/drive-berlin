// ============ Mock exam: full simulation of the official theory exam ============

import { allQuestions, data } from '../data.js';
import { state, recordExam, recordAnswer } from '../state.js';
import { examReadiness } from '../engine/progress.js';
import { esc, md, confetti, CELEBRATE, toast } from '../ui.js';
import { signSvg } from '../signs.js';
import { composeExam, scoreExam, EXAM_RULES } from '../engine/scoring.js';
import { icon } from '../icons.js';
import { safeUrl } from '../security.js';

// ---------- crash-safe exam session ----------
// A 30-question attempt used to live only in memory, so an accidental refresh,
// a backgrounded tab or a pull-to-refresh threw the whole thing away.
const SESSION_KEY = 'gds-exam-session-v1';
const SESSION_MAX_AGE = 6 * 3600e3;

function saveSession(s) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      ids: s.questions.map(q => q.id), answers: s.answers, idx: s.idx, startedAt: s.startedAt,
    }));
  } catch { /* storage full or blocked, and the exam still works in memory */ }
}
function clearSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
}
function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (!d?.ids?.length || Date.now() - (d.startedAt || 0) > SESSION_MAX_AGE) { clearSession(); return null; }
    const byId = new Map(allQuestions().map(q => [q.id, q]));
    const questions = d.ids.map(id => byId.get(id));
    if (questions.some(q => !q)) { clearSession(); return null; } // bank changed under us
    return { questions, answers: d.answers || {}, idx: d.idx || 0, startedAt: d.startedAt || Date.now() };
  } catch { clearSession(); return null; }
}

export function render(el) {
  const pool = allQuestions();
  const attempts = state.exams.length;
  const passed = state.exams.filter(e => e.passed).length;
  const best = state.exams.length ? Math.min(...state.exams.map(e => e.errorPoints)) : null;
  const resumable = loadSession();
  const langs = data.rules?.exam?.languages || [];
  const myLangs = ['English', 'Spanish', 'Italian'].filter(l => langs.includes(l));

  el.innerHTML = `
    <div class="card hero">
      <h1>${icon('clipboard-check', { size: 22 })} Mock theory exam</h1>
      <p>Exactly like the real thing: <b>30 questions</b> (20 general + 10 class B),
      each worth 2–5 error points. You pass with <b>max ${EXAM_RULES.maxErrorPoints} error points</b>,
      but two wrong 5-point questions mean an automatic fail, just like at DEKRA.</p>
      ${resumable ? `
        <button class="btn btn-primary" id="resume-btn" style="font-size:1.05rem;">
          ${icon('corner-up-left', { size: 15 })} Resume exam · ${Object.keys(resumable.answers).length}/${resumable.questions.length} answered
        </button>
        <button class="btn btn-ghost small" id="discard-btn" style="margin-left:8px;">Discard it</button>`
      : `
        <button class="btn btn-amber" id="start-btn" ${pool.length < 10 ? 'disabled' : ''} style="font-size:1.05rem;">
          ${icon('flag-triangle-right', { size: 15 })} Start exam
        </button>`}
      ${pool.length < 10 ? '<p><small class="muted">Question bank is still being generated…</small></p>' : ''}
    </div>

    ${myLangs.length ? `<div class="callout tip" style="margin-top:14px;">
      <b>Remember: you may sit the real exam in ${myLangs.join(', ')}.</b>
      That is your legal right under FeV Anlage 7 Nr. 1.3, at no extra cost. Tell your
      driving school which language you want when they book it. Only the practical exam is German-only.
    </div>` : ''}

    ${readinessCard()}

    <div class="callout warning">
      <b>These are practice questions, not the official catalogue.</b> They are written in the official
      style and scored by the official rules, but the real class B catalogue holds around a thousand
      questions. Passing here means you have the rules down. It is not a guarantee.
    </div>
    <div class="grid grid-3" style="margin-top:14px;">
      <div class="card tile"><div class="t-num">${attempts}</div><div class="t-label">attempts</div></div>
      <div class="card tile"><div class="t-num">${passed}</div><div class="t-label">passed</div></div>
      <div class="card tile"><div class="t-num">${best ?? 'n/a'}</div><div class="t-label">best (error pts)</div></div>
    </div>
    ${state.exams.length ? `
    <div class="card" style="margin-top:14px;">
      <h3>Past attempts</h3>
      ${[...state.exams].reverse().slice(0, 8).map(e => `
        <div class="poi-item">
          <div><b>${icon(e.passed ? 'circle-check' : 'circle-alert', { size: 14 })} ${e.passed ? 'Passed' : 'Failed'}</b>
            <small class="muted"> · ${new Date(e.date).toLocaleDateString('en-GB')}</small></div>
          <div><span class="pill ${e.passed ? 'green' : 'red'}">${e.errorPoints} error pts</span></div>
        </div>`).join('')}
    </div>` : ''}`;

  el.querySelector('#start-btn')?.addEventListener('click', () => {
    const questions = composeExam(pool);
    const s = { questions, answers: {}, idx: 0, startedAt: Date.now() };
    saveSession(s);
    startExam(el, s);
  });
  el.querySelector('#resume-btn')?.addEventListener('click', () => startExam(el, resumable));
  el.querySelector('#discard-btn')?.addEventListener('click', () => {
    clearSession();
    toast('Unfinished exam discarded');
    render(el);
  });
}

/** The answer to "am I ready to book the real exam?", from existing data only. */
function readinessCard() {
  const pool = allQuestions();
  if (!pool.length) return '';
  const r = examReadiness(pool, state.quiz, state.exams, {
    lessonsDone: data.modules.filter(m => state.lessons[m.id]?.done).length,
    lessonsTotal: data.modules.length,
  });
  const tone = { ready: 'green', nearly: 'amber', building: 'blue', early: 'blue' }[r.band];
  // Text colours must come from the bright family; the *-dark tokens are button
  // fills and would sink into the dark surface.
  const ink = { ready: 'var(--primary)', nearly: 'var(--gold)', building: 'var(--blue)', early: 'var(--dim)' }[r.band];
  const pct = Math.round(r.score * 100);
  const bar = (label, v) => `
    <div style="margin:6px 0;">
      <div class="spread" style="gap:8px;"><small><b>${label}</b></small><small class="muted">${Math.round(v * 100)}%</small></div>
      <div class="bar" style="height:7px;"><i style="width:${Math.round(v * 100)}%"></i></div>
    </div>`;

  return `
    <div class="card" style="margin-top:14px;">
      <div class="spread">
        <div>
          <h3 class="mb0" style="color:${ink};">${icon('target', { size: 18 })} Exam readiness: ${esc(r.label)}</h3>
          <small class="muted">Based on what you have mastered, read and scored in mock exams.</small>
        </div>
        <span class="pill ${tone}" style="font-size:1rem;padding:6px 14px;">${pct}%</span>
      </div>
      <div style="margin-top:10px;">
        ${bar('Questions mastered', r.components.mastery)}
        ${bar('Lessons read', r.components.coverage)}
        ${bar('Mock exam record', r.components.exams)}
      </div>
      ${r.band === 'ready'
        ? `<div class="callout tip" style="margin-bottom:0;">You are scoring consistently under the limit.
            ${r.exams.avgErrors != null ? `Your last ${r.exams.attempts} mocks averaged <b>${r.exams.avgErrors.toFixed(1)} error points</b> against a limit of ${EXAM_RULES.maxErrorPoints}.` : ''}
            Talk to your driving school about booking the real one.</div>`
        : `<div class="callout rule" style="margin-bottom:0;"><b>Next best move:</b> ${esc(r.nextAction.action)}.
            <a href="${esc(safeUrl(r.nextAction.route))}">Go there →</a></div>`}
    </div>`;
}

function startExam(el, s) {
  renderExamQ(el, s);
}

function renderExamQ(el, s) {
  const q = s.questions[s.idx];
  const answer = s.answers[s.idx];
  const selected = new Set(Array.isArray(answer) ? answer : []);
  const multi = (q.options || []).filter(o => o.correct).length > 1;
  const answeredCount = Object.keys(s.answers).length;
  const mins = Math.floor((Date.now() - s.startedAt) / 60000);

  el.innerHTML = `
    <div class="spread">
      <b>Question ${s.idx + 1} / ${s.questions.length}</b>
      <span class="pill">⏱️ ${mins} min</span>
    </div>
    <div class="exam-grid">
      ${s.questions.map((_, i) => `
        <button data-nav="${i}" class="${[
          i === s.idx ? 'current' : '',
          s.answers[i] !== undefined ? 'answered' : '',
        ].filter(Boolean).join(' ')}" aria-label="Question ${i + 1}${s.answers[i] !== undefined ? ', answered' : ', not answered'}${i === s.idx ? ', current' : ''}">${i + 1}</button>`).join('')}
    </div>
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
          <label class="sr-only" for="num-input">Your answer${q.unit ? ' in ' + esc(q.unit) : ''}</label>
          <!-- esc() because this value is a STRING, not a number: commit() below
               stores numInput.value verbatim and loadSession() reads it back out
               of localStorage without coercing it. A type=number input cannot
               produce a quote today, so this is not a live hole, but it is the
               one attribute in the app interpolating an unvalidated stored
               string, and an unescaped quote here would break out of value="". -->
          <input type="number" inputmode="decimal" step="any" id="num-input" value="${esc(answer ?? '')}" placeholder="?" autocomplete="off">
          <b>${esc(q.unit || '')}</b>
        </div>` : `
        <div class="options">
          ${q.options.map((o, i) => `
            <button class="option ${selected.has(i) ? 'selected' : ''}" data-i="${i}">
              <span class="box">${selected.has(i) ? '✓' : ''}</span><span>${esc(o.text)}</span></button>`).join('')}
        </div>`}
      <div class="spread" style="margin-top:10px;">
        <button class="btn btn-ghost small" id="prev-btn" ${s.idx === 0 ? 'disabled' : ''}>← Prev</button>
        <span class="muted" id="answered-count"><b>${answeredCount}</b>/${s.questions.length} answered</span>
        ${s.idx < s.questions.length - 1
          ? '<button class="btn btn-ghost small" id="next-btn">Next →</button>'
          : '<span></span>'}
      </div>
      <div class="center" style="margin-top:14px;">
        <button class="btn btn-primary" id="submit-btn">${icon('flag-triangle-right', { size: 15 })} Submit exam</button>
      </div>
    </div>`;

  const commit = () => {
    const numInput = el.querySelector('#num-input');
    if (q.type === 'number') {
      if (numInput.value !== '') s.answers[s.idx] = numInput.value; else delete s.answers[s.idx];
    } else if (selected.size) {
      s.answers[s.idx] = [...selected];
    } else {
      delete s.answers[s.idx];
    }
    saveSession(s);
  };

  // Typing a number used to leave the grid cell and the counter stale until the
  // user navigated away. Patch them in place rather than re-rendering, which
  // would steal focus from the input on every keystroke.
  const refreshAnswered = () => {
    const n = Object.keys(s.answers).length;
    const counter = el.querySelector('#answered-count');
    if (counter) counter.innerHTML = `<b>${n}</b>/${s.questions.length} answered`;
    const cell = el.querySelector(`[data-nav="${s.idx}"]`);
    if (cell) cell.classList.toggle('answered', s.answers[s.idx] !== undefined);
  };

  el.querySelectorAll('.option').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = Number(btn.dataset.i);
      if (selected.has(i)) selected.delete(i); else selected.add(i);
      commit();
      renderExamQ(el, s);
    });
  });
  el.querySelector('#num-input')?.addEventListener('input', () => { commit(); refreshAnswered(); });
  el.querySelectorAll('[data-nav]').forEach(b =>
    b.addEventListener('click', () => { commit(); s.idx = Number(b.dataset.nav); renderExamQ(el, s); }));
  el.querySelector('#prev-btn')?.addEventListener('click', () => { commit(); s.idx--; renderExamQ(el, s); });
  el.querySelector('#next-btn')?.addEventListener('click', () => { commit(); s.idx++; renderExamQ(el, s); });
  el.querySelector('#submit-btn').addEventListener('click', () => {
    commit();
    const unanswered = s.questions.length - Object.keys(s.answers).length;
    if (unanswered > 0 && !confirm(`${unanswered} question(s) unanswered. They count as wrong. Submit anyway?`)) return;
    finish(el, s);
  });
}

function finish(el, s) {
  const score = scoreExam(s.questions, s.answers);
  // Feed results into spaced repetition too
  score.results.forEach(r => recordAnswer(s.questions[r.index].id, r.correct));
  recordExam({
    date: Date.now(), errorPoints: score.errorPoints, fiveWrong: score.fiveWrong,
    passed: score.passed, total: s.questions.length,
  });
  clearSession();
  if (score.passed) confetti(CELEBRATE.huge);

  // Group the misses by module so a failure ends with "study exactly this",
  // not a 30-item scroll with no next action.
  const missesByModule = new Map();
  for (const r of score.results.filter(x => !x.correct)) {
    const q = s.questions[r.index];
    const key = q.moduleId || 'other';
    const entry = missesByModule.get(key) || { title: q.moduleTitle || 'Other', count: 0, points: 0 };
    entry.count++; entry.points += q.points || 0;
    missesByModule.set(key, entry);
  }
  const weakest = [...missesByModule.entries()].sort((a, b) => b[1].points - a[1].points);

  const failedByFives = !score.passed && score.errorPoints <= EXAM_RULES.maxErrorPoints;
  el.innerHTML = `
    <div class="card result-banner ${score.passed ? '' : ''}">
      ${icon(score.passed ? 'trophy' : 'octagon-alert', { size: 44, cls: 'big-ico' })}
      <h1>${score.passed ? 'BESTANDEN: Passed!' : 'Not this time'}</h1>
      <div class="score" style="color:${score.passed ? 'var(--primary)' : 'var(--red)'};">${score.errorPoints} error points</div>
      <p class="muted">Pass limit: ${EXAM_RULES.maxErrorPoints} error points.
        ${failedByFives ? '<b>You failed on the special rule: two 5-point questions wrong.</b>' : ''}
        ${score.fiveWrong ? ` (${score.fiveWrong} five-point question${score.fiveWrong > 1 ? 's' : ''} wrong)` : ''}</p>
      <div class="row" style="justify-content:center;">
        <button class="btn btn-primary" id="again-btn">${icon('repeat-2', { size: 15 })} New exam</button>
        <a class="btn btn-ghost" href="#/learn">${icon('book-open', { size: 15 })} Review lessons</a>
      </div>
    </div>
    ${weakest.length ? `
    <div class="card" style="margin-top:14px;">
      <h3>${icon('book-open', { size: 17 })} Where you lost the points</h3>
      <p class="muted mt0">Practise the topic that cost you most. That is the fastest way to move your score.</p>

      ${weakest.map(([id, m]) => `
        <div class="poi-item">
          <div><b>${esc(m.title)}</b><br><small class="muted">${m.count} wrong · ${m.points} error points</small></div>
          <div style="flex:0 0 auto;">
            <a class="btn btn-amber small" href="#/practice/${encodeURIComponent(id)}">Practise</a>
            <a class="btn btn-ghost small" href="#/lesson/${encodeURIComponent(id)}">Re-read</a>
          </div>
        </div>`).join('')}
    </div>` : ''}
    <div class="card" style="margin-top:14px;">
      <h3>Review your answers</h3>
      <div id="review"></div>
    </div>`;

  const review = el.querySelector('#review');
  score.results.forEach(r => {
    const q = s.questions[r.index];
    const div = document.createElement('div');
    div.className = 'poi-item';
    div.style.flexDirection = 'column';
    div.style.alignItems = 'stretch';
    div.innerHTML = `
      <div class="spread">
        <b>${icon(r.correct ? 'circle-check' : 'circle-alert', { size: 14 })} Q${r.index + 1}. ${esc(q.text)}</b>
        <span class="pill ${r.correct ? 'green' : 'red'}" style="flex:0 0 auto;">${q.points} pts</span>
      </div>
      ${!r.correct ? `<div class="callout rule" style="margin-top:8px;">
        ${q.type === 'number' ? `<b>Correct: ${q.answer_number} ${esc(q.unit || '')}</b><br>` :
          `<b>Correct: ${q.options.filter(o => o.correct).map(o => esc(o.text)).join(' · ')}</b><br>`}
        ${md(q.explanation || '')}${q.rule_ref ? `<small class="muted">${icon('scroll-text', { size: 12 })} ${esc(q.rule_ref)}</small>` : ''}
      </div>` : ''}`;
    review.appendChild(div);
  });
  el.querySelector('#again-btn').addEventListener('click', () => render(el));
  window.scrollTo({ top: 0 });
}
