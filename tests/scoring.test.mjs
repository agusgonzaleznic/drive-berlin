// Unit tests for the pure exam engine — mirrors official German theory exam rules.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isAnswerCorrect, scoreExam, composeExam, pickPractice, isDue, masteredCount, EXAM_RULES,
} from '../src/js/engine/scoring.js';

const choice = (id, points, correctIdx, n = 3, pool = 'grund') => ({
  id, type: 'choice', points, pool,
  options: Array.from({ length: n }, (_, i) => ({ text: `opt${i}`, correct: correctIdx.includes(i) })),
});
const numeric = (id, points, answer) => ({ id, type: 'number', points, pool: 'grund', answer_number: answer });

test('choice answers require the EXACT set of correct options', () => {
  const q = choice('q1', 3, [0, 2]);
  assert.equal(isAnswerCorrect(q, [0, 2]), true);
  assert.equal(isAnswerCorrect(q, [2, 0]), true, 'order must not matter');
  assert.equal(isAnswerCorrect(q, [0]), false, 'partial selection is wrong');
  assert.equal(isAnswerCorrect(q, [0, 1, 2]), false, 'extra selection is wrong');
  assert.equal(isAnswerCorrect(q, []), false);
  assert.equal(isAnswerCorrect(q, undefined), false);
});

test('numeric answers compare exactly, accepting strings', () => {
  const q = numeric('q2', 4, 27.5);
  assert.equal(isAnswerCorrect(q, 27.5), true);
  assert.equal(isAnswerCorrect(q, '27.5'), true);
  assert.equal(isAnswerCorrect(q, 27), false);
  assert.equal(isAnswerCorrect(q, ''), false);
  assert.equal(isAnswerCorrect(q, null), false);
});

test('pass at exactly 10 error points', () => {
  const qs = [choice('a', 5, [0]), choice('b', 5, [0]), choice('c', 2, [0])];
  // wrong on one 5-pointer and... need exactly 10 without two fives: 5+3+2
  const qs2 = [choice('a', 5, [0]), choice('b', 3, [0]), choice('c', 2, [0])];
  const score = scoreExam(qs2, { 0: [1], 1: [1], 2: [1] }); // all wrong = 10 points, one five
  assert.equal(score.errorPoints, 10);
  assert.equal(score.passed, true, '10 error points with a single 5-pointer wrong still passes');
});

test('fail at 11+ error points', () => {
  const qs = [choice('a', 5, [0]), choice('b', 4, [0]), choice('c', 2, [0])];
  const score = scoreExam(qs, { 0: [1], 1: [1], 2: [1] });
  assert.equal(score.errorPoints, 11);
  assert.equal(score.passed, false);
});

test('special rule: two 5-point questions wrong fails even at exactly 10 points', () => {
  const qs = [choice('a', 5, [0]), choice('b', 5, [0])];
  const score = scoreExam(qs, { 0: [1], 1: [1] });
  assert.equal(score.errorPoints, 10);
  assert.equal(score.fiveWrong, 2);
  assert.equal(score.passed, false, 'two fives = automatic fail (official rule)');
});

test('unanswered questions count as wrong', () => {
  const qs = [choice('a', 3, [0]), choice('b', 2, [0])];
  const score = scoreExam(qs, { 0: [0] }); // second unanswered
  assert.equal(score.errorPoints, 2);
  assert.equal(score.results[1].correct, false);
});

test('composeExam picks 20 grund + 10 zusatz when the bank allows', () => {
  const pool = [
    ...Array.from({ length: 40 }, (_, i) => choice(`g${i}`, 3, [0])),
    ...Array.from({ length: 15 }, (_, i) => choice(`z${i}`, 3, [0], 3, 'zusatz')),
  ];
  const exam = composeExam(pool, { rng: () => 0.42 });
  assert.equal(exam.length, 30);
  assert.equal(exam.filter(q => q.pool === 'zusatz').length, EXAM_RULES.zusatz);
  assert.equal(new Set(exam.map(q => q.id)).size, 30, 'no duplicates');
});

