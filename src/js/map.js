// ============ Leaflet map wrapper with graceful fallback ============

import { esc, gmapsLink } from './ui.js';
import { safeUrl } from './security.js';

// Central Berlin (Mitte, near Alexanderplatz). Neutral default view; the map
// re-centres on the user only after they explicitly grant geolocation.
export const BERLIN_CENTER = [52.5200, 13.4050];

const TYPE_STYLE = {
  'eye-test': { color: '#7cb0ff', label: 'Eye test', ico: 'eye' },
  'first-aid': { color: '#ff7b7e', label: 'First aid', ico: 'heart-pulse' },
  'photo': { color: '#7c5cd6', label: 'Photos', ico: 'camera' },
  'authority': { color: '#9aa7b8', label: 'Authority', ico: 'landmark' },
  'exam-center': { color: '#e0a82e', label: 'Exam centre', ico: 'clipboard-check' },
  'driving-school': { color: '#4ade80', label: 'Driving school', ico: 'car-front' },
  'translator': { color: '#0f8f8f', label: 'Translation', ico: 'scroll-text' },
  'consulate': { color: '#c2410c', label: 'Consulate', ico: 'landmark' },
};

export function typeStyle(type) {
  return TYPE_STYLE[type] || { color: '#9aa7b8', label: type, ico: 'map-pin' };
}

export function haversineKm(a, b) {
  const R = 6371;
  const dLat = (b[0] - a[0]) * Math.PI / 180;
  const dLng = (b[1] - a[1]) * Math.PI / 180;
  const s = Math.sin(dLat / 2) ** 2 +
    Math.cos(a[0] * Math.PI / 180) * Math.cos(b[0] * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function locate() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocation unavailable'));
    navigator.geolocation.getCurrentPosition(
      pos => resolve([pos.coords.latitude, pos.coords.longitude]),
      err => reject(err),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  });
}

function popupHtml(poi) {
  const q = `${poi.name} ${poi.address || 'Berlin'}`;
  return `<b>${esc(poi.name)}</b><br>
    <small>${esc(poi.address || '')}</small><br>
    ${poi.price ? `<small>${esc(poi.price)}</small><br>` : ''}
    ${poi.notes ? `<small>${esc(poi.notes)}</small><br>` : ''}
    ${poi.url ? `<a href="${esc(safeUrl(poi.url))}" target="_blank" rel="noopener noreferrer">Website</a> · ` : ''}
    <a href="${esc(gmapsLink(q))}" target="_blank" rel="noopener noreferrer">Google Maps</a>`;
}

// Renders a Leaflet map into el. Returns a handle or null when Leaflet failed to load
// (offline) — callers always render an accompanying list, so the map is progressive.
export function renderMap(el, pois, { center = BERLIN_CENTER, zoom = 11 } = {}) {
  if (typeof window.L === 'undefined') {
    el.innerHTML = `<div class="card flat center muted" style="height:100%;display:grid;place-items:center;">
      Map needs a connection — use the list and Google Maps links below.</div>`;
    return null;
  }
  const map = L.map(el, { scrollWheelZoom: false }).setView(center, zoom);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
  const markers = [];
  for (const poi of pois) {
    if (poi.lat == null || poi.lng == null) continue;
    const style = typeStyle(poi.type);
    const m = L.circleMarker([poi.lat, poi.lng], {
      radius: 9, color: '#fff', weight: 2, fillColor: style.color, fillOpacity: 0.95,
    }).addTo(map).bindPopup(popupHtml(poi));
    markers.push(m);
  }
  if (markers.length) {
    const group = L.featureGroup(markers);
    map.fitBounds(group.getBounds().pad(0.18), { maxZoom: 14 });
  }
  return {
    map,
    setUser(coords) {
      L.circleMarker(coords, { radius: 8, color: '#fff', weight: 2, fillColor: '#2b6cea', fillOpacity: 1 })
        .addTo(map).bindPopup('You are here');
      map.setView(coords, 13);
    },
  };
}

export function poiListHtml(pois, userPos) {
  const withDist = pois.map(p => ({
    ...p,
    dist: userPos && p.lat != null ? haversineKm(userPos, [p.lat, p.lng]) : null,
  })).sort((a, b) => (a.dist ?? 999) - (b.dist ?? 999));
  return withDist.map(p => `
    <div class="poi-item">
      <div>
        <b>${esc(p.name)}</b> ${p.english_friendly ? '<span class="pill green">English</span>' : ''}
        <br><small>${esc(p.address || '')}${p.price ? ` · ${esc(p.price)}` : ''}</small>
        ${p.notes ? `<br><small class="muted">${esc(p.notes)}</small>` : ''}
      </div>
      <div style="text-align:right;flex:0 0 auto;">
        ${p.dist != null ? `<b>${p.dist.toFixed(1)} km</b><br>` : ''}
        <small>
        ${p.url ? `<a href="${esc(safeUrl(p.url))}" target="_blank" rel="noopener noreferrer">Site</a> · ` : ''}
        <a href="${esc(gmapsLink(p.name + ' ' + (p.address || 'Berlin')))}" target="_blank" rel="noopener noreferrer">Maps</a>
        </small>
      </div>
    </div>`).join('') || '<p class="muted center">No places found for this filter.</p>';
}
