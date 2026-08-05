// Tests for the progress engine: due counts, module mastery, exam readiness.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  dueCount, poolBreakdown, moduleMastery, examReadiness, dailyProgress, DAILY_GOAL,
} from '../src/js/engine/progress.js';

const PASS_LIMIT = 10; // official maximum error points
const q = id => ({ id, type: 'choice', points: 3, pool: 'grund', options: [{ text: 'a', correct: true }, { text: 'b' }, { text: 'c' }] });
const pool = n => Array.from({ length: n }, (_, i) => q('q' + i));
const NOW = Date.UTC(2026, 7, 5);
const day = 864e5;

test('everything unseen is due', () => {
  assert.equal(dueCount(pool(10), {}, NOW), 10);
});

test('resting questions are not due until their interval elapses', () => {
  const st = {
    q0: { box: 1, last: NOW },              // 1-day interval, not due
    q1: { box: 1, last: NOW - 2 * day },    // due
    q2: { box: 4, last: NOW - 5 * day },    // 16-day interval, not due
    q3: { box: 0, last: NOW },              // failed -> always due
  };
  assert.equal(dueCount(pool(4), st, NOW), 2, 'only q1 and q3 are due');
});

test('poolBreakdown separates fresh, due, resting and mastered', () => {
  const st = {
    q0: { box: 3, last: NOW },              // mastered, resting
    q1: { box: 4, last: NOW - 30 * day },   // mastered, due
    q2: { box: 1, last: NOW },              // resting, not mastered
    // q3, q4 unseen
  };
  const b = poolBreakdown(pool(5), st, NOW);
  assert.equal(b.total, 5);
  assert.equal(b.fresh, 2);
  assert.equal(b.mastered, 2, 'box>=3 counts as mastered');
  assert.equal(b.due, 1, 'q1 only; fresh ones are counted separately');
  assert.equal(b.resting, 2);
});

test('moduleMastery sorts weakest first so the app can recommend a module', () => {
  const modules = [
    { id: 'strong', title: 'Strong', questions: [q('a'), q('b')] },
    { id: 'weak', title: 'Weak', questions: [q('c'), q('d')] },
  ];
  const st = { a: { box: 4 }, b: { box: 3 }, c: { box: 0 } };
  const [first, second] = moduleMastery(modules, st);
  assert.equal(first.id, 'weak');
  assert.equal(first.ratio, 0);
  assert.equal(first.seen, 1);
  assert.equal(second.id, 'strong');
  assert.equal(second.ratio, 1);
});

test('readiness starts at zero and reports the earliest band', () => {
  const r = examReadiness(pool(20), {}, [], { lessonsDone: 0, lessonsTotal: 11 });
  assert.equal(r.score, 0);
  assert.equal(r.band, 'early');
  assert.equal(r.components.mastery, 0);
});

test('readiness refuses to say "ready" without passed mock exams', () => {
  // Everything mastered, every lesson read, but no exam evidence at all.
  const p = pool(20);
  const st = Object.fromEntries(p.map(x => [x.id, { box: 4, last: NOW }]));
  const r = examReadiness(p, st, [], { lessonsDone: 11, lessonsTotal: 11 });
  assert.equal(r.components.mastery, 1);
  assert.equal(r.components.coverage, 1);
  assert.notEqual(r.band, 'ready', 'mastery alone must not certify readiness');
  assert.equal(r.nextAction.key, 'exams', 'it should push them toward a mock exam');
  assert.match(r.nextAction.action, /mock/i);
});

test('readiness reaches "ready" only with mastery, coverage AND passed mocks', () => {
  const p = pool(20);
  const st = Object.fromEntries(p.map(x => [x.id, { box: 4, last: NOW }]));
  const exams = [
    { date: NOW - 5 * day, errorPoints: 4, passed: true, total: 30 },
    { date: NOW - 2 * day, errorPoints: 2, passed: true, total: 30 },
  ];
  const r = examReadiness(p, st, exams, { lessonsDone: 11, lessonsTotal: 11 });
  assert.equal(r.band, 'ready', `score was ${r.score}`);
  assert.ok(r.score > 0.9);
});

test('a single lucky pass is not enough to be "ready"', () => {
  const p = pool(20);
  const st = Object.fromEntries(p.map(x => [x.id, { box: 4, last: NOW }]));
  const r = examReadiness(p, st, [{ date: NOW, errorPoints: 10, passed: true, total: 30 }],
    { lessonsDone: 11, lessonsTotal: 11 });
  assert.notEqual(r.band, 'ready', 'needs at least two passes in the recent window');
});

