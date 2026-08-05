# Lessons learned

A retrospective on building **Führerschein Hero**, a gamified, English-language app
that guides one person through converting an Argentine driving licence into a German
one in Berlin, and teaches the theory exam along the way.

**What was built:** a static site with no build step and no runtime dependencies;
59,600 words of sourced knowledge base over 21 raw research files; 169 exam-style
questions across 11 fact-checked modules; 84 locally stored icons; 55 unit tests, 32
browser checks and 8 keyboard checks.

**How:** seven multi-agent workflow runs, 73 completed agent invocations, and a
number of failed ones. Roughly half the total effort went into *checking* work rather
than producing it, and that was the right ratio.

The lessons below are grouped by where they'd help next time. The failures are
included on purpose, because they were more instructive than the successes.

---

## 1. The most expensive mistake was a question I didn't ask

The brief said "an Italian citizen living in Berlin." I researched that: 13 agents,
1.4 million tokens, a complete legal analysis of how an **EU** licence works in
Germany. The answer to that question is "it's already valid, relax."

Then came the clarification: Argentine, with an *Italian passport*, holding an
**Argentine** licence. That inverts everything. A non-EU licence is recognised for
six months and then driving becomes a criminal offence under StVG § 21. The correct
answer wasn't "relax," it was "you have a hard deadline and you owe two exams."

**The lesson:** nationality and a document's country of issue are independent facts,
and a task can hinge on both. I had one and assumed the other. When a request
mentions a person's status, ask separately what documents they actually hold before
committing research effort.

**What limited the damage:** the theory-exam, practical-exam, prerequisite and cost
research was persona-independent and survived intact. Structuring research by
*domain* rather than by *conclusion* meant only the legal-track work had to be redone.

---

## 2. Adversarial verification found more than generation did

Every research and review workflow paired a producer with a verifier told to *refute*
rather than confirm, and to report what the producer **missed**. That "missed" list
was consistently more valuable than the producer's own findings.

Things it caught that would otherwise have shipped:

- A first-aid course price of €59.99 copied from a **stale homepage banner**; the real
  online price is €72.99.
- An eye-test fee of €6.43 that was **abolished in 2019**.
- A photo price 60% too high (€5.95, not €9.95–14.95).
- ADAC's "Klassifizierung" sold as a Berlin requirement when the word appears
  **nowhere** on Berlin's checklist. It's an upsell.
- The dangerous one: I had described the *Prüfbescheinigung* handed over after the
  practical exam as the document that lets you drive. For a third-country conversion
  it isn't. The verifier called this "the single most dangerous error in the
  researcher's output," and it's now the app's loudest warning.
- In the design review: an onboarding screen that was **keyboard-inaccessible**,
  making the entire app unreachable without a mouse; a streak counter that displayed
  a streak the applicant had already lost; four badges that could never be earned.

**Why it works:** an agent asked to "suggest improvements" optimises for
plausible-sounding suggestions. An agent asked to refute a *specific* claim has to
open the file. That's where defects live.

**Practical form:** ask the verifier for verdicts *and* omissions. Budget attention
for the omissions.

---

## 3. My tests were blind in exactly the places bugs lived

Three times, a test passed while a real defect sat next to it, always because the
test checked *one instance* of a class of thing and I read that as covering the class.

| Test | What it checked | What it missed |
|---|---|---|
| Horizontal overflow | the journey page only | the **lesson** page scrolled sideways for days, the screen used most |
| Colour contrast | enabled controls | **disabled** buttons measured 2.78:1 |
| Contrast, again | text on solid fills | **control boundaries** failed 1.4.11 systemically at 1.4–2.3:1 |

The overflow one stings most: I wrote that test *because* I'd found an overflow bug,
and then pointed it at a single route. It now checks all eight.

**The lesson:** when a test finds a bug, ask what *category* the bug belongs to and
cover the category. One passing instance is not evidence about a class.

---

## 4. Verify the instrument before trusting the measurement

Two of my own tools lied to me, and both times I nearly "fixed" healthy code.

**The contrast script reported the hero card at 1.1:1.** It read
`getComputedStyle().backgroundColor`, which is *transparent* for an element whose
background is a gradient, so it walked up the tree and landed on white. The hero is
actually 12.6:1. I fixed the script, not the design.

**Chrome was serving cached ES modules across reloads.** CSS edits appeared; JS edits
didn't. Some visual verification was reading stale code, which is worse than no
verification because it looks like evidence. Every test script now disables the HTTP
cache via CDP.

**The lesson:** when a measurement contradicts your expectation, one hypothesis is
always "the instrument is wrong." Check that before acting.

---

## 5. Checking the exit code is not checking the result

`curl` without `-L` returned **HTTP 200 with a body of "Redirecting to…"**. My loop
reported 62 successful downloads, and every file was a redirect notice saved with an
`.svg` extension. The fix was one flag; the lesson is that a successful *transfer* is
not a successful *fetch*. I now grep the content (`head -c 200 | grep -q '<svg'`)
rather than trusting the status.

