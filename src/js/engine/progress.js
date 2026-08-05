// ============ Pure progress maths: what's due, and am I ready? ============
//
// The spaced-repetition engine already decides WHICH questions to serve, but the
// app never told the user how many were waiting or whether they were ready to
// book the real exam. Both answers live here as pure functions so they can be
// tested and reused by any view.

import { isDue, masteredCount } from './scoring.js';

/**
 * How many questions are due for review right now.
 *
 * CONTRACT: counts never-seen questions as due (they are the most due thing
 * there is), and counts a question with box 0 as always due. Returns 0 for an
 * empty pool rather than throwing.
 */
export function dueCount(pool, quizState, now = Date.now()) {
  return pool.reduce((n, q) => n + (isDue(quizState[q.id], now) ? 1 : 0), 0);
}

/** Split the bank into the buckets a learner actually cares about. */
export function poolBreakdown(pool, quizState, now = Date.now()) {
  let fresh = 0, due = 0, resting = 0, mastered = 0;
  for (const q of pool) {
    const s = quizState[q.id];
    if (!s) { fresh++; continue; }
    if ((s.box ?? 0) >= 3) mastered++;
    if (isDue(s, now)) due++; else resting++;
  }
  return { total: pool.length, fresh, due, resting, mastered };
}

/** Per-module mastery, weakest first. Drives "study this next". */

export function moduleMastery(modules, quizState) {
  return modules.map(m => {
    const qs = m.questions || [];
    const mastered = masteredCount(qs, quizState);
    const seen = qs.filter(q => quizState[q.id]).length;
    return {
      id: m.id, title: m.title, icon: m.icon,
      total: qs.length, seen, mastered,
      ratio: qs.length ? mastered / qs.length : 0,
    };
  }).sort((a, b) => a.ratio - b.ratio);
}

// ---------- exam readiness ----------
//
// Weights favour demonstrated exam performance over raw coverage: passing mocks
// predicts passing the real thing better than having read every lesson.
const W = { mastery: 0.45, exams: 0.40, coverage: 0.15 };
const RECENT_EXAMS = 3;
const PASS_LIMIT = 10; // official maximum error points

function examComponent(exams) {
  const recent = exams.slice(-RECENT_EXAMS);
  if (!recent.length) return { score: 0, attempts: 0, passes: 0, avgErrors: null };
  const passes = recent.filter(e => e.passed).length;
  const avgErrors = recent.reduce((s, e) => s + (e.errorPoints ?? 0), 0) / recent.length;
  // Pass rate carries most of it; a comfortable margin below the limit adds the rest.
  const passRate = passes / recent.length;
  const margin = Math.max(0, Math.min(1, (PASS_LIMIT - avgErrors) / PASS_LIMIT));
  return {
    score: 0.7 * passRate + 0.3 * margin,
    attempts: recent.length, passes, avgErrors,
  };
}

/**
 * @returns {{score:number, band:string, label:string, components:object, nextAction:object}}
 * `band` is deliberately hard to reach: telling someone they are ready when they
 * are not costs them a real exam fee and weeks of waiting.
 */
export function examReadiness(pool, quizState, exams = [], { lessonsDone = 0, lessonsTotal = 0 } = {}) {
  const breakdown = poolBreakdown(pool, quizState);
  const mastery = pool.length ? breakdown.mastered / pool.length : 0;
  const ex = examComponent(exams);
  const coverage = lessonsTotal ? lessonsDone / lessonsTotal : 0;

  const score = W.mastery * mastery + W.exams * ex.score + W.coverage * coverage;

  const recent = exams.slice(-RECENT_EXAMS);
  const enoughEvidence = recent.length >= 2 && recent.filter(e => e.passed).length >= 2;
  let band, label;
  if (score >= 0.85 && enoughEvidence && mastery >= 0.8) {
    band = 'ready';
    label = 'Ready to book the real exam';
  } else if (score >= 0.6) {
    band = 'nearly';
    label = 'Nearly there';
  } else if (score >= 0.3) {
    band = 'building';
    label = 'Building up';
  } else {
    band = 'early';
    label = 'Just getting started';
  }

  // Point at the weakest component so the number is actionable, not just a score.
  const gaps = [
    { key: 'coverage', value: coverage, weight: W.coverage,
      action: 'Read the lessons you haven\'t opened yet', route: '#/learn' },
    { key: 'mastery', value: mastery, weight: W.mastery,
      action: 'Practise until more questions are mastered', route: '#/practice' },
    { key: 'exams', value: ex.score, weight: W.exams,
      action: recent.length < 2 ? 'Sit a couple of mock exams to prove it'
        : 'Pass more mock exams with room to spare', route: '#/exam' },
  ].sort((a, b) => (a.value * b.weight) - (b.value * a.weight));

  return {
    score, band, label,
    components: { mastery, exams: ex.score, coverage },
    exams: ex,
    breakdown,
    nextAction: gaps[0],
  };
}

/** Daily goal: a small, reachable target that respects what's actually due. */
export const DAILY_GOAL = 15;

export function dailyProgress(answeredToday, goal = DAILY_GOAL) {
  const done = Math.max(0, answeredToday);
  return { done, goal, pct: Math.min(1, goal ? done / goal : 0), met: done >= goal };
}