test('recent failures pull readiness down and redirect the next action', () => {
  const p = pool(20);
  // half mastered
  const st = Object.fromEntries(p.map((x, i) => [x.id, { box: i < 10 ? 4 : 0, last: NOW }]));
  const failing = examReadiness(p, st, [
    { date: NOW - 3 * day, errorPoints: 22, passed: false, total: 30 },
    { date: NOW - 1 * day, errorPoints: 18, passed: false, total: 30 },
  ], { lessonsDone: 6, lessonsTotal: 11 });
  assert.ok(failing.score < 0.6, `expected below "nearly", got ${failing.score}`);
  assert.equal(failing.exams.passes, 0);
  assert.ok(failing.exams.avgErrors > PASS_LIMIT, 'average errors above the pass limit');
});

test('old failures fall out of the three-exam window once superseded', () => {
  const p = pool(20);
  const st = Object.fromEntries(p.map(x => [x.id, { box: 4, last: NOW }]));
  const base = { total: 30 };
  const ancientFailures = [
    { ...base, date: NOW - 40 * day, errorPoints: 30, passed: false },
    { ...base, date: NOW - 30 * day, errorPoints: 28, passed: false },
  ];
  const threeGood = [
    { ...base, date: NOW - 5 * day, errorPoints: 5, passed: true },
    { ...base, date: NOW - 3 * day, errorPoints: 3, passed: true },
    { ...base, date: NOW - 1 * day, errorPoints: 1, passed: true },
  ];
  const r = examReadiness(p, st, [...ancientFailures, ...threeGood], { lessonsDone: 11, lessonsTotal: 11 });
  assert.equal(r.exams.attempts, 3, 'window is the last three attempts');
  assert.equal(r.exams.passes, 3, 'the two ancient failures are outside the window');
  assert.equal(r.band, 'ready', `score was ${r.score}`);
});

test('one recent bad attempt still blocks "ready", even with perfect mastery', () => {
  // Deliberate product decision: readiness demands CONSISTENCY, not a best-of.
  const p = pool(20);
  const st = Object.fromEntries(p.map(x => [x.id, { box: 4, last: NOW }]));
  const r = examReadiness(p, st, [
    { date: NOW - 20 * day, errorPoints: 26, passed: false, total: 30 },
    { date: NOW - 3 * day, errorPoints: 3, passed: true, total: 30 },
    { date: NOW - 1 * day, errorPoints: 1, passed: true, total: 30 },
  ], { lessonsDone: 11, lessonsTotal: 11 });
  assert.equal(r.exams.passes, 2);
  assert.equal(r.band, 'nearly', 'a recent blow-out must keep them off "ready"');
});

test('readiness never exceeds 1 nor drops below 0', () => {
  const p = pool(5);
  const st = Object.fromEntries(p.map(x => [x.id, { box: 4, last: NOW }]));
  const r = examReadiness(p, st, [{ date: NOW, errorPoints: 0, passed: true }, { date: NOW, errorPoints: 0, passed: true }],
    { lessonsDone: 11, lessonsTotal: 11 });
  assert.ok(r.score <= 1 && r.score >= 0, String(r.score));
  // an absurd error count must not produce a negative margin
  const bad = examReadiness(p, {}, [{ date: NOW, errorPoints: 999, passed: false }], {});
  assert.ok(bad.score >= 0, String(bad.score));
});

test('readiness tolerates an empty question bank without dividing by zero', () => {
  const r = examReadiness([], {}, [], {});
  assert.ok(Number.isFinite(r.score));
  assert.equal(r.components.mastery, 0);
});

test('daily goal tracks progress and caps at 100%', () => {
  assert.deepEqual(dailyProgress(0), { done: 0, goal: DAILY_GOAL, pct: 0, met: false });
  const half = dailyProgress(Math.floor(DAILY_GOAL / 2));
  assert.ok(half.pct > 0.4 && half.pct < 0.6);
  assert.equal(half.met, false);
  const over = dailyProgress(DAILY_GOAL * 3);
  assert.equal(over.pct, 1, 'bar must not overflow');
  assert.equal(over.met, true);
  assert.equal(dailyProgress(-5).done, 0, 'negative input is clamped');
});