Adjacent, same session: zsh doesn't word-split unquoted variables the way bash does,
so `for i in $ICONS` iterated **once** over the whole string and tried to create a
file with a 500-character name. Shell dialect matters when the harness's shell isn't
the one you had in mind.

---

## 6. Over-broad CSS selectors cause action at a distance

Two self-inflicted layout bugs, both from a selector wider than its intent:

- `min-width: 0` on `.module-top > div`, where the **icon** is also a `div`, so `flex: 1`
  stretched a 44px icon box to 390px.
- `display: block` on `.module-card b` for card titles, which also matched the `<b>`
  inside "0/15 mastered" and split it across two lines.

Both took a DOM probe to diagnose because the *symptom* appeared far from the *cause*.
Scoping to `.module-top > div:not(.module-icon)` and `.module-top b` fixed them.

**The lesson:** name what you mean. A selector that describes a *region* plus an
*element type* will eventually match something you didn't picture.

---

## 7. Pick the tool that can actually run the thing

I reached for jsdom first to smoke-test the UI. jsdom **cannot execute
`<script type="module">`**, so every route rendered as the onboarding screen and every
assertion failed identically, which at least looked suspicious rather than plausible.
Switching to real Chrome via `playwright-core` (driving the already-installed browser,
no 150MB download) turned the suite into something that catches real bugs: it found
the mobile overflow, the contrast failures and the touch-target sizes.

Related: identical file sizes across 22 screenshots was the tell that my capture
script had seeded `localStorage` but never reloaded, so the app never read it. **Look
at the artefacts, not just the exit status.**

---

## 8. A colour that works as a fill often fails as text

The single most reusable design lesson. `#f2a30c` amber is perfectly good as a bar
fill or a border, and **2.1:1 as text on white**, unreadable. It was being used for
the countdown headline and the big day-count: the most important element in the app.

The fix was structural rather than a one-off tweak: **two families per hue**, one for
fills and one for text, with the measured ratio written into the token file as a
comment. Same for buttons. White on `#16a24a` is 3.33:1 and fails, so button
backgrounds use the darker family.

The dark redesign inverted which colours are safe but *not* the principle. And it
moved the failure modes:

- Opacity-based dimming (`.btn:disabled { opacity: .45 }`) composites **both** label
  and fill toward the page, giving 2.78:1. Disabled states need an explicit skin, and it
  matters most there, because the disabled label is the text explaining why tapping
  does nothing.
- Control **boundaries** need 3:1 in their own right (WCAG 1.4.11). On a dark ground
  a tasteful hairline border is often 1.4:1.

---

## 9. Restricting the display face is what made it feel special

Studying the reference site produced one measurable insight worth more than the
palette: its fantasy display face appears on **58 nodes** against ~1000 body nodes.
Roughly 5%.

My first pass used Cinzel for headings *and* card titles *and* German terms *and*
table headers. Two things went wrong at once: German compound nouns wrapped to three
lines because the face is inscriptional and wide, **and** the face stopped feeling
like an event. Pulling it back to headings and primary CTAs fixed the layout and the
feeling with one change.

**The lesson:** scarcity is a design mechanic, not a limitation. The same applied to
gold (one accent, used only where it means "do this next") and to confetti, where seven
call sites firing the same full-screen burst meant reading a lesson felt identical to
passing an exam.

---

## 10. Emoji are three problems wearing one costume

Dropping them was requested for maturity, and there were two further reasons:

1. They render differently on every platform, so the visual system isn't yours.
2. Screen readers announce them as words: *"party popper Every waypoint cleared."*
   *"floppy disk Export progress."*

Replacing them with a locally stored, permissively licensed icon set (Lucide, ISC)
solved all three. Two implementation notes that paid off: rendering from a generated
module rather than files means **zero extra network requests**, and using
`currentColor` means an icon is automatically the colour of the text beside it, so no
per-context overrides.

Mapping emoji → icon names in one module also meant the content files never had to be
rewritten, and an unmapped emoji degrades to the character instead of vanishing.

---

## 11. Look at your artwork at the size it will be used

The emblem took three attempts, and only a **contact sheet at 20/24/30/48/96px**
revealed why:

- v1: fine perspective dashes → an illegible smudge below 30px.
- v2: legible, but the circle above the road's taper read as a **head**. The mark was
  an exclamation mark in a warning triangle, or a pedestrian sign.
- v3: horizon as a bar instead of a circle. Reads as a road at 20px.

Inspecting v2 at one size would have shipped it. **Render at every size you'll
actually use, and ask what else the shape could be mistaken for.**

---

## 12. "Refuse to display it" beats "show a plausible default"