test('composeExam tops up from grund when zusatz pool is short', () => {
  const pool = [
    ...Array.from({ length: 40 }, (_, i) => choice(`g${i}`, 3, [0])),
    ...Array.from({ length: 3 }, (_, i) => choice(`z${i}`, 3, [0], 3, 'zusatz')),
  ];
  const exam = composeExam(pool, { rng: () => 0.13 });
  assert.equal(exam.length, 30);
  assert.equal(new Set(exam.map(q => q.id)).size, 30);
});

test('composeExam shrinks gracefully with a tiny bank', () => {
  const pool = Array.from({ length: 8 }, (_, i) => choice(`g${i}`, 3, [0]));
  const exam = composeExam(pool, { rng: () => 0.7 });
  assert.equal(exam.length, 8);
});

test('spaced repetition: wrong answers are due immediately, boxes back off', () => {
  const now = Date.now();
  assert.equal(isDue(undefined, now), true, 'never-seen is due');
  assert.equal(isDue({ box: 0, last: now }, now), true, 'box 0 always due');
  assert.equal(isDue({ box: 2, last: now }, now), false, 'box 2 not due same day');
  assert.equal(isDue({ box: 2, last: now - 4 * 864e5 }, now), true, 'box 2 due after 3 days');
});

test('pickPractice prefers due and new questions and respects count', () => {
  const now = Date.now();
  const pool = Array.from({ length: 20 }, (_, i) => choice(`q${i}`, 3, [0]));
  const quizState = {
    q0: { box: 4, last: now },              // mastered, not due
    q1: { box: 0, last: now - 864e5 },      // failed -> due
  };
  const picked = pickPractice(pool, quizState, { count: 5, now, rng: () => 0.5 });
  assert.equal(picked.length, 5);
  assert.ok(picked.some(q => q.id === 'q1'), 'due question included');
  assert.ok(!picked.some(q => q.id === 'q0'), 'mastered non-due question excluded when fresh ones exist');
});

test('masteredCount counts box >= 3', () => {
  const pool = [choice('a', 2, [0]), choice('b', 2, [0]), choice('c', 2, [0])];
  const st = { a: { box: 3 }, b: { box: 4 }, c: { box: 2 } };
  assert.equal(masteredCount(pool, st), 2);
});

test('pickPractice always reserves slots for unseen questions', () => {
  const now = Date.now();
  const pool = Array.from({ length: 100 }, (_, i) => choice('q' + i, 3, [0]));
  // 70 questions seen and all due — the state that used to starve new material.
  const quizState = {};
  for (let i = 0; i < 70; i++) quizState['q' + i] = { box: 0, last: now - 5 * 864e5 };
  const picked = pickPractice(pool, quizState, { count: 10, now, rng: () => 0.5 });
  assert.equal(picked.length, 10);
  const freshPicked = picked.filter(q => !quizState[q.id]).length;
  assert.ok(freshPicked >= 3, `expected at least 3 unseen questions, got ${freshPicked}`);
  assert.ok(freshPicked <= 4, `should not flood the session with new material, got ${freshPicked}`);
});

test('pickPractice still fills the session when nothing is fresh', () => {
  const now = Date.now();
  const pool = Array.from({ length: 20 }, (_, i) => choice('q' + i, 3, [0]));
  const quizState = Object.fromEntries(pool.map(q => [q.id, { box: 0, last: now - 5 * 864e5 }]));
  const picked = pickPractice(pool, quizState, { count: 10, now, rng: () => 0.5 });
  assert.equal(picked.length, 10, 'must not short-change the session when the fresh bucket is empty');
  assert.equal(new Set(picked.map(q => q.id)).size, 10, 'no duplicates');
});

test('pickPractice prefers fresh when nothing is due', () => {
  const now = Date.now();
  const pool = Array.from({ length: 30 }, (_, i) => choice('q' + i, 3, [0]));
  const quizState = {};
  for (let i = 0; i < 10; i++) quizState['q' + i] = { box: 4, last: now }; // resting
  const picked = pickPractice(pool, quizState, { count: 10, now, rng: () => 0.5 });
  const freshPicked = picked.filter(q => !quizState[q.id]).length;
  assert.ok(freshPicked >= 7, `should lean on unseen material, got ${freshPicked}`);
});
