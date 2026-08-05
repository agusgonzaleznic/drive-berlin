// ============ Persistent state, XP, levels, badges, streak ============

import { isoDay } from './engine/deadline.js';
import { sanitizeState } from './security.js';

const KEY = 'gds-state-v1';

const DEFAULTS = {
  // path: 'convert' (non-EU licence -> German), 'eu' (EU licence exchange), 'new' (from scratch)
  // residenceSince: ISO date the Berlin residence began — drives the legal recognition clock
  profile: { name: '', path: null, startedAt: null, residenceSince: '', licenceCountry: '' },
  tasks: {},      // taskId -> { done, doneAt, steps: {stepIdx: true} }
  lessons: {},    // moduleId -> { done, doneAt }
  quiz: {},       // questionId -> { box, right, wrong, last }
  exams: [],      // { date, errorPoints, passed, total, fiveWrong }
  counters: { correct: 0, answered: 0 },
  daily: { day: '', answered: 0, correct: 0 }, // resets each local calendar day
  xp: 0,
  level: 1,
  badges: [],
  streak: { last: null, count: 0, best: 0 },
};

export const LEVELS = [
  { n: 1, xp: 0, title: 'Fußgänger', en: 'Pedestrian' },
  { n: 2, xp: 100, title: 'Beifahrer', en: 'Passenger' },
  { n: 3, xp: 250, title: 'Fahrschüler', en: 'Student Driver' },
  { n: 4, xp: 500, title: 'Parkplatz-Profi', en: 'Parking-Lot Pro' },
  { n: 5, xp: 900, title: 'Kreuzungs-Kenner', en: 'Junction Genius' },
  { n: 6, xp: 1400, title: 'Stadtverkehr-Stratege', en: 'City-Traffic Strategist' },
  { n: 7, xp: 2000, title: 'Landstraßen-Legende', en: 'Country-Road Legend' },
  { n: 8, xp: 2800, title: 'Autobahn-Ass', en: 'Autobahn Ace' },
  { n: 9, xp: 3800, title: 'Prüfungs-Profi', en: 'Exam Pro' },
  { n: 10, xp: 5000, title: 'Führerschein-Held', en: 'Licence Hero' },
];

// Every badge here must be reachable: either a journey task awards it (via its
// `badge`/`badges` field) or code calls award() directly. Two earlier badges
// described mandatory theory lessons and Sonderfahrten — requirements that FeV
// § 31 Abs. 2 waives on the conversion route — so they were unwinnable by design
// and have been removed rather than left grey forever.
export const BADGES = [
  { id: 'ignition', emoji: '🔑', name: 'Ignition', desc: 'Completed your first lesson' },
  { id: 'eagle-eye', emoji: '👁️', name: 'Eagle Eye', desc: 'Eye test (Sehtest) done' },
  { id: 'lifesaver', emoji: '⛑️', name: 'Lifesaver', desc: 'First-aid course completed' },
  { id: 'model', emoji: '📸', name: 'Model Material', desc: 'Biometric photos sorted' },
  { id: 'translated', emoji: '📜', name: 'Lost in Translation', desc: 'Argentine licence officially translated' },
  { id: 'enrolled', emoji: '🏫', name: 'Enrolled', desc: 'Signed up with a Fahrschule' },
  { id: 'paper-trail', emoji: '📋', name: 'Paper Trail', desc: 'Licence application submitted' },
  { id: 'quiz-champion', emoji: '🧠', name: 'Quiz Champion', desc: 'Passed the real theory exam' },
  { id: 'key-master', emoji: '🗝️', name: 'Key Master', desc: 'Passed the practical exam' },
  { id: 'licensed', emoji: '🪪', name: 'Licensed to Drive', desc: 'Licence in hand. Hero status!' },
  { id: 'bookworm', emoji: '📚', name: 'Bookworm', desc: 'Completed every lesson module' },
  { id: 'sharp-shooter', emoji: '🎯', name: 'Sharp Shooter', desc: '50 questions answered correctly' },
  { id: 'question-slayer', emoji: '⚔️', name: 'Question Slayer', desc: '200 questions answered correctly' },
  { id: 'no-fear', emoji: '🎬', name: 'No Fear', desc: 'Attempted your first mock exam' },
  { id: 'exam-ready', emoji: '✅', name: 'Exam Ready', desc: 'Passed 3 mock exams' },
  { id: 'flawless', emoji: '💎', name: 'Flawless', desc: 'Mock exam with 0 error points' },
  { id: 'streak-7', emoji: '🔥', name: 'Consistency King', desc: '7-day study streak' },
];

/**
 * Read saved progress.
 *
 * CONTRACT: never throws and always returns a complete, correctly typed state.
 * Missing storage, blocked storage (private browsing), malformed JSON and
 * partially-written or hand-edited payloads all fall back to defaults for the
 * affected keys rather than leaving the app with a value a view cannot render.
 * Everything goes through sanitizeState() so a corrupt payload cannot brick the
 * app with no way back.
 */
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULTS);
    return { ...structuredClone(DEFAULTS), ...sanitizeState(JSON.parse(raw)) };
  } catch { return structuredClone(DEFAULTS); }
}

export const state = load();

function emit(type, detail = {}) {
  document.dispatchEvent(new CustomEvent('gds:' + type, { detail }));
}

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage full/blocked */ }
  emit('state');
}

// ---------- XP & levels ----------
export function levelInfo(xp = state.xp) {
  let cur = LEVELS[0];
  for (const l of LEVELS) if (xp >= l.xp) cur = l;
  const next = LEVELS.find(l => l.xp > xp);
  const pct = next ? (xp - cur.xp) / (next.xp - cur.xp) : 1;
  return { ...cur, nextXp: next ? next.xp : null, pct };
}