The instruction *"make assumptions if you have to but not on the content and
knowledge"* was the most useful constraint in the project, and it produced a concrete
architectural decision: legal periods live in `data/rules.json`, never in JavaScript,
and the UI renders an honest *"Deadline tracking not active yet"* when the value is
absent.

For a while the app shipped with no countdown at all. That was correct. A wrong
recognition deadline could lead someone to commit a criminal offence, and there is no
plausible default for that.

The same rule applied to unresolvable conflicts. Two verification passes cited the
six-month rule as `§ 29 Abs. 1 Satz 3` and `Satz 4`. Rather than pick one, the app
cites the paragraph and quotes the German text verbatim. **Don't manufacture precision
you don't have**, and say in the data file *why* the precision is missing.

---

## 13. Sometimes the test is wrong, not the code

Twice a failing test turned out to be the thing at fault, and both are worth
recording because the reflex is to change the code:

- A question with **all three options correct** failed my "must have 1–2 correct"
  assertion. The content was legally accurate and the real catalogue does include such
  questions. My assertion was an invented constraint. I relaxed it and added a
  separate guard that the format stays rare.
- A readiness test expected "ready" from a history containing a 26-error-point
  failure. The engine refused. The engine was right. That failure *is* inside the
  three-exam window, so I rewrote the test and added one pinning down the
  consistency requirement deliberately.

**The lesson:** when a test fails, ask which side encodes the better belief. Then let
the test document the decision, since `readiness refuses "ready" without passed mock exams`
is worth more as a test name than as a comment.

---

## 14. "Done" at the unit level is not done at the product level

`engine/progress.js` was written, exported five functions, had 14 passing tests, and
was **imported by nothing**. The spaced-repetition scheduler knew exactly how many
questions were due; no screen ever said so. The app had no concept of *today* and no
answer to the question that actually costs money: *am I ready to book the real exam?*

I wrote it intending to wire it after the design review, and the review's verifier
found it as dead code. Fair. The fix was a few dozen lines.

**The lesson:** a tested module is not a delivered feature. Track "reachable from the
UI" as its own state.

---

## 15. Operating multi-agent work: what actually broke

Practical notes for next time.

- **Image budgets are real.** Feeding 13 agents 26 full-page PNGs (several over 1.3MB,
  one 3,965px tall) stalled every one of them and killed a whole workflow after ~3.5
  hours. Compact viewport JPEGs at ~100KB, 3–4 per agent, worked fine.
- **Expect the synthesis step to be the one that dies.** It ran last, on the largest
  context, and failed to a 529 on both the design review and the redesign spec. Be
  ready to assemble the plan by hand, and note that one lens agent wrote a better
  consolidated plan on its own initiative than the synthesiser would have.
- **File-writing side effects make failures recoverable.** Agents reported as failed
  had already written their raw JSON before dying on the final structured-output call.
  Two 100KB research files were sitting on disk marked "failed." Always have agents
  persist as they go.
- **Resume-from-cache is what makes recovery cheap**, but only if you re-run with
  *identical* args. Changing the date string in a prompt invalidates every cache key.
- **Session limits will interrupt long runs.** Design workflows so a partial result is
  still useful, rather than all-or-nothing.

---

## 16. Security review found the same shape of bug as everything else

Added after the audit (see [security.md](security.md)), because it repeats the
pattern rather than breaking it.

The two real findings were both in the **import path**, the one place the app
accepts a file it did not write, and both were things I would have got wrong by
reasoning instead of testing. I believed `JSON.parse` was safe against prototype
pollution because it does not invoke setters. It doesn't; but the **`Object.assign`
that followed it does**, and a four-line experiment showed the target's prototype
really was replaced. The fix was easy. Knowing the fix was needed required running
the code.

The other lesson is about where escaping stops. `esc()` handles quotes and angle
brackets, so it looks like it covers `href`. It does not: a URL **scheme** passes
through escaping untouched, so `javascript:alert(1)` arrives intact. Escaping is
context-dependent, and "we escaped it" is not the same as "it is safe here."

Two smaller ones worth keeping:

- The strict Content-Security-Policy was only available *because* the app has no
  inline `<script>`. An architectural choice made for other reasons (plain ES
  modules, no build step) turned out to buy a real security property for free.
- I wrote the tests as the **specification**, each assertion maps to a line in a
  `CONTRACT` doc block on the function it tests. That made the intended behaviour
  reviewable without reading the implementation, and it is the thing I would do
  first rather than last next time.

And one process note: the five agent lenses I wanted for an independent second
opinion failed twice on API capacity, so this audit has only had one pair of eyes.
That is recorded in the document rather than glossed over, because an audit's value
depends on knowing how it was produced.

## The one-line version

Most of the value came from checking, not producing: pairing every generator with an
adversary told to refute it, distrusting my own instruments, and refusing to display
anything I couldn't source. The expensive mistake was assuming a fact I could have
confirmed with one question.
