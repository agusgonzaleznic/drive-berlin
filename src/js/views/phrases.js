// ============ Exam German: the phrases an examiner actually says ============
// The practical exam is conducted in German only, so understanding the commands
// is a hard requirement. Includes a self-test drill mode.

import { data } from '../data.js';
import { addXP, touchStreak } from '../state.js';
import { esc, confetti, CELEBRATE } from '../ui.js';
import { icon } from '../icons.js';
import { glyph } from '../glyphs.js';

export function render(el, ctx) {
  const groups = data.phrases || [];
  if (ctx?.params?.[0] === 'drill' && groups.length) return renderDrill(el, groups);

  const total = groups.reduce((n, g) => n + (g.items || []).length, 0);
  el.innerHTML = `
    <a href="#/learn" class="muted" style="font-weight:800;">← All lessons</a>
    <div class="card hero" style="margin-top:10px;">
      <h1>${icon('message-square-quote', { size: 22 })} Exam German</h1>
      <p class="mt0">Your practical exam is conducted <b>in German only</b> — no interpreter allowed.
      The good news: examiners use a small, predictable set of commands. Learn these ${total || ''} phrases
      and you'll understand everything that matters.</p>
      ${total ? `<a class="btn btn-amber" href="#/phrases/drill">${icon('target', { size: 15 })} Drill me on these</a>` : ''}
    </div>
    ${!total ? `<div class="card center" style="margin-top:14px;">${icon('layers', { size: 40, cls: 'big-ico' })}
      <h3>Phrases are being verified</h3>
      <p class="muted">This list is generated from real examiner commands and isn't in place yet.</p></div>` : ''}
    <div id="groups"></div>`;

  const wrap = el.querySelector('#groups');
  for (const g of groups) {
    const div = document.createElement('div');
    div.className = 'card';
    div.style.marginTop = '14px';
    div.innerHTML = `
      <h3>${glyph(g.emoji || '💬', { size: 18 })} ${esc(g.title)}</h3>
      ${g.note ? `<p class="muted mt0" style="font-size:.9rem;">${esc(g.note)}</p>` : ''}
      <table class="terms-table">
        ${(g.items || []).map(i => `
          <tr>
            <td style="white-space:normal;">${esc(i.de)}</td>
            <td>${esc(i.en)}${i.tip ? `<br><small class="muted">${icon('lightbulb', { size: 12 })} ${esc(i.tip)}</small>` : ''}</td>
          </tr>`).join('')}
      </table>`;
    wrap.appendChild(div);
  }
}

function shuffle(a) {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

function renderDrill(el, groups) {
  const all = groups.flatMap(g => g.items || []);
  const session = shuffle(all).slice(0, Math.min(12, all.length));
  let idx = 0, correct = 0;

  const step = () => {
    if (idx >= session.length) {
      const pct = Math.round((correct / session.length) * 100);
      if (pct >= 80) confetti(CELEBRATE.medium);
      touchStreak();
      addXP(correct * 5, 'phrases');
      el.innerHTML = `
        <div class="card result-banner">
          ${icon(pct >= 80 ? 'trophy' : pct >= 50 ? 'zap' : 'sunrise', { size: 44, cls: 'big-ico' })}
          <div class="score">${correct}/${session.length}</div>
          <p class="muted">${pct >= 80 ? 'You would understand your examiner.' : 'Keep drilling — these come up every single exam.'}</p>
          <p><span class="pill amber">+${correct * 5} XP</span></p>
          <div class="row" style="justify-content:center;">
            <button class="btn btn-primary" id="again">${icon('repeat-2', { size: 15 })} Again</button>
            <a class="btn btn-ghost" href="#/phrases">${icon('book-open', { size: 15 })} Back to the list</a>
          </div>
        </div>`;
      el.querySelector('#again').addEventListener('click', () => renderDrill(el, groups));
      return;
    }

    const item = session[idx];
    const distractors = shuffle(all.filter(i => i.en !== item.en)).slice(0, 2);
    const options = shuffle([item, ...distractors]);

    el.innerHTML = `
      <div class="spread">
        <b>Phrase ${idx + 1} / ${session.length}</b>
        <a href="#/phrases" class="muted" style="font-weight:800;">✕ quit</a>
      </div>
      <div class="quiz-progress">${session.map((_, i) =>
        `<i class="${i < idx ? 'done' : (i === idx ? 'current' : '')}"></i>`).join('')}</div>
      <div class="card">
        <p class="muted mb0">Your examiner says:</p>
        <div class="q-text" style="font-size:1.3rem;">"${esc(item.de)}"</div>
        <p class="muted">What do you do?</p>
        <div class="options">
          ${options.map((o, i) => `<button class="option" data-i="${i}"><span class="box"></span><span>${esc(o.en)}</span></button>`).join('')}
        </div>
        <div id="fb"></div>
      </div>`;

    el.querySelectorAll('.option').forEach(btn => {
      btn.addEventListener('click', () => {
        const chosen = options[Number(btn.dataset.i)];
        const ok = chosen.en === item.en;
        if (ok) correct++;
        el.querySelectorAll('.option').forEach((b, i) => {
          b.disabled = true;
          if (options[i].en === item.en) b.classList.add('reveal-correct');
          else if (b === btn) b.classList.add('reveal-wrong');
        });
        el.querySelector('#fb').innerHTML = `
          <div class="explain">
            <div class="verdict">${icon(ok ? 'circle-check' : 'circle-alert', { size: 19 })} ${ok ? 'Genau!' : 'Not that one.'}</div>
            <div class="callout ${ok ? 'tip' : 'rule'}"><b>${esc(item.de)}</b> — ${esc(item.en)}
              ${item.tip ? `<br>${icon('lightbulb', { size: 13 })} ${esc(item.tip)}` : ''}</div>
            <div class="center"><button class="btn btn-primary" id="next">Continue →</button></div>
          </div>`;
        const next = el.querySelector('#next');
        next.focus();
        next.addEventListener('click', () => { idx++; step(); });
      });
    });
  };
  step();
}