export function addXP(n, reason = '') {
  if (!n) return;
  const before = levelInfo().n;
  state.xp += n;
  const after = levelInfo();
  emit('xp', { n, reason });
  if (after.n > before) {
    state.level = after.n;
    emit('levelup', { level: after });
  }
  save();
}

// ---------- badges ----------
export function award(id) {
  if (state.badges.includes(id)) return false;
  const badge = BADGES.find(b => b.id === id);
  if (!badge) return false;
  state.badges.push(id);
  save();
  emit('badge', { badge });
  return true;
}

// ---------- streak ----------
// isoDay() is LOCAL-calendar; toISOString() would bucket a 01:00 Berlin session
// under yesterday and silently break a genuine consecutive-day streak.
const dayStr = (d = new Date()) => isoDay(d);

export function touchStreak() {
  const today = dayStr();
  if (state.streak.last === today) return;
  const yesterday = dayStr(new Date(Date.now() - 864e5));
  state.streak.count = state.streak.last === yesterday ? state.streak.count + 1 : 1;
  state.streak.last = today;
  state.streak.best = Math.max(state.streak.best, state.streak.count);
  if (state.streak.count >= 7) award('streak-7');
  save();
}

/**
 * The stored count is only ever advanced while studying, so after a gap it keeps
 * claiming a streak that is already lost. Always display through this.
 * @returns {{count:number, best:number, activeToday:boolean, lapsed:boolean}}
 */
export function streakStatus(now = new Date()) {
  const today = dayStr(now);
  const yesterday = dayStr(new Date(now.getTime() - 864e5));
  const last = state.streak.last;
  const alive = last === today || last === yesterday;
  return {
    count: alive ? state.streak.count : 0,
    best: state.streak.best,
    activeToday: last === today,
    lapsed: !!last && !alive,
    lastDay: last,
  };
}

/** Days since the last study day — drives the "welcome back" re-entry. */
export function daysSinceLastStudy(now = new Date()) {
  if (!state.streak.last) return null;
  const last = new Date(state.streak.last + 'T00:00:00');
  const a = Date.UTC(last.getFullYear(), last.getMonth(), last.getDate());
  const b = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((b - a) / 864e5);
}

/** Today's answered/correct counts, rolled over on the local day boundary. */
export function todayCounts(now = new Date()) {
  const today = dayStr(now);
  if (state.daily?.day !== today) return { day: today, answered: 0, correct: 0 };
  return { ...state.daily };
}

function bumpDaily(correct) {
  const today = dayStr();
  if (!state.daily || state.daily.day !== today) state.daily = { day: today, answered: 0, correct: 0 };
  state.daily.answered++;
  if (correct) state.daily.correct++;
}

// ---------- tasks ----------
export function setTaskDone(id, done) {
  const t = state.tasks[id] || (state.tasks[id] = { done: false, steps: {} });
  t.done = done;
  t.doneAt = done ? Date.now() : null;
  save();
}
export function toggleTaskStep(id, idx, val) {
  const t = state.tasks[id] || (state.tasks[id] = { done: false, steps: {} });
  t.steps = t.steps || {};
  t.steps[idx] = val;
  save();
}

// ---------- quiz / spaced repetition ----------
export function recordAnswer(qid, correct) {
  const q = state.quiz[qid] || (state.quiz[qid] = { box: 0, right: 0, wrong: 0, last: null });
  const firstTime = q.right === 0 && correct;
  q.box = correct ? Math.min(q.box + 1, 4) : 0;
  correct ? q.right++ : q.wrong++;
  q.last = Date.now();
  state.counters.answered++;
  if (correct) state.counters.correct++;
  bumpDaily(correct);
  if (state.counters.correct >= 50) award('sharp-shooter');
  if (state.counters.correct >= 200) award('question-slayer');
  touchStreak();
  const xp = correct ? (firstTime ? 10 : 2) : 0;
  if (xp) addXP(xp, 'quiz'); else save();
  return xp;
}

export function recordExam(rec) {
  state.exams.push(rec);
  award('no-fear');
  if (rec.passed && state.exams.filter(e => e.passed).length >= 3) award('exam-ready');
  if (rec.errorPoints === 0) award('flawless');
  touchStreak();
  addXP(rec.passed ? 250 : 40, 'exam');
}

export function completeLesson(moduleId) {
  if (state.lessons[moduleId]?.done) return false;
  state.lessons[moduleId] = { done: true, doneAt: Date.now() };
  award('ignition');
  touchStreak();
  addXP(50, 'lesson');
  return true;
}

// ---------- backup / reset ----------
export function exportState() { return JSON.stringify(state, null, 2); }

/**
 * Replace all progress from a user-supplied file.
 *
 * CONTRACT: throws on malformed JSON (the caller shows an error), and for any
 * JSON that parses, only allowlisted keys with coerced types reach `state`.
 * A hostile file can therefore lose the user's progress — it is their own file —
 * but it cannot pollute a prototype, smuggle a type that crashes a render, or
 * inject markup, because everything goes through sanitizeState() first.
 * Previously this was `Object.assign(state, DEFAULTS, JSON.parse(json))`, which
 * DID mutate state's prototype for an input containing a `__proto__` key.
 */
export function importState(json) {
  const parsed = JSON.parse(json); // throws on malformed JSON — caller handles it
  Object.assign(state, structuredClone(DEFAULTS), sanitizeState(parsed));
  save();
}
export function resetAll() {
  Object.assign(state, structuredClone(DEFAULTS));
  save();
}
