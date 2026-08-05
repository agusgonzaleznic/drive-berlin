// ============ Progress: tiles, badges, settings (export/import/reset) ============

import { data, allQuestions, allTasks } from '../data.js';
import { state, BADGES, levelInfo, exportState, importState, resetAll, save, streakStatus } from '../state.js';
import { esc, toast, openModal } from '../ui.js';
import { masteredCount } from '../engine/scoring.js';
import { icon } from '../icons.js';
import { glyph } from '../glyphs.js';

/**
 * Progress toward a locked badge, so a grey square says "2 lessons to go"
 * rather than nothing at all. Returns null for badges gated on a real-world
 * task, where a bar would be meaningless.
 */
function badgeProgress(id, { mastered, lessonsDone, examsPassed }) {
  const totalQ = allQuestions().length;
  const totalM = data.modules.length;
  const of = (have, need, noun) => ({
    pct: need ? Math.min(1, have / need) : 0,
    label: `${Math.min(have, need)}/${need} ${noun}`,
  });
  switch (id) {
    case 'sharp-shooter': return of(state.counters.correct, 50, 'correct');
    case 'question-slayer': return of(state.counters.correct, 200, 'correct');
    case 'bookworm': return of(lessonsDone, totalM, 'lessons');
    case 'exam-ready': return of(examsPassed, 3, 'mocks passed');
    case 'streak-7': return of(streakStatus().count, 7, 'day streak');
    case 'no-fear': return of(state.exams.length, 1, 'mock started');
    case 'ignition': return of(lessonsDone, 1, 'lesson');
    case 'flawless': {
      const best = state.exams.length ? Math.min(...state.exams.map(e => e.errorPoints)) : null;
      return best == null ? null
        : { pct: Math.max(0, 1 - best / 30), label: `best ${best} error points, need 0` };

    }
    default: return null; // earned by completing a real-world task
  }
}

export function render(el) {
  const lvl = levelInfo();
  const pool = allQuestions();
  const mastered = masteredCount(pool, state.quiz);
  const tasks = allTasks(state.profile.path);
  const tasksDone = tasks.filter(t => state.tasks[t.id]?.done).length;
  const lessonsDone = data.modules.filter(m => state.lessons[m.id]?.done).length;
  const examsPassed = state.exams.filter(e => e.passed).length;
  const acc = state.counters.answered
    ? Math.round((state.counters.correct / state.counters.answered) * 100) : 0;

  el.innerHTML = `
    <div class="card hero">
      <div class="spread">
        <div>
          <h1>${icon('medal', { size: 22 })} Level ${lvl.n}: ${esc(lvl.title)}</h1>
          <p class="mt0">"${esc(lvl.en)}" · ${state.xp} XP
            ${lvl.nextXp ? ` · ${lvl.nextXp - state.xp} XP to level ${lvl.n + 1}` : ' · MAX LEVEL 🎉'}</p>
          <div class="bar amber" style="max-width:340px;background:rgba(255,255,255,.25);">
            <i style="width:${Math.round(lvl.pct * 100)}%"></i></div>
        </div>
        ${icon(lvl.n >= 10 ? 'trophy' : lvl.n >= 7 ? 'zap' : lvl.n >= 4 ? 'car-front' : 'sunrise', { size: 40, cls: 'big-ico' })}
      </div>
    </div>

    <div class="grid grid-3" style="margin-top:14px;">
      <div class="card tile"><div class="t-num">${icon('flame', { size: 20 })} ${streakStatus().count}</div><div class="t-label">day streak (best ${state.streak.best})</div></div>
      <div class="card tile"><div class="t-num">${tasksDone}/${tasks.length}</div><div class="t-label">real-world tasks</div></div>
      <div class="card tile"><div class="t-num">${lessonsDone}/${data.modules.length}</div><div class="t-label">lessons read</div></div>
      <div class="card tile"><div class="t-num">${mastered}</div><div class="t-label">questions mastered</div></div>
      <div class="card tile"><div class="t-num">${acc}%</div><div class="t-label">answer accuracy</div></div>
      <div class="card tile"><div class="t-num">${examsPassed}/${state.exams.length}</div><div class="t-label">mock exams passed</div></div>
    </div>

    <div class="card" style="margin-top:14px;">
      <h2>${icon('medal', { size: 19 })} Badges <small class="muted">(${state.badges.length}/${BADGES.length})</small></h2>
      <div class="badge-grid">
        ${BADGES.map(b => {
          const earned = state.badges.includes(b.id);
          const p = earned ? null : badgeProgress(b.id, { mastered, lessonsDone, examsPassed });
          return `
          <div class="card flat badge-card ${earned ? '' : 'locked'}">
            <span class="b-emoji" aria-hidden="true">${glyph(b.emoji, { size: 26 })}</span><b>${esc(b.name)}</b>
            <small class="muted">${esc(b.desc)}</small>
            ${p ? `<div class="badge-progress">
                <div class="bar" style="height:6px;"><i style="width:${Math.round(p.pct * 100)}%"></i></div>
                <small class="muted">${p.label}</small>
              </div>` : ''}
          </div>`;
        }).join('')}
      </div>
    </div>

    <div class="card" style="margin-top:14px;">
      <h3>${icon('wrench', { size: 17 })} Settings</h3>
      <div class="row">
        <button class="btn btn-ghost small" id="switch-path">${icon('git-fork', { size: 15 })} Change my path &amp; details</button>
        <button class="btn btn-ghost small" id="export-btn">${icon('file-text', { size: 15 })} Export progress</button>
        <button class="btn btn-ghost small" id="import-btn">${icon('arrow-right', { size: 15 })} Import progress</button>
        <button class="btn btn-danger small" id="reset-btn">${icon('x', { size: 15 })} Reset everything</button>
      </div>
    </div>`;

  el.querySelector('#switch-path').addEventListener('click', () => {
    // Send them back through onboarding; progress is keyed by task id, so nothing is lost.
    location.hash = '#/welcome';
  });

  el.querySelector('#export-btn').addEventListener('click', () => {
    const blob = new Blob([exportState()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'fuehrerschein-hero-progress.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  el.querySelector('#import-btn').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'application/json';
    input.onchange = () => {
      const f = input.files[0];
      if (!f) return;
      f.text().then(txt => {
        try { importState(txt); toast('Progress imported!', { emoji: '✅' }); render(el); }
        catch { toast('That file is not valid progress data', { emoji: '❌' }); }
      });
    };
    input.click();
  });

  el.querySelector('#reset-btn').addEventListener('click', () => {
    openModal(`
      <h3>Reset everything?</h3>
      <p class="muted">All XP, badges, task progress and quiz history will be deleted. This cannot be undone.</p>
      <div class="row">
        <button class="btn btn-danger" id="confirm-reset">Yes, wipe it</button>
        <button class="btn btn-ghost" data-close>Cancel</button>
      </div>`);
    document.getElementById('confirm-reset').addEventListener('click', () => {
      resetAll();
      location.hash = '#/welcome';
      location.reload();
    });
  });
}
