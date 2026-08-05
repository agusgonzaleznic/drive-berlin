// ============ Places: all Berlin POIs on one map with filters ============

import { data } from '../data.js';
import { renderMap, poiListHtml, locate, typeStyle } from '../map.js';
import { toast, esc } from '../ui.js';
import { icon } from '../icons.js';

const FILTERS = ['eye-test', 'first-aid', 'photo', 'translator', 'driving-school', 'exam-center', 'authority', 'consulate'];

export function render(el) {
  const active = new Set(FILTERS);
  let userPos = null;

  el.innerHTML = `
    <h1>${icon('map-pin', { size: 22 })} Places in Berlin</h1>
    <p class="muted mt0">Everything you need on one map: eye tests, English first-aid courses,
    driving schools, exam centers and the licence office.</p>
    <div class="filter-chips" id="chips">
      ${FILTERS.map(f => { const t = typeStyle(f);
        return `<button data-f="${f}" class="on">${icon(t.ico, { size: 14 })} ${esc(t.label)}</button>`; }).join('')}
    </div>
    <div class="row" style="margin-bottom:10px;">
      <button class="btn btn-ghost small" id="locate-btn">${icon('crosshair', { size: 15 })} Use my location</button>
      <small class="muted">Location stays in your browser. Nothing is sent anywhere.</small>
    </div>
    <div class="map-box" id="big-map"></div>
    <div class="card" style="margin-top:12px;" id="list"></div>`;

  const paint = () => {
    const pois = data.locations.filter(l => active.has(l.type));
    const mapEl = el.querySelector('#big-map');
    mapEl.innerHTML = '';
    if (mapEl._leaflet_id) delete mapEl._leaflet_id; // allow re-init
    const handle = renderMap(mapEl, pois);
    if (userPos) handle?.setUser(userPos);
    el.querySelector('#list').innerHTML = poiListHtml(pois, userPos);
  };

  el.querySelector('#chips').addEventListener('click', e => {
    const f = e.target.dataset?.f;
    if (!f) return;
    if (active.has(f)) active.delete(f); else active.add(f);
    e.target.classList.toggle('on', active.has(f));
    paint();
  });

  el.querySelector('#locate-btn').addEventListener('click', async () => {
    try {
      userPos = await locate();
      toast('Found you! Sorted by distance.', { emoji: '🎯' });
      paint();
    } catch {
      toast('Could not get your location. Check browser permissions', { emoji: '🙈' });

    }
  });

  paint();
}
