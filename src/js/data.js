// ============ Data loading (journey, locations, modules, glossary) ============

export const data = {
  journey: null,     // { paths: { convert: [...phases], new: [...], eu: [...] } }
  locations: [],     // [{ name, type, address, lat, lng, price, url, notes }]
  modules: [],       // [{ id, order, title, german, icon, category, lesson, questions }]
  glossary: [],      // [{ de, en, desc }]
  phrases: [],       // [{ title, emoji, note, items: [{ de, en, tip }] }] (examiner commands)
  rules: null,       // legal periods from verified research, never hardcoded in JS
  loaded: false,
};

async function j(url, fallback) {
  try {
    const r = await fetch(url, { cache: 'no-cache' });
    if (!r.ok) return fallback;
    return await r.json();
  } catch { return fallback; }
}

export async function loadData() {
  if (data.loaded) return data;
  const [journey, locations, glossary, phrases, rules, manifest] = await Promise.all([
    j('data/journey.json', { paths: {} }),
    j('data/locations.json', []),
    j('data/glossary.json', []),
    j('data/phrases.json', []),
    j('data/rules.json', null),
    j('data/modules/index.json', []),
  ]);
  data.journey = journey;
  data.locations = locations;
  data.glossary = glossary;
  data.phrases = phrases;
  data.rules = rules;
  const mods = await Promise.all(manifest.map(f => j('data/modules/' + f, null)));
  data.modules = mods.filter(Boolean).sort((a, b) => (a.order || 99) - (b.order || 99));
  data.loaded = true;
  return data;
}

// Single source of truth for the default path, because journey.js and stats.js used to

// disagree ('convert' vs 'new'), so the same user saw different task totals.
export const DEFAULT_PATH = 'convert';

export function phasesFor(path) {
  return (data.journey?.paths?.[path || DEFAULT_PATH]) || [];
}
export function allTasks(path) {
  return phasesFor(path || DEFAULT_PATH).flatMap(p => p.tasks || []);
}
export function taskById(id) {
  for (const path of Object.keys(data.journey?.paths || {})) {
    const t = allTasks(path).find(t => t.id === id);
    if (t) return t;
  }
  return null;
}
export function moduleById(id) {
  return data.modules.find(m => m.id === id) || null;
}
export function allQuestions() {
  return data.modules.flatMap(m => (m.questions || []).map(q => ({ ...q, moduleId: m.id, moduleTitle: m.title })));
}
export function questionById(qid) {
  return allQuestions().find(q => q.id === qid) || null;
}
export function locationsByType(...types) {
  return data.locations.filter(l => types.includes(l.type));
}
