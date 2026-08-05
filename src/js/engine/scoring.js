// ============ Pure exam/quiz engine: no DOM, importable from Node tests ============
//
// Mirrors the real German theory exam rules for a class B first licence:
//   30 questions (20 Grundstoff + 10 Zusatzstoff), each worth 2-5 error points.
//   FAIL if total error points > 10, OR if two or more 5-point questions are wrong
//   (even when the total stays at 10).

export const EXAM_RULES = {
  total: 30,
  grund: 20,
  zusatz: 10,
  maxErrorPoints: 10,
  maxFiveWrong: 1,
};

/**
 * Is this answer correct?
 *
 * CONTRACT:
 * - Choice questions require the EXACT set of correct options. Order does not
 *   matter; a partial selection is wrong; an extra selection is wrong; an empty
 *   or missing answer is wrong.
 * - Number questions compare exactly, accepting a numeric string ('27.5' === 27.5).
 *   An empty string, null or undefined is wrong, never silently correct.
 * - Never throws for a malformed question or answer.
 *
 * @param {{type?:string, options?:Array<{correct?:boolean}>, answer_number?:number}} q
 * @param {number[]|string|number|undefined} answer  selected indexes, or the typed value
 * @returns {boolean}
 */
export function isAnswerCorrect(q, answer) {
  if (q.type === 'number') {
    if (answer === null || answer === undefined || answer === '') return false;
    return Math.abs(Number(answer) - Number(q.answer_number)) < 1e-9;
  }
  const correct = (q.options || [])
    .map((o, i) => (o.correct ? i : -1))
    .filter(i => i >= 0);
  const sel = [...(answer || [])].map(Number).sort((a, b) => a - b);
  return sel.length === correct.length && correct.every((c, i) => c === sel[i]);
}

/**
 * Score a mock exam exactly as the official German class B exam is scored.
 *
 * CONTRACT. These are legal rules, not preferences (FeV Anlage 7):
 * - Error points accumulate ONLY for wrong answers; an unanswered question
 *   counts as wrong.
 * - Pass requires errorPoints <= 10 AND at most ONE wrong 5-point question.
 *   Exactly 10 points with a single 5-pointer wrong PASSES.
 *   Exactly 10 points with TWO 5-pointers wrong FAILS under the special rule.

 * - Returns a per-question result array in the original order.
 *
 * @param {Array<{id?:string, points?:number}>} questions
 * @param {Record<number, unknown>} answers  index -> answer, gaps allowed
 * @returns {{errorPoints:number, fiveWrong:number, passed:boolean, results:Array}}
 */
export function scoreExam(questions, answers) {
  let errorPoints = 0;
  let fiveWrong = 0;
  const results = questions.map((q, i) => {
    const ok = isAnswerCorrect(q, answers[i]);
    if (!ok) {
      errorPoints += q.points || 0;
      if ((q.points || 0) >= 5) fiveWrong++;
    }
    return { index: i, id: q.id, correct: ok, points: q.points || 0 };
  });
  const passed =
    errorPoints <= EXAM_RULES.maxErrorPoints && fiveWrong <= EXAM_RULES.maxFiveWrong;
  return { errorPoints, fiveWrong, passed, results };
}

function shuffled(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Build a 30-question paper with the official split.
 *
 * CONTRACT:
 * - Returns 20 Grundstoff + 10 Zusatzstoff when the bank allows, never duplicating.
 * - Tops up from the other pool when one is short, still without duplicates.
 * - Shrinks gracefully to the bank size when the bank is smaller than 30.
 * - Deterministic when given a deterministic `rng`, so tests are stable.
 *
 * @param {Array<{id:string, pool?:string}>} pool
 * @param {{grund?:number, zusatz?:number, rng?:() => number}} [opts]
 * @returns {Array} the paper, shuffled
 */
export function composeExam(pool, { grund = EXAM_RULES.grund, zusatz = EXAM_RULES.zusatz, rng = Math.random } = {}) {
  const g = shuffled(pool.filter(q => q.pool !== 'zusatz'), rng);
  const z = shuffled(pool.filter(q => q.pool === 'zusatz'), rng);
  const picked = [...z.slice(0, zusatz), ...g.slice(0, grund)];
  const want = grund + zusatz;
  if (picked.length < want) {
    const ids = new Set(picked.map(q => q.id));
    for (const q of [...g, ...z]) {
      if (picked.length >= want) break;
      if (!ids.has(q.id)) { picked.push(q); ids.add(q.id); }
    }
  }
  return shuffled(picked, rng).slice(0, want);
}

// ---------- spaced repetition (Leitner) ----------
export const BOX_INTERVAL_DAYS = [0, 1, 3, 7, 16];

export function isDue(qstate, now) {
  if (!qstate || qstate.box === 0) return true;
  const days = BOX_INTERVAL_DAYS[Math.min(qstate.box, BOX_INTERVAL_DAYS.length - 1)];
  return now - (qstate.last || 0) >= days * 864e5;
}

// Fraction of every session reserved for questions never seen before. Without
// this floor, reviews (which can run ~50/day once the bank is half-learned)
// crowd out new material entirely and a third of the bank is never seen.
export const FRESH_RATIO = 0.3;

/**
 * Choose the questions for one practice session.
 *
 * CONTRACT:
 * - Always returns exactly `count` questions when the pool has that many, with
 *   no duplicates.
 * - Reserves ~FRESH_RATIO of the session for never-seen questions whenever any
 *   remain, so reviews cannot starve new material (they will: at steady state
 *   roughly 50 questions/day come due against a 10-question session).
 * - Falls back to filling from any bucket when one runs dry.
 * - Prefers lower Leitner boxes (weaker answers) within the due set.
 *
 * @param {Array} pool
 * @param {Record<string,{box?:number,last?:number}>} quizState
 * @param {{count?:number, now?:number, rng?:() => number}} [opts]
 * @returns {Array}
 */
export function pickPractice(pool, quizState, { count = 10, now = Date.now(), rng = Math.random } = {}) {
  const annotated = pool.map(q => {
    const s = quizState[q.id];
    return { q, seen: !!s, box: s ? s.box : -1, due: isDue(s, now) };
  });
  const fresh = shuffled(annotated.filter(a => !a.seen), rng);
  const due = shuffled(annotated.filter(a => a.seen && a.due), rng).sort((a, b) => a.box - b.box);
  const rest = shuffled(annotated.filter(a => a.seen && !a.due), rng).sort((a, b) => a.box - b.box);

  const freshSlots = Math.min(fresh.length, Math.round(count * FRESH_RATIO));
  const picked = [
    ...due.slice(0, Math.max(0, count - freshSlots)),
    ...fresh.slice(0, freshSlots),
  ];
  // Top up from whatever is left if either bucket ran dry.
  if (picked.length < count) {
    const ids = new Set(picked.map(a => a.q.id));
    for (const a of [...due, ...fresh, ...rest]) {
      if (picked.length >= count) break;
      if (!ids.has(a.q.id)) { picked.push(a); ids.add(a.q.id); }
    }
  }
  return shuffled(picked, rng).slice(0, count).map(a => a.q);
}

export function masteredCount(pool, quizState) {
  return pool.filter(q => (quizState[q.id]?.box ?? 0) >= 3).length;
}
