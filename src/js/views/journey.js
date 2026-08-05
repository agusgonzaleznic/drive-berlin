// ============ Journey view: legal clock + gamified quest line of real-world tasks ============

import { data, phasesFor, allTasks, allQuestions, DEFAULT_PATH } from '../data.js';
import { state, save, streakStatus, daysSinceLastStudy, todayCounts } from '../state.js';
import { esc, ring } from '../ui.js';
import { glyph } from '../glyphs.js';
import { icon } from '../icons.js';
import { licenceClock, clockHeadline, fmtDate, isoDay } from '../engine/deadline.js';
import { dueCount, dailyProgress, DAILY_GOAL, examReadiness } from '../engine/progress.js';

/**
 * The "why open this today" card. The spaced-repetition engine already knew how
 * many questions were waiting; nothing ever told the user.
 */
function todayCard() {
  const pool = allQuestions();
  if (!pool.length) return '';
  const due = dueCount(pool, state.quiz);
  const today = todayCounts();
  const goal = dailyProgress(today.answered);
  const streak = streakStatus();
  const gap = daysSinceLastStudy();

  // Coming back after a break needs acknowledging, not a wall of backlog.
  const welcomeBack = gap != null && gap >= 4;
  const target = Math.min(due, DAILY_GOAL);

  return `
    <div class="card" style="margin-top:14px;">
      <div class="spread">
        <div style="flex:1;min-width:220px;">
          <h3 class="mb0">${icon(goal.met ? 'circle-check' : 'calendar-clock', { size: 19 })} Today${goal.met ? ' — goal met' : ''}</h3>
          ${welcomeBack
            ? `<p class="mt0" style="margin-bottom:8px;">Welcome back — it has been <b>${gap} days</b>.
                 Don't try to clear the backlog: ${target} questions is a good re-entry session.</p>`
            : `<p class="mt0" style="margin-bottom:8px;">${
                due === 0
                  ? 'Nothing due for review — you are ahead. A fresh round still helps.'
                  : `<b>${due}</b> question${due === 1 ? '' : 's'} ready for review.`
              }</p>`}
          <div class="spread" style="gap:8px;">
            <small><b>${goal.done}/${goal.goal}</b> answered today</small>
            <small class="muted">${streak.count > 0
              ? `${icon('flame', { size: 13 })} ${streak.count}-day streak${streak.activeToday ? '' : ' — keep it alive'}`
              : (streak.lapsed ? `streak reset · best ${streak.best}` : 'start a streak today')}</small>
          </div>
          <div class="bar amber" style="margin-top:4px;"><i style="width:${Math.round(goal.pct * 100)}%"></i></div>
        </div>
        <div style="flex:0 0 auto;">
          <a class="btn btn-amber" href="#/practice">${icon('target', { size: 15 })} ${due > 0 ? `Review ${target}` : 'Practise'}</a>
        </div>
      </div>
    </div>`;
}

function clockCard() {
  // Only the 'convert' path has a recognition deadline, and only when we have
  // both the residence date and a researched legal period — we never guess either.
  if (state.profile.path !== 'convert') return '';
  const rules = data.rules?.non_eu;

  if (!state.profile.residenceSince) {
    return `<div class="card" style="margin-top:14px;border:2px solid var(--amber);">
      <h3>⏳ Start your legal countdown</h3>
      <p class="mt0">A non-EU licence is only recognised in Germany for a limited time after you take up
      residence. Tell us your Anmeldung date and we'll show you exactly how long you have left.</p>
      <div class="row">
        <input id="res-inline" type="date" class="glossary-search" style="max-width:220px;margin:0;" max="${isoDay(new Date())}">
        <button class="btn btn-amber small" id="res-save">Set date</button>
      </div>
    </div>`;
  }
  if (!rules?.recognition_months) {
    // Distinguish "we couldn't load the file" from "the law is unverified" —
    // blaming the research for a dropped connection is actively misleading.
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
    return `<div class="callout warning" style="margin-top:14px;">
      ${offline
        ? `<b>You're offline, so the countdown can't load.</b> Your saved progress is fine and the
           lessons you've opened before still work. Reconnect to see your remaining days.`
        : `<b>Deadline tracking not active yet.</b> The exact recognition period for your licence is still
           being verified against the law, so we're not showing a number we can't stand behind.`}</div>`;
  }

  const clock = licenceClock(state.profile.residenceSince, rules);
  const head = clockHeadline(clock);
  if (!clock || !head) return '';
  // On the dark ground the bright family is the readable one (6.4–9.2:1 on
  // --surface); the *-dark tokens are button fills and would sink into it.
  const accent = head.tone === 'danger' ? 'var(--red)' : head.tone === 'warning' ? 'var(--gold)' : 'var(--primary)';
  const ink = accent;

  return `
    <div class="card" style="margin-top:14px;border:2px solid ${accent};">
      <div class="spread">
        <div style="flex:1;min-width:240px;">
          <h3 class="mb0" style="color:${ink};">${icon(clock.expired ? 'siren' : clock.urgent ? 'triangle-alert' : 'hourglass', { size: 19 })} ${esc(head.title)}</h3>
          <p class="mt0" style="margin-bottom:8px;">${esc(head.detail)}</p>
          <div class="bar" style="max-width:380px;"><i style="width:${Math.round(clock.pctElapsed * 100)}%;background:${accent};"></i></div>
          <small class="muted">Residence started ${fmtDate(clock.start)} · recognition ends ${fmtDate(clock.recognitionEnd)}
            ${clock.conversionEnd ? `· simplified conversion possible until ${fmtDate(clock.conversionEnd)}` : ''}</small>
          ${rules.legal_basis ? `<br><small class="muted">${icon('scroll-text', { size: 13 })} ${esc(rules.legal_basis)}</small>` : ''}
        </div>
        <div class="center" style="flex:0 0 auto;">
          <div style="font-size:2.4rem;font-weight:900;line-height:1;color:${ink};">
            ${clock.expired ? '0' : clock.daysLeft}</div>
          <small class="muted"><b>days left</b></small>
        </div>
      </div>
      ${clock.conversionExpired ? `<div class="callout danger" style="margin-bottom:0;">
        The simplified conversion window has also closed. Check with the authority — you may now need
        the full first-licence route.</div>` : ''}
      <div class="row" style="margin-top:10px;">
        <button class="btn btn-ghost small" id="res-edit">${icon('calendar-clock', { size: 15 })} Change my Anmeldung date</button>
      </div>
    </div>`;
}

function wireClock(el, rerender) {
  el.querySelector('#res-save')?.addEventListener('click', () => {
    const v = el.querySelector('#res-inline').value;
    if (!v) return;
    state.profile.residenceSince = v;
    save();
    rerender();
  });
  el.querySelector('#res-edit')?.addEventListener('click', () => {
    state.profile.residenceSince = '';
    save();
    rerender();
  });
}

export function render(el) {
  const path = state.profile.path || DEFAULT_PATH;
  const phases = phasesFor(path);
  const tasks = allTasks(path);
  const doneCount = tasks.filter(t => state.tasks[t.id]?.done).length;
  const pct = tasks.length ? doneCount / tasks.length : 0;
  const name = state.profile.name;
  const nextTask = tasks.find(t => !state.tasks[t.id]?.done);

  const intro = {
    convert: 'Every task below is a real step toward swapping your licence for a German one. ' +
             'Do them in order, earn XP, and keep an eye on the clock.',
    eu: 'Your EU licence is already valid here. This short quest covers the optional exchange and the traps to avoid.',
    new: 'The full quest: paperwork → theory → practical. Complete tasks, earn XP, become a Führerschein-Held.',
  }[path];

  el.innerHTML = `
    <section class="card hero road">
      <div class="spread">
        <div style="flex:1;min-width:230px;">
          <span class="eyebrow">${path === 'convert' ? 'Route · Argentine licence → German licence'
            : path === 'eu' ? 'Route · EU licence' : 'Route · first licence'}</span>
          <h1 style="margin-top:6px;">${name ? `Hola ${esc(name)}` : 'The road to your Führerschein'}</h1>
          <p class="mt0">${esc(intro)}</p>
          ${nextTask ? `<a class="btn btn-amber" href="#/task/${encodeURIComponent(nextTask.id)}">Next waypoint</a>
              <div><small class="muted">${esc(nextTask.title)}</small></div>`
            : (tasks.length ? `<span class="pill green">${icon('trophy', { size: 13 })} Every waypoint cleared</span>` : '')}
        </div>
        <div class="center" style="flex:0 0 auto;">
          ${ring(pct, {
            size: 96, color: 'var(--gold)', label: `${doneCount}/${tasks.length}`,
            textColor: 'var(--gold-bright)', trackColor: 'rgba(255,255,255,.13)',
          })}
          <div><small class="eyebrow">waypoints</small></div>
        </div>
      </div>
    </section>
    ${clockCard()}
    ${todayCard()}
    ${path === 'eu' ? `<div class="callout tip" style="margin-top:14px;">
      <b>You can drive in Germany right now.</b> A valid EU/EEA licence stays valid here until the document
      itself expires — no exams, no exchange required in most cases.</div>` : ''}
    <div id="phases"></div>
    ${!phases.length ? `<div class="card center" style="margin-top:16px;">
        ${icon('traffic-cone', { size: 42, cls: 'big-ico' })}
        <h3>Journey content is being verified</h3>
        <p class="muted">The step-by-step guide for this path is generated from official sources —
        it isn't in place yet. Meanwhile, the <a href="#/learn">theory school</a> is open.</p>
      </div>` : ''}`;

  wireClock(el, () => render(el));

  const phasesEl = el.querySelector('#phases');
  let foundNext = false;
  for (const phase of phases) {
    const ph = document.createElement('div');
    const phaseTasks = phase.tasks || [];
    const phaseDone = phaseTasks.filter(t => state.tasks[t.id]?.done).length;
    ph.innerHTML = `
      <div class="phase-header">
        <div class="ph-emoji">${glyph(phase.emoji || '📌', { size: 22 })}</div>
        <div>
          <h2 class="mb0">${esc(phase.title)}</h2>
          <small>${esc(phase.subtitle || '')} · ${phaseDone}/${phaseTasks.length} done</small>
        </div>
      </div>
      <div class="task-list"></div>`;
    const list = ph.querySelector('.task-list');
    for (const t of phaseTasks) {
      const done = !!state.tasks[t.id]?.done;
      const isNext = !done && !foundNext;
      if (isNext) foundNext = true;
      const div = document.createElement('div');
      div.className = `task-card ${done ? 'done' : ''} ${isNext ? 'next' : ''}`;
      const steps = t.steps?.length || 0;
      const stepsDone = steps
        ? Object.values(state.tasks[t.id]?.steps || {}).filter(Boolean).length : 0;
      div.innerHTML = `
        <div class="task-status" aria-hidden="true">${done ? icon('check', { size: 18 }) : (isNext ? icon('chevron-right', { size: 18 }) : '')}</div>
        <a class="card clickable" href="#/task/${encodeURIComponent(t.id)}">
          <div class="spread">
            <div>
              <div class="task-title">${glyph(t.emoji || '📌', { size: 17, cls: 'task-ico' })} ${esc(t.title)}</div>
              <small class="de-term">${esc(t.german || '')}</small>
            </div>
            <span class="pill amber">+${t.xp || 100} XP</span>
          </div>
          <div class="task-meta">
            ${done ? `<span class="pill green">${icon('check', { size: 13 })} Done</span>`
              : (stepsDone ? `<span class="pill blue">${stepsDone}/${steps} steps</span>` : '')}
            ${t.cost ? `<span class="pill">${icon('banknote', { size: 13 })} ${esc(t.cost)}</span>` : ''}
            ${t.time ? `<span class="pill">${icon('clock', { size: 13 })} ${esc(t.time)}</span>` : ''}
            ${t.validity ? `<span class="pill blue">${icon('calendar-clock', { size: 13 })} ${esc(t.validity)}</span>` : ''}
            ${t.optional ? '<span class="pill">optional</span>' : ''}
          </div>
        </a>`;
      list.appendChild(div);
    }
    phasesEl.appendChild(ph);
  }
}
