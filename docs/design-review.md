# Führerschein Hero — design review

> ## Implementation status — 5 August 2026
>
> The plan below was produced by the review. This section records what has actually been **built**.
> Where the plan and this section disagree, this section is the truth.
>
> ### The headline finding
>
> **The motivation engine was already written, tested, and never rendered.** `engine/progress.js` had
> passing tests for `dueCount`, `moduleMastery`, `examReadiness` and `dailyProgress`, and no view
> imported it. The scheduler knew how many questions were waiting; nothing told the applicant. So the app
> had no concept of *today* and no answer to *am I ready to book the real exam?*
>
> ### Defects fixed (all verified in code first)
>
> | Defect | Why it mattered |
> |---|---|
> | Onboarding choices, task cards and module cards were `<div>`s with click handlers | Keyboard users could not get past onboarding, so the **whole app was unreachable** (WCAG 2.1.1). Now real `<a>`/`<button>`. |
> | No focus indicator anywhere; two inputs had `outline: none` | Keyboard focus was invisible (WCAG 2.4.7). Global `:focus-visible` ring added. |
> | Streak never decayed | After a 10-day gap the header still showed 🔥 12 — telling him he was on track while he wasn't. `streakStatus()` now decays at read time. |
> | `dayStr()` used `toISOString()` | Any Berlin session between 00:00 and 02:00 filed under yesterday, silently breaking real streaks. Now uses local `isoDay()`. |
> | `.terms-table` `nowrap` vs 50-char German terms | The **lesson page scrolled sideways** — the screen he uses most. The old test only checked the journey page; it now checks all eight routes. |
> | Four badges unwinnable (21% of the set) | Two described mandatory theory lessons and Sonderfahrten — requirements FeV § 31 Abs. 2 *waives* on this route. Removed; first-aid task now awards three badges via a `badges` array; a test enforces reachability. |
> | `toast()` cleared existing toasts | Finishing a lesson that also earned a badge and a level showed only one of three messages. Toasts now queue. |
> | Primary button 3.33:1, danger 3.91:1, countdown amber-on-white **2.10:1** | Palette split into fill vs text families with measured values. All text on all screens now passes. |
> | `target="_blank"` on internal hash links | Tapping an in-app link spawned a second copy of the app. |
> | `journey.js` defaulted to `convert`, `stats.js` to `new` | Same user saw `3/12 tasks` on one screen and `0/1` on another. Single `DEFAULT_PATH`. |
> | Mid-exam state in memory only | A refresh or backgrounded tab destroyed a 30-question attempt. Now persisted with a resume offer, plus `overscroll-behavior-y: contain`. |
> | Exam numeric input never re-rendered | Typing a number left the grid cell and the answered counter stale. Patched in place so focus survives; `inputmode="decimal"` added. |
> | Tab labels `<em>` with no reset | Italic at 9.9px. Reset, sized up, 48px min height. |
> | Active tab signalled by hue alone | WCAG 1.4.1. Now weight + a bar indicator. |
> | Header content 79–123px inside a 64px box | Brand and chips both wrapped and spilled out. Single-row mobile header; wordmark drops below 430px; XP abbreviates above 10k. |
> | `.card.clickable` had `:hover` but no `:active` | The only affordance implemented was the one a touchscreen cannot fire. |
> | `pickPractice` put all due questions ahead of unseen ones | With ~50 due/day and 10 per session he could grind reviews for months and never see 30–40% of the bank. 30% of each session now reserved for new material. |
> | `prefers-reduced-motion` ignored | Honoured in CSS *and* inside `confetti()`, which a media query cannot stop. |
> | `scrollTo(0)` on every render | Every journey → task → back trip reset a 14-item list. Position now remembered per list route. |
> | Offline countdown blamed the legal research | Said the law "is still being verified" when the network had simply dropped. Now checks `navigator.onLine`. |
> | `env(safe-area-inset-bottom)` was dead | Resolves to 0 without `viewport-fit=cover`, putting the tab bar in the iOS home-indicator strip. Added, with `theme-color` and web-app meta. |
>
> ### Gamification added (all from data already stored)
>
> - **"Today" card** on the journey: questions due, a 15-question daily goal, honest streak state — the answer to *why open this today*, which did not exist.
> - **Exam readiness**: mastery 45% / mock record 40% / lessons 15%, with a per-component bar and a "next best move" link. It **refuses** to say "ready" on mastery alone — two passes in the last three attempts required, and one recent blow-out blocks it. Telling him he's ready when he isn't costs an exam fee and weeks of waiting.
> - **Celebration hierarchy** (`CELEBRATE.small/medium/large/huge`): seven call sites fired the same full-screen burst, so reading a lesson felt like passing an exam.
> - **Weakest-topic card** on Learn, so 11 identical cards no longer leave him guessing.
> - **"Where you lost the points"** after a mock: misses grouped by module, ranked by error points, with Practise and Re-read buttons — turning "I failed" into "study exactly this".
> - **Welcome-back handling** after four or more days away: names the gap, proposes a small re-entry session instead of a punishing backlog.
> - **Kinder failure framing**: a 2/10 round no longer headlines "+2 XP".
> - **Exam-language reminder**: he may legally sit the real theory exam in English, Spanish or Italian (FeV Anlage 7 Nr. 1.3) — the most morale-changing fact in the product, previously absent from the exam screen.
>
> ### Deliberately deferred
>
> - **Dark mode** — wanted for night study, but needs every hardcoded inline colour moved to tokens first. Own change.
> - **Full typographic scale** (26 one-off sizes, 21 of 25 weights at 800/900) — a token pass across both stylesheets. The worst symptom, the countdown reading no louder than a badge caption, was fixed via colour and size.
> - **Video and image-selection question types** — real since 1 April 2025, but this is content authoring and belongs with the verified-research process.
> - **Storing which wrong option he picked** — would surface repeated misconceptions, but changes the saved-state shape.
> - **Reducing the six tabs** — every tab is one thumb press away and labels are now legible; merging risked burying the Places map that saves real trips across Berlin.
>
> ### Verification
>
> 55 unit tests · 32 real-Chrome browser checks (including overflow on all eight routes and a full
> 30-question mock played to completion) · 8 keyboard-and-motion checks · measured contrast on every
> text node of four screens and touch targets on five.
>
> One caution for future work: an early contrast script reported the hero card at 1.1:1. That was a
> script bug — `backgroundColor` is transparent for *gradient* backgrounds, so it walked up to white.
> The hero is 12.6:1. The script was fixed, not the design.

---

## The review's own consolidated plan

Source: six review lenses (gamification, visual craft, IA/flow, learning effectiveness, mobile/offline,
content/voice) plus an engineering-lead pass. Everything below has been re-verified against the code in
`src/` on this machine. Duplicates across lenses are merged; each item appears exactly once.

**Repo facts this plan is calibrated to** (measured, not quoted):

