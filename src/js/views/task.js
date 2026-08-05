// ============ Task detail: instructions, tips, map of nearby places ============

import { taskById, locationsByType } from '../data.js';
import { state, setTaskDone, toggleTaskStep, addXP, award } from '../state.js';
import { esc, md, toast, confetti, CELEBRATE } from '../ui.js';
import { icon } from '../icons.js';
import { glyph } from '../glyphs.js';
import { renderMap, poiListHtml, locate } from '../map.js';
import { safeUrl } from '../security.js';

export function render(el, { params }) {
  const t = taskById(params[0]);
  if (!t) {
    el.innerHTML = '<div class="card center"><h2>Task not found</h2><a class="btn btn-ghost" href="#/journey">← Back to journey</a></div>';
    return;
  }
  const ts = state.tasks[t.id] || { done: false, steps: {} };
  const pois = t.location_types?.length ? locationsByType(...t.location_types) : [];

  el.innerHTML = `
    <a href="#/journey" class="muted" style="font-weight:800;">← Journey</a>
    <div class="card" style="margin-top:10px;">
      <div class="spread">
        <div>
          <h1 class="mb0">${glyph(t.emoji || '📌', { size: 22 })} ${esc(t.title)}</h1>
          <span class="de-term">${esc(t.german || '')}</span>
        </div>
        <span class="pill amber" style="font-size:.9rem;">+${t.xp || 100} XP</span>
      </div>
      ${t.summary ? `<div style="margin-top:10px;">${md(t.summary)}</div>` : ''}
      <div class="facts">
        ${t.cost ? `<div class="fact"><b>Cost</b><span>${esc(t.cost)}</span></div>` : ''}
        ${t.time ? `<div class="fact"><b>Time needed</b><span>${esc(t.time)}</span></div>` : ''}
        ${t.validity ? `<div class="fact"><b>Validity</b><span>${esc(t.validity)}</span></div>` : ''}
        ${t.where ? `<div class="fact"><b>Where</b><span>${esc(t.where)}</span></div>` : ''}
      </div>
      ${t.why ? `<div class="callout rule"><b>Why this exists:</b> ${esc(t.why)}</div>` : ''}
    </div>

    ${t.steps?.length ? `
    <div class="card" style="margin-top:14px;">
      <h3>${icon('circle-check', { size: 17 })} How to do it</h3>
      <ul class="checklist" id="steps">
        ${t.steps.map((s, i) => `
          <li class="${ts.steps?.[i] ? 'checked' : ''}">
            <input type="checkbox" id="step-${i}" data-idx="${i}" ${ts.steps?.[i] ? 'checked' : ''}>
            <label for="step-${i}">${md(s)}</label>
          </li>`).join('')}
      </ul>
    </div>` : ''}

    ${t.tips?.length ? `
    <div style="margin-top:14px;">
      ${t.tips.map(tip => `<div class="callout tip">${md(tip)}</div>`).join('')}
    </div>` : ''}
    ${t.pitfalls?.length ? `
    <div style="margin-top:6px;">
      ${t.pitfalls.map(p => `<div class="callout warning">${md(p)}</div>`).join('')}
    </div>` : ''}

    ${pois.length ? `
    <div class="card" style="margin-top:14px;">
      <div class="spread">
        <h3 class="mb0">${icon('map-pin', { size: 17 })} Places near you</h3>
        <button class="btn btn-ghost small" id="locate-btn">${icon('crosshair', { size: 15 })} Use my location</button>
      </div>
      <div class="map-box small" id="task-map" style="margin-top:10px;"></div>
      <div id="poi-list" style="margin-top:8px;">${poiListHtml(pois)}</div>
    </div>` : ''}

    ${t.links?.length ? `
    <div class="card" style="margin-top:14px;">
      <h3>${icon('file-text', { size: 17 })} Official links &amp; resources</h3>
      ${t.links.map(l => {
        // An in-app hash link must navigate here, not spawn a second copy of the app.
        const href = safeUrl(l.url);
        const internal = href.startsWith('#');
        const attrs = internal ? '' : ' target="_blank" rel="noopener noreferrer"';
        return `<p class="mb0" style="margin:.35em 0;"><span aria-hidden="true">${internal ? '→' : '↗'}</span> <a href="${esc(href)}"${attrs}>${esc(l.label)}</a>${l.note ? ` <small class="muted">— ${esc(l.note)}</small>` : ''}${internal ? '' : ' <small class="muted">(opens a new tab)</small>'}</p>`;
      }).join('')}
    </div>` : ''}

    <div class="center" style="margin-top:20px;">
      ${ts.done
        ? `<span class="pill green" style="font-size:1rem;padding:8px 18px;">${icon('check', { size: 15 })} Completed</span>
           <button class="btn btn-ghost small" id="undo-btn" style="margin-left:8px;">Undo</button>`
        : `<button class="btn btn-primary" id="done-btn" style="font-size:1.05rem;padding:14px 34px;">
             ${icon('check', { size: 16 })} Mark as completed &nbsp;·&nbsp; +${t.xp || 100} XP</button>`}
    </div>
  `;

  // step checkboxes
  el.querySelector('#steps')?.addEventListener('change', e => {
    const idx = e.target.dataset?.idx;
    if (idx == null) return;
    toggleTaskStep(t.id, idx, e.target.checked);
    e.target.closest('li').classList.toggle('checked', e.target.checked);
  });

  // map
  const mapEl = el.querySelector('#task-map');
  let handle = null;
  if (mapEl) handle = renderMap(mapEl, pois, {});
  el.querySelector('#locate-btn')?.addEventListener('click', async () => {
    try {
      const pos = await locate();
      handle?.setUser(pos);
      el.querySelector('#poi-list').innerHTML = poiListHtml(pois, pos);
      toast('Sorted by distance from you', { emoji: '🎯' });
    } catch {
      toast('Could not get your location — check browser permissions', { emoji: '🙈' });
    }
  });

  // completion
  el.querySelector('#done-btn')?.addEventListener('click', () => {
    setTaskDone(t.id, true);
    addXP(t.xp || 100, 'task');
    // A task can satisfy several badges at once — the first-aid appointment also
    // covers the eye test and the photos.
    for (const b of [t.badge, ...(t.badges || [])].filter(Boolean)) award(b);
    confetti(CELEBRATE.medium);
    toast('Waypoint cleared', { emoji: '🎉' });
    render(el, { params });
  });
  el.querySelector('#undo-btn')?.addEventListener('click', () => {
    setTaskDone(t.id, false);
    render(el, { params });
  });
}