| Fact | Value |
|---|---|
| Unit tests | **51 passing** across `tests/{data,scoring,deadline,progress}.test.mjs` (the brief's "37" is stale) |
| DOM/browser tests in repo | **none** — `tests/` is engine + data only. The listed DOM hooks are unprotected by `npm test`, so any browser checks live outside this repo. Treat the hooks as contract anyway. |
| `src/js/engine/progress.js` | 119 lines, 5 exported functions, **14 dedicated passing tests**, imported by **zero** views |
| Question bank | 169 total · 149 Grundstoff · **20 Zusatzstoff** · 29 five-pointers · 123 of 169 multi-correct |
| Journey paths | `convert` 12 tasks / 5 phases · `eu` **1 task** · `new` **1 task** |
| `rules.json` | `non_eu.recognition_months: 6`, `conversion_deadline_months: null`, `exam.points_total: 110`, `exam.retake_wait_days: 14`, `exam.languages` includes English/Spanish/**Italian**, `verified_on: 2026-08-04` (rendered nowhere) |
| Glossary | 64 entries (test floors at 50) |

---

## MUST — 8 items

### M1. Wire the motivation engine that is already written and tested
**Why:** `engine/progress.js` — `dueCount`, `poolBreakdown`, `moduleMastery`, `examReadiness`,
`dailyProgress` — is fully implemented, deliberately conservative, covered by 14 tests, and imported by
nothing, so the app can answer neither "what do I do today?" nor "am I ready to book?".

**Change:**
- `journey.js`: `import { poolBreakdown } from '../engine/progress.js'`; render a **Today card** immediately
  after the clock card from `poolBreakdown(allQuestions(), state.quiz)`. Headline the *completable* goal
  ("Today's 10 questions"), subline `${b.due} due for review · ${b.fresh} never seen`, CTA
  `<a class="btn btn-primary" href="#/practice">Start today's 10</a>`. **Never headline the raw due count**
  (400+ on day one demotivates).
- Same card carries the second track (IA lens' "theory readiness"): modules read `N/${data.modules.length}`
  → `#/learn`; best mock (`Math.min(...state.exams.map(e=>e.errorPoints))` or "not attempted") → `#/exam`.
  Do **not** fold study into the existing `doneCount/tasks.length` ring — 3/12 is about legal errands and
  must stay exact.
- `exam.js render()`: `examReadiness(pool, state.quiz, state.exams, {lessonsDone, lessonsTotal})` becomes the
  hero — `label` as verdict, three rows from `components` (mastery / exams / coverage) with the arithmetic
  shown, `nextAction.action` + `nextAction.route` as the single CTA. Word the margin as
  "the real limit is 10 error points — we want you comfortably under it before you pay". Do not touch
  `EXAM_RULES`; `progress.js` already keeps its own aligned `PASS_LIMIT = 10`.
- `stats.js`: add one readiness tile from the **same call** so the two views cannot disagree, and fix the two
  misleading tiles: line 37 → `${mastered}/${pool.length}` (`pool` is already in scope); line 39 → drop the
  pass *ratio* and render recency from `state.exams.slice(-3)` ("last 3 mock exams: 4 ✅ · 12 ❌ · 7 ✅").
- `learn.js renderList`: use `moduleMastery(data.modules, state.quiz)` — it already sorts weakest-first — to
  add a `weak` marker/order signal and a `${due} due` pill per module. Keep the `.module-card` class and the
  `#/lesson/<id>` hrefs.
- One shared path accessor (`currentPath()` in `state.js`): `journey.js:82` falls back to `'convert'`,
  `stats.js:12` to `'new'`, so the same user can be told "3/12 tasks" and "0/1 real-world tasks".
- Add only what genuinely does not exist — `nextDueAt()` — to **`progress.js`** (not `scoring.js`), with a
  test alongside the existing ones.

**Files:** `src/js/views/{journey,exam,stats,learn}.js`, `src/js/engine/progress.js`, `src/js/state.js`,
`src/css/components.css`
**Effort:** medium (a wiring job of a few dozen lines per view, not new design work)

### M2. Fix the calendar day, and make the streak decay
**Why:** `state.js:112` `dayStr = d => d.toISOString().slice(0,10)` uses UTC for a calendar date — the exact
mistake `engine/deadline.js:31` documents and solves — so every Berlin session between 00:00 and 02:00 is
filed under yesterday and a real streak silently breaks; and `streak.count` is only recomputed inside
`touchStreak()`, so after a 10-day gap the header still shows 🔥 12, telling him he is on track while he is not.

**Change:** `import { isoDay } from './engine/deadline.js'` in `state.js` and use it for `dayStr`. Add a
read-time decay used by every display site (`app.js:32`, `stats.js:34`): if `streak.last` is older than
yesterday, show 0 and keep `best`. Add `counters.byDay = { day, answered }` (a few lines) so the already-tested
`dailyProgress()`/`DAILY_GOAL` can be fed. Every "did I study today" feature in M1 depends on this landing first.

**Files:** `src/js/state.js`, `src/js/app.js`, `src/js/views/stats.js`
**Effort:** small

### M3. Leitner correctness: stop inflating "mastered", stop starving new material
**Why:** `recordAnswer` (`state.js:139-153`) promotes on *any* correct answer, and `renderDone`'s
"🔁 Another round" restarts without a hash change, so a question can go box 0→3 in ninety seconds — which is
the number M1's readiness gate and `learn.js`'s progress bars are built on. Separately `pickPractice` returns
`[...due, ...fresh, ...rest]` with due strictly first at `SESSION_SIZE = 10`, so once ~100 items sit at box 2
the `fresh` bucket never gets a slot and 30-40% of the bank is never seen — which makes M1's coverage
component unreachable.

**Change:**
1. `state.js`: `import { isDue } from './engine/scoring.js'` (no cycle — `scoring.js` imports nothing).
   `const now = Date.now(); const due = isDue(q, now); if (correct) { if (due) q.box = Math.min(q.box+1, 4); }
   else q.box = 0;` and **only** set `q.last = now` when `due || !correct` (touching `last` on a not-due correct
   answer pushes the real next review further out).
2. `scoring.js pickPractice`: reserve a floor of new items — e.g. 3 of 10 always from `fresh` while any remain.
3. `quiz.js`: after the reveal add one line — `Next review: ${BOX_INTERVAL_DAYS[...]} day(s)` when correct,
   "You had this right N times before — back to day 0" when wrong. Define the word once in the Learn header:
   *"mastered = recalled correctly three times, on three different days."*

**Files:** `src/js/state.js`, `src/js/engine/scoring.js`, `src/js/views/{quiz,learn}.js`
**Effort:** small · **Must ship with M1** or the readiness verdict lies.

### M4. Persist the running mock exam
**Why:** the attempt is a plain object created at `exam.js:44` and held only in closures; `app.js:81`
`hashchange` → `main.innerHTML = ''` destroys it. A tab tap (the Exam tab is the *narrowest* target, ~38px),
the brand link, an iOS back-edge swipe, a backgrounded-tab reload or a pull-to-refresh all annihilate 25
minutes with no warning — and being interrupted mid-session is the applicant's normal case, not an edge case.

**Change:** in `state.js` add `saveExamAttempt/loadExamAttempt/clearExamAttempt` against a separate key
`gds-exam-attempt-v1` (kept out of `gds-state-v1` so export/import and `resetAll` stay clean), serialising only
`{questionIds, answers, idx, startedAt}`. Save at the end of `commit()` and in the nav handlers; clear at the
top of `finish()` and in the `#start-btn` handler. On `render()`, if every stored id still resolves against
`allQuestions()`, show a card above the hero — "Attempt in progress — question 7 of 30, started 14 min ago" —
with **Resume** and a ghost **Discard**; otherwise fall through to a normal start. Add
`overscroll-behavior-y: contain` on `body` as a cheap secondary guard. No `beforeunload`.

**Files:** `src/js/views/exam.js`, `src/js/state.js`, `src/css/base.css`
**Effort:** medium · Keep `#start-btn` present and behaviourally unchanged.

### M5. Make the app work with no network
**Why:** `data.js:15` fetches every JSON with `{ cache: 'no-cache' }`, which *requires* server validation
before a cached copy may be used — so on the U5 the fetch rejects and the app renders with `paths = {}`,
`modules = []`, `rules = null`. The legal countdown then prints *"the exact recognition period for your licence
is still being verified against the law"* (`journey.js:25`), blaming the legal research for a dropped packet on
the one screen with criminal consequences. Both CDN stylesheets (`index.html:11-12`) are render-blocking, so a
BVG captive portal that hangs gives him a white screen.

**Change:** (a) two-stage read in `j()`: plain `fetch`, then a `{cache:'force-cache'}` retry, then the fallback,
with a `content-type` includes-`json` guard so a captive-portal 200-HTML page is not parsed as data; (b) branch
`journey.js`'s "not verified" copy on `data.loaded`/`rules === null` and say *"Can't reach the rule data right
now — your saved progress is safe on this device"* instead; (c) `media="print" onload="this.media='all'"` on both
CDN links plus a `<noscript>` fallback for the font, and reorder `--font` so Android reaches `system-ui` in one hop.

**Files:** `src/js/data.js`, `src/js/views/journey.js`, `src/index.html`, `src/css/base.css`
**Effort:** small (service worker + manifest are deliberately deferred to N2)

### M6. Turn a failed mock into a study plan
**Why:** `finish()` prints the verdict then all 30 results in shuffled order with no aggregation and one generic
`#/learn` link, so after 18 error points he must self-diagnose from a 30-item scroll on a phone — and the
realistic behaviour is to close the app. Everything needed is already on the objects: `allQuestions()` stamps
`moduleId`/`moduleTitle`, and `exam.js:10` builds its pool from it.

**Change:** between the banner and "Review your answers", insert a **"Where you lost your points"** card built
from `score.results.filter(r => !r.correct)`, keyed on `s.questions[r.index].moduleId` (no `modOf` scan),
accumulating `pts`, `n` and `fives`. Sort by `pts` desc, cap at the top 4 rows, each with
`<span class="pill red">${pts} error pts · ${n} wrong</span>`, a `⚠️ ${fives} five-pointer(s)` marker,
`Re-read` → `#/lesson/<id>` and `Drill ${n}` → `#/practice/<id>`. Add `🎯 Drill my mistakes` → `#/practice`
(honest: `finish()` already reset every wrong question to box 0). List wrong five-pointers first and add
`⚠️ Drill the 29 five-pointers` → `#/practice/fives` (`quiz.js` recognises the sentinel; the router already
passes it through as `params[0]`), with the reason stated: *"Two of these wrong fails you outright, whatever
your total."* Derive "29" from the filtered length. Render the trend **directionally** — "better: 24 → 18 error
points" — because error points are a badness metric and "up from 12" reads as progress. Soften the fail copy.
Do not restate the pass rule.

**Files:** `src/js/views/exam.js`, `src/js/views/quiz.js`, `src/js/engine/scoring.js` (points tie-break only)
**Effort:** small-medium

### M7. Phone-layout defects on the two screens he uses most
**Why:** four separate correctness failures, all measured:
- **The lesson reader scrolls sideways.** `.terms-table td:first-child { white-space: nowrap }`
  (`components.css:140`) at `.9rem/800` inside ~330px of card, against 183 German terms including
  *der Einfädelungsstreifen / Beschleunigungsstreifen* (~415px unbreakable). The codebase documents this exact
  fix twice (`components.css:89-91`, `base.css:54-56`) and left this instance unfixed.
- **The mobile header overflows its own box.** `height: var(--header-h)` = 64px against ~90px of content: the
  brand wraps and the chips wrap, and because the header is `sticky` with a translucent background the overflow
  scrolls over page content.
- **The current tab is signalled by hue alone.** `base.css:171` — `.tabs a.active { background: transparent;
  color: var(--blue) }` at `.62rem`, no weight change, no indicator. WCAG 1.4.1 on the primary navigation. The
  labels are also `<em>` with no `font-style` reset, i.e. **italic bold at 9.9px**, and `space-around` with
  content widths makes Exam the *narrowest* target (~38px) and Glossary the widest.
- **Nothing responds to a tap.** `.card.clickable` has a `:hover` transform and no `:active`, so the 12 journey
  cards and 11 module cards give zero feedback on the only device that matters. `.btn` gets this right.

**Change:** wrap the terms table in an `overflow-x: auto` container (or drop the `nowrap`);
`min-height: var(--header-h)` + `padding-block: 8px` and keep `flex-wrap` as safe degradation, buying headroom
with `@media (max-width: 420px) { .stat-chip.level { display: none } }` (Progress already owns level);
give the active tab a weight change + a 2px indicator bar in addition to colour and use `--blue-dark`;
`.tabs a em { font-style: normal }`; `.tabs a { flex: 1 1 0; min-width: 0; min-height: 48px; font-size: .68rem }`
for six identical ~63px targets, shortening the labels to "Stats"/"German"; add
`viewport-fit=cover` to the viewport meta so the existing `env(safe-area-inset-bottom)` at `base.css:167` stops
resolving to 0 and the tab row leaves the iOS home-indicator strip; correct `--tabs-h` to the real computed
height and make `.toast` use it instead of its hardcoded `bottom: 108px`; add `.card.clickable:active
{ transform: translateY(2px) }`; make `.exam-grid` a single 44px horizontally-scrolling row on mobile
(`grid-auto-flow: column; grid-auto-columns: 44px; overflow-x: auto; overscroll-behavior-x: contain;
scroll-snap-type: x proximity`) — 44px instead of ~214px above the question, and 44px tall cells — plus
`el.querySelector('.exam-grid .current')?.scrollIntoView({block:'nearest', inline:'center'})` after render.
Also `window.scrollTo({top:0})` in the exam `#prev-btn`/`#next-btn`/`[data-nav]` handlers **only** (not on
`.option`, where the re-render is a checkbox toggle).

**Files:** `src/css/{base,components}.css`, `src/index.html`, `src/js/views/exam.js`
**Effort:** medium · Ship the exam-grid scroller together with M4 (a horizontal scroller near the iOS back
gesture is dangerous while the attempt is still volatile).

### M8. The legal clock: stop deleting it, and put it where he is
**Why:** `journey.js:70-74` — the button labelled "📅 Change my Anmeldung date" sets
`residenceSince = ''`, saves and re-renders, so tapping it to *check* the date destroys it with no
confirmation, no prefill and no undo, on the one input the countdown, the urgency colouring and everything
downstream derive from. And the countdown renders on exactly one of nine screens, while the header spends its
permanent real estate on three self-scoring chips.

**Change:**
- Edit **in place**: `render(el, ctx = {})` with `const editing = !!ctx.edit`; `wireClock`'s rerender becomes
  `(opts) => render(el, opts)`; `#res-edit` calls `rerender({edit:true})`, `#res-save`/`#res-cancel` call
  `rerender()`. When a date exists, render the form as an extra block *inside* the existing clock card with
  `value="${esc(state.profile.residenceSince)}"`, so the countdown stays on screen. Keep the two headings
  distinct; `toast('Countdown updated')` on save. `editing` initialises false on every route entry.
- Export `clockState()` from `journey.js` returning `licenceClock(...)` only when `path === 'convert'`,
  `residenceSince` is set and `data.rules?.non_eu.recognition_months` exists — else `null`. `clockCard()` calls
  it too, so there is one source of truth. In `renderHeader()` (already imports `journey` as a namespace) render
  it as the **first** chip: `<a class="stat-chip clock" href="#/journey">⏳ ${clock.daysLeft} d</a>`, tinted by
  `urgencyLevel()` (already exported: 150/90/30). Pay for the width by dropping the **streak** chip — after M2
  it decays, and Progress shows it in full. Must never throw before `loadData()` resolves and must render
  nothing for `eu`/`new`.
- Convert dread into a rate, once, on the Today card: `studyDaysLeft = Math.max(clock.daysLeft - URGENCY.urgent, 7)`
  (importing `URGENCY` so the 90-day authority+slot lead time is never restated as a legal fact), expressed as
  *"one 10-question session a day gets you there by <date>"*. Word it as a **theory-readiness target**, never as
  a legal date; degrade silently when `residenceSince` or `recognition_months` is absent.

**Files:** `src/js/views/journey.js`, `src/js/app.js`, `src/css/components.css`
**Effort:** medium

---

## SHOULD

### S1. Retrieval checkpoints inside the lesson
*The highest learning-outcome item in this plan; it sits below the musts only because those are correctness
fixes.* ~10,000 characters of prose per module with zero retrieval, and 50 XP paid for a click
indistinguishable from scrolling — while `m.questions` sits in the same JSON in topical order. In
`renderLesson`, iterate sections and emit `<div class="card cp" data-cp="${i}">` after each non-final section,
hydrating with `m.questions[i]`; extract `quiz.js`'s reveal block into an exported
`revealAnswer(container, q, selected)` rather than copying it; use `.cp-check`, **never `#check-btn`**; call
`recordAnswer` so lesson reading feeds Leitner; gate `#complete-btn` on all checkpoints being answered
(correctness irrelevant). Keep `+50 XP` — it now pays for retrieval.
**Files:** `src/js/views/{learn,quiz}.js`, `src/css/components.css` · **medium**

### S2. A wrong multi-select never shows what was missed
123 of 169 questions are multi-correct and `isAnswerCorrect` demands the exact set, but the reveal marks every
correct option identically, so under-selecting, over-selecting and both look the same. Three states:
`reveal-correct` (correct **and** chosen), `data-mark="missed"` (correct, not chosen — dashed border,
`::after { content: "you missed this" }`), `reveal-wrong` (chosen, wrong). Make the verdict diagnostic:
"You missed N correct answer(s) and picked M that aren't." In `exam.js`'s review add a `You picked: …` line
above `Correct: …`. Mirror in the phrases drill.
**Files:** `src/js/views/{quiz,exam,phrases}.js`, `src/css/components.css` · **small**

### S3. Say what the bank is — and that he may sit the exam in English or Italian
`rules.json` already lists English, Spanish and Italian among the permitted languages (and
`tests/data.test.mjs:134` **asserts** it), and the app never says so — the single most morale-changing verified
fact in the product, absent from Learn, Exam and Journey. Meanwhile the exam hero's "exactly like the real
thing" reads as a claim about the bank: 169 questions against a catalogue several times larger, with only 20
Zusatzstoff for a 10-per-mock draw (≈50% overlap between attempts). Add the language fact; add
*"This app holds 169 practice questions — the official catalogue is several times larger"*; add the Zusatzstoff
repeat warning; add a saturation tile (`Object.keys(state.quiz).length / allQuestions().length`); reword
`learn.js:20`'s "Everything you need". Note honestly that the licensed apps use the official TÜV|DEKRA
translations and this app's English is hand-authored. Copy plus one derived counter — no rule, fee or deadline
is touched.
**Files:** `src/js/views/{exam,learn,journey}.js` · **small**

### S4. Journey view weight: collapse what is finished, connect what is not
At 3/12 the active task is already ~1200px down a ~700px viewport and `app.js:64` scrolls to top on every
visit; the hero eats 47% of a 390×844 screen; `.task-list { position: relative }` is a leftover from a spine
that was never built; and at "2/2 done" a phase still renders full-height cards. Ship as one commit:
completed phases wrapped in native `<details>` (no `open`) with `.phase-header` as `<summary>`, later phases
always open, plus `summary.phase-header { cursor:pointer; list-style:none }` and a rotating chevron; per-card
spine (`.task-card:not(:last-child)::before` with `position:absolute; left:19px; top:42px; bottom:-10px`) and
delete the dead `position: relative`; hero `padding:16px`, `h1 1.25rem`, `@media (max-width:720px) { .hero p
{ font-size:.9rem } }`; two-line Next-up button (`<small>Next up</small><span>title</span>`, column flex) so a
long title stops pushing the ring down; a real terminal state when everything is done (congratulations card +
`#/stats`, **not** a static pill, and worded as "no outstanding errands", never "done"); and render each task's
one-line action on the card, which today shows only emoji, title, German and pills. Do **not** add
autoscroll-to-active-task. Keep at least one phase visible when all are complete.
**Files:** `src/js/views/journey.js`, `src/css/components.css` · **medium**

### S5. Content corrections in `journey.json` (one commit, with a step-index migration)
Five real defects, all in the file he reads on the morning of an appointment:
1. `c-apply` step 2 tells him to bring "ADAC translation + classification", while `c-apply` tip 3 and
   `c-translation` step 2 both say (with a sourced German quote) that Berlin asks for the translation later,
   and `c-translation` tip 3 warns not to buy the Klassifizierung at all (~€65 vs €25). Delete "+ classification",
   split the packing list one item per line each carrying its own constraint, and make the paper-photo
   constraint a line item — *printed on paper; the office's €6 on-site photo is digital and does not count* —
   instead of leaving it in a pitfall three blocks below. Re-verify that quote's source: `prerequisites.md:163-165`
   cites `dienstleistung/121627` (first licence), not `327537` (conversion).
2. Non-actions have checkboxes ("Accept the two exams as fixed costs", "Take the win…", "Note that…",
   "Accept the likely reality…"), which trains ticking without doing; fold them into the summary prose. Split
   the two genuinely multi-step boxes (`c-translation` step 4's LNC/provincial/pre-2010 decision tree,
   `c-apply` step 2's eight objects). `tests/data.test.mjs:93` requires every task to keep a non-empty `steps`
   array — `c-verdict` must retain its one real step.
3. `t.why` is doing three jobs and on the riskiest task it undermines trust: `c-provisional` reads *"An earlier
   draft of this guide got it wrong in the reassuring direction"*, and `c-verdict` describes the app's own
   research process. Relabel the field to state stakes, and remove revision history and process talk
   (including "the figures moved measurably in the week we were researching" → "these figures move week to
   week — read the live page"). Render `t.why` through `md()` or drop the emphasis markers, since `task.js:34`
   currently `esc()`s it.
4. `c-provisional`'s `where` tile says "LABO Fahrerlaubnisbehörde, Puttkamerstr. 16-18" while step 1 says the
   appointment must be booked by phone — the loudest element on the page reads "go here" and buys a wasted
   cross-Berlin trip. → "By appointment only — call (030) 90269-2300". `c-apply`'s "nearest: Frankfurter Allee"
   contradicts its own advice to book outer districts. Adopt one title register; replace the shouted
   "Do NOT drive yet" with lowercase "Book LABO's permission — do not drive yet" **plus** a `danger` callout.
5. `c-firstaid` says €72.99 and "English dates run Thursday to Sunday" while
   `docs/knowledge-base/argentina-conversion.md:195` records 59,99 € and Sat/Sun/Wed — resolve before any copy
   hard-codes it, and add the entrance detail the KB has and the app drops ("Frankfurter Allee 96, backyard,
   entrance via Müggelstraße").

Also: add the six missing glossary terms plus **Prüfbescheinigung** (absent from all 64 entries, and the term
whose misunderstanding is the criminal offence `c-provisional` is about); gloss the unglossed German the applicant
must *say at a counter*; fix the glossary intro's own unglossed words; audit the `german` subtitle that renders
on all 14 journey cards and task headers. **Ship the step-index migration in the same commit** —
`toggleTaskStep` stores by array position, so any split lands his existing ticks on the wrong lines: add stable
per-step ids or bump a state version key and clear `state.tasks['c-apply'].steps`.
**Files:** `src/data/journey.json`, `src/data/glossary.json`, `src/js/views/{task,glossary}.js`, `src/js/state.js`
**Effort:** medium-large (content)

### S6. Task page shape: the action first, the reference collapsed
Title → German → XP → multi-paragraph `summary` → 4-5 fact tiles → `why` → *then* the checklist, which is the
load-bearing UI and sits two to three phone screens down on a page he returns to ten times. Add a one-line
`do` field rendered above the fold (carrying the number that decides money — "the fee is €45.10"), collapse
`summary`+`why` into `<details class="card background" ${innerWidth > 900 ? 'open' : ''}>` with inline
open-state (no post-render querySelector), keep `<details>` content outside `#steps` so the change handler
still scopes, and add the three lines of summary CSS. Swap tips/pitfalls order (pitfalls first), give each group
a heading, and add the unused fourth `danger` level for exactly four items (expired licence, Prüfbescheinigung,
paper photo, "a short *Sofortmaßnahmen* briefing is **not** accepted") — confirm `.callout.danger` is styled
first. Branch the single "Task not found" fallback into "couldn't load — your ticks are saved on this device,
nothing is lost" vs "that task doesn't exist any more". And stop rendering `#/phrases` with
`target="_blank" rel="noopener"`: `c-phrases` already ships an internal hash link, so "Open the Exam German
list in this app" currently spawns a second copy of the whole app.
**Files:** `src/js/views/task.js`, `src/data/journey.json`, `src/css/components.css` · **medium**

### S7. Typography scale and contrast
26 distinct font sizes (18 used once) and 21 of 25 weight declarations at 800/900, so nothing can be emphasised
— which is why the countdown cannot be made urgent by weight. Introduce a scale and a three-step weight ladder
(400 prose / 600 metadata / 800 titles / 900 numerals), keeping two display sizes so the error-point score stays
the loudest number, absorbing the ~8 inline `style="font-size:…"` one-offs across the views, and capping the
*prose* not the container (`.lesson-body p, .lesson-body li { max-width: 66ch }` — 105-110 characters per line
today). Colour: darken `--muted` to `#5b6472` and raise the sub-12px labels to `.75rem`
(`.tile .t-label`, `.fact b`, `.sign-figure figcaption`, `.badge-card small`); use `--blue-dark` for the mobile
active tab; make `.badge-card.locked` legible (`opacity .45 × grayscale(1)` composites the caption to **1.85:1**
and 13 of 19 badges are locked, so the grid's entire job is done by text he cannot read) — colour the `b`
explicitly, the `small` already inherits `--muted`. Replace `.grid-3`'s `auto-fit` with
`repeat(3, minmax(0,1fr))` / 2 columns under 720px so the six stat tiles stop rendering 4+2 with a 460px hole.
Add `.card > :last-child { margin-bottom: 0 }` (every card is 36px/22px bottom-heavy today). Align the journey
rail (`.phase-header { padding-left:16px; gap:14px }`, `.ph-emoji { 40px; margin-left:-16px }`). Wire or delete
the two dead tokens `--r-sm` and `--tabs-h`. `--amber-dark` at 3.39:1 stays a shadow, not text.
**Files:** `src/css/{base,components}.css`, the ~8 inline styles in `src/js/views/*.js` · **medium**
**Note:** the lens claims about `--amber` heading text and `.btn-primary` failing AA did **not** reproduce — the
countdown already routes text through `--amber-text` / `--red-dark` (`journey.js:33-35`, commented). Do not
"fix" them.

### S8. Celebrations that mean different things, and toasts that stop eating each other
Seven call sites fire the same mechanic (onboarding 90, lesson 100, badge 110, phrases 120, level-up 160, task
160, exam 200), so finishing lesson 4 of 11 feels like passing a mock. Ship a three-tier ladder, reserving
Tier 3 for the mock-exam pass and the four genuinely task-gated badges (`paper-trail`, `quiz-champion`,
`key-master`, `licensed`) plus `flawless` (0 error points, rarer than most legal milestones). Fix **both** silent
drops: `ui.js:57`'s `confettiRunning` guard throws away one of a simultaneous level-up + badge — hoist
`parts`/deadline to module scope so a second call merges particles into the running loop; and `toast()` removes
all existing toasts before appending, so finishing a lesson that also earns a badge and a level fires three
toasts in one tick and he reads only the last — queue/stack (cap 2-3) or coalesce level-up+badge into one
two-line toast. That second bug destroys *information*, not decoration. Keep the `prefers-reduced-motion` guard
untouched; with lesson confetti removed the reduced-motion experience is unchanged because the toast already
carries it.
**Files:** `src/js/ui.js`, `src/js/app.js`, `src/js/views/{learn,onboarding,exam,task,phrases}.js` · **small-medium**

### S9. Onboarding: select, then submit
The three `[data-path]` buttons render **above** the details card and clicking one is the commit — it reads
`#res-input`, saves and navigates — so the natural interaction (tap the option marked "most likely you") saves
`residenceSince: ''` and dumps him on the journey's empty-countdown fallback to enter the same data twice, with
the footer telling him to scroll back up. Make `[data-path]` **select** (`aria-pressed`, `.selected`, no state
write, no navigation) and add one `#start-btn`-style submit below the details card, disabled until a path is
chosen. Compute the stake copy at render time from `data.rules.non_eu.recognition_months` (falling back to "a
limited time"), and preview the date live via `licenceClock` under `#res-input`. Pre-select the saved path for
returning users, add a Cancel, and `openModal`-confirm only when the submitted path differs **and**
`Object.keys(state.tasks).length > 0`. Know what a mis-tap costs: `eu` and `new` have exactly **one task each**
and `journey.js`'s "🚧 content is being verified" fallback only fires at `phases.length === 0`, so it never
fires — a wrong path silently presents a finished-looking one-step quest. Either flag stub paths explicitly or
gate those options. Better long-term fix for the returning case: a small "Your details" card in Progress reusing
the same three inputs, which removes the need for a returning-user mode in onboarding at all.
**Files:** `src/js/views/onboarding.js`, `src/js/views/{journey,stats}.js` · **medium**
**Hook risk:** `[data-path]` stops navigating. See the test-risk table.

### S10. Badges: fix the unwinnable ones before decorating them
Four of 19 (21%) have no `award()` call and no matching `badge` field on any task: `eagle-eye` (Sehtest),
`model` (photos), `theory-marathon`, `road-tripper` — and the `convert` path has no Sehtest/photos/Sonderfahrten
task at all. Either add the tasks + `badge` fields or delete the four entries; do **not** ship progress bars
that leave four badges permanently at 0. Then add the verified `PROG` map inside the locked branch
(`.bar` + have/need, clamped with `Math.min` since `sharp-shooter`/`question-slayer` share
`counters.correct`), and for the remaining event badges render "Unlocks with: Sehtest" from a `taskId` rather
than faking progress. Keep grid order stable and surface one "closest badge" line above it instead of sorting.
**Files:** `src/js/views/stats.js`, `src/js/state.js`, `src/data/journey.json`, `src/css/components.css` · **small-medium**

### S11. The second and third legal clocks do not exist in the app
`rules.json` carries `exam.theory_valid_months: 12`, `admission_valid_months: 12`, `outer_deadline_years: 2` and
`retake_wait_days: 14`, and notes that FeV § 18 Abs. 2 makes the 12-month practical deadline a hard,
self-executing loss of validity — yet `state.js` DEFAULTS records **no exam-pass date** (`state.exams` holds
mock records only), so the moment he passes theory the app goes blind on a new hard deadline. Add
`profile.theoryPassedOn` (and admission date), reuse `licenceClock`-style maths, and surface the 14-day retake
wait next to the readiness verdict from M1 — for a user whose licence expiry is a criminal-liability deadline,
a failed theory attempt costs 14 days he cannot get back. Also surface `berlin_backlog.third_country_conversion_weeks: 8`
next to the days-left figure and `fees_eur.unavoidable_total` somewhere: no view totals the money today
(€24.99 + €129.83 + €45.10 + €3.30 + ~€150-300 + €72.99 are scattered across five `cost` tiles), and no view
renders `verified_on`, so `journey.json:223`'s "As of the table dated 4 August 2026… a 54-day backlog" will
read as current in November while being wrong.
**Files:** `src/js/state.js`, `src/js/views/{journey,exam,stats}.js`, `src/data/journey.json` · **medium**

### S12. The phrases drill tests the wrong thing
The practical exam is German-only, so misunderstanding one spoken command is a fail, and this drill is the only
defence — but distractors are drawn from the *entire* phrase set, so they are eliminated without parsing the
German; the session is `shuffle(all).slice(0,12)` with no memory, so a phrase failed every time appears as
often as one known for weeks; and nothing is persisted per phrase. Make **recall** the default (show `de`,
"Show what it means", then ✓/✗ self-grade), add `state.phrases` keyed on `item.de` with the same
`{box,right,wrong,last}` shape reusing `isDue`/`BOX_INTERVAL_DAYS` and M3's due-gating, order the session like
`pickPractice`, and if MC is kept, draw distractors from the **same group** first. Only claim "You would
understand your examiner" after a 100% recall run. Also: a ~60-second repeatable drill currently pays up to
60 XP and keeps the streak alive with zero recall — reprice it. (`phrases.js:6` imports `state` unused.)
**Files:** `src/js/views/phrases.js`, `src/js/state.js` · **medium**

---

## NICE

- **N1. Dark mode, step 1 only — tokenisation, shipped with no dark theme attached.** 14 hardcoded light values
  block a token flip (`#ece6d8`, `#e7e0d0`, `#eadfc4`, `#cbc3b1`, `#cfc8b8`, `#fff` option boxes,
  `rgba(255,255,255,.92)` header, two `.tabs` values, `#ffe9a8` selection), five `*-soft` backgrounds each
  paired with a hardcoded dark text colour, and four components using `--ink` **as a background** with
  `color:#fff`. Introduce `--track`, `--edge`, `--ink-on`, `--header-bg`, `--tabs-bg`, `--on-*-soft` pairs,
  explicit `color` on every `.callout`, and the nine soft borders. Skip the `ui.js` `trackColor` default (a dead
  value, and `var()` in a presentation attribute would not resolve). Hold the actual dark theme until this has
  landed and the countdown/exam banner/callouts can be audited. `signs.js`'s 41 `#fff` / 18 `#111` fills are
  real German sign colours and must **never** be tokenised. Follow the OS, no toggle. **large**
- **N2. Make it installable and truly offline-capable.** `src/sw.js` (~35 lines, runtime caching, no manifest to
  maintain; same-origin cache-first + revalidate, network-first with cache fallback for `unpkg` and
  `tile.openstreetmap.org`), registered behind an `'serviceWorker' in navigator` check; plus a web app manifest,
  `theme-color` and `apple-mobile-web-app-*`. `display: standalone` removes 60-100px of browser chrome — a
  bigger viewport win than any grid rearrangement, and the missing half of M5. **medium**
- **N3. Level ladder.** Extend `levelInfo` with `nextTitle` and render "312 XP to Level 6:
  Stadtverkehr-Stratege" — the 10 German titles are the best flavour in the product and are invisible until
  earned. Defer the 10-chip strip; if it ships it must live in its own `overflow-x: auto` container. A "How XP
  works" `<details>` must be complete or absent (task +100 or more, lesson +50, mock passed +250 / attempted
  +40, first correct +10, repeat +2, phrases +5 per correct) — listing everything except the biggest source
  would mislead. **small**
- **N4. Exam ergonomics.** Remove the stopwatch pill (the real exam is untimed; the number only nudges him to
  rush on all-or-nothing multi-selects, and it jumps on re-render) and report elapsed time on the results
  screen instead. Add a flag-for-review toggle + a third `.exam-grid` state + a flag mention in the submit
  guard, and mark flagged questions in the review so his own uncertainty signal gets calibrated. Give
  `#num-input` `inputmode="decimal"` and re-render on input so typing a speed limit actually flips the grid
  cell to "answered" and moves the N/30 counter. **small**
- **N5. Places / Glossary entry points.** No view links to `#/map` or `#/glossary`, so the two weakest tabs are
  their own only entrance. Give `c-translation` `location_types: ["translator"]` so the task page gets the same
  embedded map every other located task has; link `task.js`'s `.de-term` to `#/glossary/<term>` and teach
  `glossary.js` to prefill `#q` from the ctx `params` the router already passes; add "📍 All places" /
  "🇩🇪 Glossary" to the Progress tools row. Then demote **Glossary only** to a card at the top of Learn,
  leaving five tabs at ~78px; keep Places until the task-level entries have been in use. Keep both routes
  registered. **medium**
- **N6. Lapse-and-return.** Nothing acknowledges a two-week gap: the clock shows a smaller red number, the
  streak (post-M2) shows 0, and the queue hands him a full backlog. Offer a reduced re-entry session and one
  line of "welcome back — here's the short version". For a 3-6 month product this is the failure mode most
  likely to end the project. **small**
- **N7. Error log.** `state.quiz[qid]` stores `{box,right,wrong,last}` and never what he chose, so no view can
  ever say "you keep picking the wider-road option on rechts-vor-links". Store the last wrong selection per
  question — a few bytes for the only genuinely personal feedback the app could offer. **small**
- **N8. Zero-XP demoralisation.** `recordAnswer` returns 0 XP for a wrong answer, so a 2/10 round renders
  "+2 XP" and a 0/10 round "+0 XP" beside a 🌱 — the session where he most needs a reason to return is the one
  the reward system rates near zero. Effort credit, or hide the tile below ~30%. **small**
- **N9. Lazy task map + tile failure.** `.map-box.small` is 260px on a phone between the checklist and the
  completion button, and `renderMap` only degrades when `window.L` is undefined — cached Leaflet plus an
  unreachable tile server gives a 260px empty box with no explanation. Lazy "🗺️ Show map" button on mobile,
  `!navigator.onLine` short-circuit, a `tileerror` counter revealing "Tiles unavailable offline — use the list
  below", `.leaflet-container { background: var(--surface-2) }`, and let the box shrink when there is no map. **small**
- **N10. Per-route scroll memory.** `app.js:64` scrolls to top on *every* render, including journey → task →
  back, so every task visit costs his place in a 12-item list. Remember scroll position keyed on hash for that
  round trip only (not autoscroll-to-active-task — see S4). **small**
- **N11. Cosmetics.** Replace the 7rem/`opacity .16` hero watermark (it reads as a compression artefact) and
  scope any replacement with `.hero.journey::before`, since `.hero` is used on four screens. De-duplicate the
  three emoji collisions in `journey.json` (⚖️ on "Know where you stand" *and* "Understand your legal
  position"; 🏛️ twice; 🪪 twice). Replace the four inline hero colour overrides
  (`journey.js:108-111`, `exam.js:24`) with the existing `.hero .muted` / `.hero small` rule. Move 🔥 out of
  `stats.js:34`'s `.t-num`. Drop `#confetti`'s redundant `100vw/100vh` beside `inset: 0`. Skip the three-stop
  hero gradient simplification — self-declared noise. **small**

---

## Conflicts resolved

1. **M1's Today card vs. M8's "convert dread into a rate" vs. the IA lens' separate "theory readiness" card.**
   These are one card, built once, in `journey.js`, immediately after the clock. Three lenses proposed three
   cards in the same slot; ship one.
2. **M1's readiness threshold vs. M3's slower promotion vs. the 6-month clock.** `examReadiness` requires
   `mastery >= 0.8` — 136 of 169 questions at box ≥ 3, which after M3 needs three correct recalls spanning ≥ 4
   days, i.e. ~51 days minimum at one 10-question session per day. That fits a 3-6 month window but **not** a
   user who arrives with 60 days left. Decision required before shipping M1: either lower the threshold or
   express it as "mastered or seen twice" when `clock.daysLeft` is short. Do not change `progress.js`'s tested
   arithmetic silently; if boolean gates read better on a phone, derive them **inside** `examReadiness` from
   values it already computes and export from the same function, so there is exactly one model.
3. **M3 slows every progress bar.** `learn.js`'s "14/16 mastered" and existing localStorage will look
   overstated relative to the new rule. No migration: the next answer simply will not promote unless due. State
   this in the UI via the one-line definition of "mastered" (M3.3) so the slowdown reads as honesty, not a bug.
4. **M7's `--tabs-h` correction vs. any new fixed bar.** The mobile bar is content-sized (~68px, ~74px after
   the 48px min-height) while `--tabs-h` says 56px, and `.toast` already works around it with a hardcoded
   `bottom: 108px`. Fix the token *first*; do not ship a fixed exam action bar (mobile lens finding 5) until it
   is truthful, and only render such a bar during a running exam, never on the exam landing view.
5. **M8's header clock chip vs. M7's header overflow vs. "make the stats block a link".** One resolution: the
   clock chip **replaces** the streak chip (after M2 the streak decays and Progress shows it in full), the level
   chip hides under 420px, and the header-stats block only becomes tappable **after M4** — until the attempt is
   persisted, every extra header target is another way to destroy 25 minutes.
6. **S4's `<details>` collapse vs. the per-card timeline spine.** Both rewrite the same phase loop and the spine
   must not dangle inside a collapsed phase. One commit, spine scoped per `.task-card`, `position: absolute`
   mandatory (otherwise the pseudo-element becomes a flex item). Also handle the all-phases-complete case, or
   the page collapses into apparent emptiness.
7. **S1's checkpoints vs. S2's three-state reveal vs. M3's next-review line — all three touch `quiz.js`'s
   reveal block.** Order: M3 → S2 → S1, and extract the shared `revealAnswer()` helper **once**, in S1, rather
   than leaving three copies. Checkpoints must use `.cp-check`, never `#check-btn`.
8. **S5's step splits vs. saved tick positions.** `toggleTaskStep` stores by array index. The migration ships in
   the same commit as the splits, not after.
9. **S6's do-line vs. S4's journey card density.** The same one-line `do` field feeds both the task page and
   the journey card; author it once in `journey.json`.
10. **exam.js is edited by M1, M4, M6, S2 and N4.** Sequence M1+M6 (both render-path), then M4 (state), then S2,
    then N4. Do not parallelise; the file is 181 lines and every item rewrites `finish()` or `renderExamQ()`.
11. **"Remove confetti from lesson completion" vs. "don't take something away".** The `+50 XP` toast at
    `learn.js:118` already fires; keep it and the XP chip so the moment is still acknowledged.
12. **Rejected on re-verification — do not implement:** the `--amber` heading-contrast and `.btn-primary` AA
    failures (already handled via `--amber-text`/`--red-dark`, with a code comment explaining exactly this);
    `flex-wrap: nowrap` on the header (turns a wrap into a horizontally scrolling document at 360px);
    the "Nunito weight 600 is downloaded and discarded" argument (one variable font, zero payload difference);
    `.badge-card.locked small` colouring (already inherits `--muted` and carries `class="muted"`);
    the hero gradient simplification.

---

## The three best impact-to-effort changes

1. **M1 — wire `engine/progress.js`.** 119 already-written, already-tested lines that answer the app's two
   unanswered questions ("what today?", "am I ready to book?") are reachable with a few dozen lines of import
   and template work across four views. Three lenses independently proposed *writing* these functions from
   scratch; none noticed they exist. Highest value per line in the entire plan, and it is the change that makes
   the product a study *coach* rather than a study *archive*.
2. **M2 — two lines in `state.js`.** Importing `isoDay` and adding read-time streak decay fixes a UTC calendar
   bug that silently breaks real streaks (and can award the 7-day badge on six days), and stops the app's only
   daily signal from confidently displaying a streak he has already lost. Every "today" feature in M1 and M8
   inherits the bug, so this is a prerequisite disguised as a nitpick.
3. **M5's first line — delete `{ cache: 'no-cache' }`.** One option object is the difference between a fully
   functional offline app and a blank journey with a dead legal countdown on the U-Bahn, on files that are
   already sitting in the HTTP cache. The `force-cache` retry and the honest offline copy are another ~15 lines.

Honourable mention: **S3** is pure copy and one derived counter, and it delivers the single most
morale-changing verified fact in the repo — he may sit the theory exam **in English or Italian** (`rules.json`,
asserted by `tests/data.test.mjs:134`), which the app has never told him.

---

## Test and hook risk

`npm test` = 51 assertions in 4 files, all engine/data. **No DOM tests exist in this repo**, so the listed hooks
are enforced only by whatever external browser checks exist — treat them as a contract regardless.

| Risk | Item | Mitigation |
|---|---|---|
| `data.test.mjs:93` requires every task to have a non-empty `steps` array | S5 (removing "accept this fact" steps) | `c-verdict` must keep its one real step |
| `data.test.mjs:103` parses `state.js` with `/\{\s*id:\s*'([a-z0-9-]+)'/` and requires `known.size > 10` and every `journey.json` `badge` to exist, `referenced.length >= 5` (currently 7) | S10 | Deleting the 4 unearnable badges leaves 15 — safe. Any **added** `badge:` field must exist in `BADGES`. Do not reformat the `BADGES` literal. |
| `data.test.mjs:134` pins `recognition_months: 6`, `conversion_deadline_months: null`, `max_error_points: 10`, and English/Spanish/Italian in `exam.languages` | S3, S11 | Read `rules.json`, never "tidy" it. A number in `conversion_deadline_months` would resurrect the debunked three-year rule. |
| `data.test.mjs:146` floors glossary at 50 and phrases items at 25 | S5, S12 | Additions free; deletions are not |
| `data.test.mjs:79/113/121` regex-parse `signs.js`'s `SIGNS` literal and `map.js`'s `'type': { color` lines | N5 (`location_types: ["translator"]`), N9 | Do not reformat those literals; confirm `translator` is a styled type before adding it |
| `data.test.mjs:19/24` — manifest must match files on disk; `sections >= 3`, `key_takeaways >= 3` | S1 | Checkpoints add DOM, not JSON; don't remove sections |
| `data.test.mjs:60` — multi-correct > 25%, all-three < 10% | — | Don't rewrite question option sets |
| `scoring.test.mjs:99` "pickPractice prefers due and new questions and respects count" | M3's fresh-question floor | It asserts inclusion and count, not exact order — but run the suite; keep the floor inside `pickPractice`, and leave `isDue`/`masteredCount` semantics untouched (promotion changes live in `state.js`) |
| `progress.test.mjs` (14 tests) pins signatures and bands | M1 | **Add** `nextDueAt`; do not change existing signatures or the 0.45/0.40/0.15 weights without updating tests deliberately |
| `deadline.test.mjs:16` asserts `isoDay` is local | M2 | Importing it into `state.js` is exactly what the test protects |
| `#start-btn` | M4 | The Resume card is rendered *above* the hero; `#start-btn` stays present with unchanged behaviour |
| `#check-btn` | S1 | Checkpoints use `.cp-check`. `#check-btn` stays unique to `quiz.js`. |
| `.option` | S2 | Class stays the hook; the "missed" state is a `data-mark` attribute |
| `[data-nav]` | M7 (scroll strip), N4 (flag state) | All 30 buttons stay in the DOM in the same order; only layout and an extra class change |
| `#res-input` | S9 | Id preserved (it is onboarding's; `#res-inline` is the journey's). Note the lens' "test hooks" justification was wrong — no test references either. |
| `[data-path]` | **S9 — real risk.** The buttons stop navigating (select-then-submit) | If an external check asserts that clicking `[data-path]` lands on `#/journey`, it must be updated in the same PR. Keep the handler on click and the submit button adjacent. |
| `.task-card` | S4 | Cards inside a closed `<details>` remain in the DOM and queryable — assert **presence**, not visibility |
| `.module-card`, `.gloss-item`, `#view` | M1, N5 | Untouched: `moduleMastery` changes order only; glossary prefill uses `#q` |
