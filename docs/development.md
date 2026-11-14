# Developing Führerschein Hero

This page holds what is specific to this repository: how to run the app and its tests, the accuracy
rule for legal facts, the code style, and the checklist to work through before you open a pull
request. The general rules (an issue first for bigger changes, one change per pull request, signed
commits, squash merges, imperative commit messages that say why) live in the shared
[contributing guide](https://github.com/agusgonzaleznic/.github/blob/main/CONTRIBUTING.md), and
participation is governed by the shared
[Code of Conduct](https://github.com/agusgonzaleznic/.github/blob/main/CODE_OF_CONDUCT.md). How to
report a security problem is in the shared
[security policy](https://github.com/agusgonzaleznic/.github/blob/main/SECURITY.md); what this app
does and does not defend against is in [`security-posture.md`](security-posture.md).

This project tells people in Berlin what the law requires of them and how long they have left to act
on it, so contributions are welcome and the bar for factual changes is deliberately high.

Please read [the accuracy rule](#the-accuracy-rule) before changing any legal fact, fee, deadline or
procedure. It is the single most important guideline in this document.

## Quick start

There is **no build step and nothing to compile**. The app is hand-written ES modules and CSS, so
you serve `src/` with any static file server and open it.

```bash
git clone git@github.com:agusgonzaleznic/drive-berlin.git
cd drive-berlin
npm run dev            # python3 -m http.server 4173 -d src
# → open http://localhost:4173
```

That is the whole development loop. Edit a file, reload the page. There is no bundler, no
transpiler, no framework and no watch process.

**`npm install` is only needed for the browser tests.** It fetches exactly one dev dependency,
`playwright-core`. You do not need it to run the app or to run `npm test`.

If you have no `python3`, any static server works:

```bash
npm run dev:node                  # npx serve -l 4173 src
npx http-server src -p 4173
php -S localhost:4173 -t src
```

**Serve over `http(s)://`, never `file://`.** The `file:` origin blocks ES modules and blocks
`fetch()` of the JSON data files, so the app will simply not start.

## Tests

**All suites must pass before a pull request will be considered.** No exceptions, including for
documentation-only changes, because the data files are loaded by the tests.

```bash
npm test              # unit suites, no browser needed
npm run test:all      # everything below except contrast, including the full course walkthrough
npm run test:contrast # run this separately, see the note underneath
```

| Command | Covers | Expected |
|---|---|---|
| `npm test` | Exam scoring, deadline maths, the progress engine, data integrity, security primitives | **82 tests**, all passing |
| `npm run test:browser` | Every route in real Chrome plus a full mock exam, failing on any console error | 34 checks, 0 errors |
| `npm run test:course` | End-to-end walkthrough of the entire theory course | roughly 480 checks |
| `npm run test:a11y` | Keyboard navigation and `prefers-reduced-motion` | 8 assertions |
| `npm run test:contrast` | Measured WCAG 1.4.3 contrast ratios and touch-target sizes on every screen | all text passes |
| `npm run test:csp` | CSP violations, plus Leaflet, map tile and vendored font loading | **0 violations** |

> **Note:** `npm run test:all` chains the unit suites, the link check, and the browser, accessibility,
> CSP, consent, emoji-scan and course suites. It does **not** include `test:contrast`, which is a
> separate command. If your change touches CSS, colour tokens, or the size of any control, you must
> run `npm run test:contrast` too and say so in the pull request.

Two things to expect:

* **The course walkthrough total moves by a few checks between runs.** The mock exam composes a
  fresh 30-question paper each time, and the number of per-question assertions varies with it. Any
  non-zero `failed` count is a real failure.
* **Browser suites drive your system Chrome through `playwright-core`**, so there is no 300 MB
  browser download. They also disable the HTTP cache over CDP, because stale ES modules once made a
  fixed bug look unfixed.

If a test fails, work out which side is wrong before changing anything. On this project the *test*
has been wrong three times, including one question where all three options are legitimately
correct. Verify the direction of the error first.

## The accuracy rule

**This is the guideline that matters most.**

The app tells people about statutory deadlines where being wrong can cost them the right to drive.
Under **§ 29 Abs. 1 FeV** a non-EU licence is recognised for six months after the holder
establishes ordinary residence, and once that lapses, driving on it is *Fahren ohne Fahrerlaubnis*,
a **criminal offence under § 21 StVG**, not a fine. A study app that invents a legal deadline is
worse than no app at all.

So the governing constraint of this project is: **assume freely about implementation, never about
content.**

### Every factual change needs a primary source

Any change to legal facts, fees, deadlines or procedures **must** cite a source, in the pull request
and, where the file supports it, inline in the data or document itself. Sources rank in this order,
and a lower tier never overrides a higher one:

| Tier | Source | Weight |
|:--:|---|---|
| **1** | **Primary law on [gesetze-im-internet.de](https://www.gesetze-im-internet.de)**: FeV, StVG, StVO, GebOSt and their annexes (*Anlagen*) | Authoritative |
| **2** | **Official Berlin sources**: [service.berlin.de](https://service.berlin.de), LABO pages and trackers | Authoritative for local procedure |
| **3** | **Examining organisations and motoring bodies**: DEKRA, TÜV, ADAC | Good for practice and process |
| **4** | **Commercial or journalistic sources**: driving-school sites, news articles, blogs | **Weak evidence. Must be flagged inline** |

Rules that follow from that hierarchy:

* **Quote statutory text verbatim in German rather than paraphrasing it.** Paraphrase is where
  errors enter. Cite the paragraph you actually read, and if you cannot tell whether a provision is
  *Satz 3* or *Satz 4*, cite the *Absatz* rather than guessing the sentence number.
* **Link to the specific provision or page, not a site homepage**, and make sure the source actually
  states the corrected value. For a statute, the consolidated text on gesetze-im-internet.de is the
  ideal link, for example `https://www.gesetze-im-internet.de/fev_2010/__29.html`.
* **A tier 4 source alone is not sufficient** for a legal claim, a deadline or a statutory fee. It
  is acceptable for a provider's own price or opening hours, and it must be marked as unverified
  where it is used.
* **Claims that cannot be confirmed against a primary source do not ship.** Mark them
  **⚠️ unverified** at the point of use, or leave them out. Do not quietly downgrade a sourced
  number to a plausible one.
* **The app is built to show nothing rather than an unsourced number.** For example
  `licenceClock()` returns `null` and the UI stays silent when no recognition period can be sourced
  for a licence country. Preserve that behaviour. Never add a fallback default to make a screen look
  complete.
* **Re-check dates.** Every document in `docs/knowledge-base/` is stamped with the date its sources
  were read. If you are updating a claim, update the stamp, and say in the pull request which date
  you read the source on. (Fees and waiting times change constantly, so the date matters.)

Corrections are extremely welcome, including corrections to things currently in the app. Several
widely repeated claims did not survive verification here, such as the phantom "three-year rule" for
converting a licence, which exists nowhere in FeV §§ 28 to 31 or Anlage 11. If you can show
something else is wrong with a primary source, please do.

### Reporting a wrong fact

A report about a wrong legal fact, fee, deadline, address or procedure is the most valuable kind of
report this project receives. Use the **Incorrect information** form, which you reach through
[the issue chooser](https://github.com/agusgonzaleznic/drive-berlin/issues/new/choose). It asks for
the claim as it currently appears (quoted), where it appears, the correct information, a source
link, and the date you read the source.

When you fill it in:

* **Say where the claim appears**: a file path, a screen, or both. For example `src/data/rules.json`,
  or `docs/knowledge-base/prerequisites.md`, or "the Journey view, phase 2, first-aid task".
* **Give the highest-tier source you can reach**, and flag the tier of every further source. If a
  source is commercial or journalistic, say so.
* **If you cannot find a primary source but you are fairly sure something is wrong, open a
  [bug report](https://github.com/agusgonzaleznic/drive-berlin/issues/new/choose) describing the
  doubt instead**, rather than filling the source field with a guess. Flagging an uncertain claim is
  useful on its own.

### Legal periods live in data, never in logic

**All legal periods belong in [`src/data/rules.json`](../src/data/rules.json).** Never hardcode a
month count, a deadline, a fee or a validity window into a function. The engine reads periods from
that file so there is exactly one place to audit, one place to correct, and no plausible-looking
constant hiding in a helper. If a period is absent from `rules.json`, the correct behaviour is to
render nothing.

## Code style

Deliberately boring, and that is a feature:

* **Vanilla ES modules.** No framework, no bundler, no transpiler, no JSX.
* **Hand-written CSS with custom properties.** No preprocessor, no utility framework. Design tokens
  live in `src/css/base.css`.
* **Zero runtime dependencies, and please keep it that way.** The only dev dependency is
  `playwright-core`. A pull request that adds a runtime dependency, or that fetches script, CSS or a
  font from a CDN, needs a very strong argument and will usually be declined. Third-party assets are
  vendored into `src/assets/` on purpose, so that the CSP's `script-src` gains no new origin and no
  external host can substitute hostile code or observe visitors. Until a visitor opts in to
  analytics, map tiles are the sole third-party request.
* **Keep files under 500 lines.** Split by responsibility if you are approaching it.
* **Match the surrounding code.** Naming, comment density and idiom should be indistinguishable
  from the file you are editing. Engine functions carry a `CONTRACT` JSDoc block stating what
  callers may rely on. If you change one, update the contract and the matching assertions in
  `tests/`.
* **Pure logic stays in `src/js/engine/`** and touches no DOM. That is what makes it unit-testable
  without a browser.
* **No emoji in rendered UI.** `tests/emojiscan.mjs` enforces this. Use the vendored Lucide icons
  or the inline SVG sign set.

## Accessibility

**Contrast is measured, not eyeballed.** `npm run test:contrast` computes real WCAG 1.4.3 ratios and
touch-target sizes in a live browser on every screen.

* **Do not regress it.** If you change a colour, a token, an opacity or a control size, run the
  contrast suite and report the result.
* Note that `--line-control` exists solely so focusable control borders clear 3:1 for WCAG 1.4.11.
  Do not repurpose it.
* Opacity-based `:disabled` styling is banned here. It measured 2.78:1 once, below AA, so disabled
  controls now have an explicit skin.
* **Respect `prefers-reduced-motion`.** Every animation must be disabled or reduced under it, and
  `npm run test:a11y` checks this. The celebration and confetti layers are included.
* Keep the app usable by keyboard alone, and keep the responsive layout working down to 390 px.

## Proposing a change

The shared contributing guide says to open an issue first for anything bigger than a small fix. For
this project the forms to use are:

* **Bug report** for anything broken.
* **Incorrect information** for a wrong legal fact, fee, deadline or procedure. See
  [reporting a wrong fact](#reporting-a-wrong-fact). A source link is required.
* **Feature request** for new functionality.

### Hard non-goals

These are architectural commitments rather than a backlog. A proposal that needs any of them will be
declined regardless of merit:

* **No backend and no server-side state.** Local-first is the privacy guarantee.
* **No accounts, no sign-in and no cloud sync.**
* **No build step, no bundler and no runtime dependencies.** The app must keep running unbuilt,
  straight from a static file server.

Also out of scope: a German-language UI, since English-language access is the entire point, and the
official question catalogue, which is licensed.

A good feature request describes the situation you were in rather than the solution (who is stuck,
and on what), proposes what the app should do instead, and lists the alternatives you considered,
including doing nothing. If an existing feature nearly covers it, say which one and why it falls
short. If the feature would state any legal fact, fee, deadline or procedure, a primary source is
required for each one, and the app shows nothing rather than an unsourced number.

### What to put in a bug report

* **The route** in the address bar if you know it (for example `#/exam`), and numbered steps to
  reproduce.
* **Browser and operating system**, with version numbers, and say if you are on a phone. For
  example "Firefox 141 on macOS 15.6" or "Chrome 139 on Android 15".
* **Whether it still happens after clearing `localStorage`.** This matters a lot. All state lives in
  your own browser, so corrupt or outdated saved progress is a real failure mode, and it points at a
  completely different bug from a broken view. **Export your progress first if you want to keep
  it.** Then clear storage from your browser devtools, under Application or Storage, and reload.
* **Console errors.** Open your browser devtools, go to the Console tab, reload, and paste anything
  red, with the full stack trace if there is one. This is usually the single most useful detail.
* Anything else that helps: screenshots, a redacted progress export, the screen width if it looks
  like a layout problem, and whether you have `prefers-reduced-motion` enabled.

Wrong legal information goes to the Incorrect information form instead, and security problems never
go in a public issue (see the shared security policy).

## Writing style

* **The content is written for English speakers**, since English-language access to this process is
  the entire point of the project. German terms appear as terms of art, italicised on first use,
  with a translation and a glossary entry.
* **Use British English spelling** throughout, matching the existing documents. So "licence" for the
  noun, "recognised", "organisation", "metre".
* Be direct and specific. State the number, the section of law, and the address. Avoid marketing
  language, and avoid hedging where a primary source is clear.
* **Do not use em dashes in prose.** Split the sentence, or use a comma or a colon instead. This
  applies to documentation, code comments and UI copy alike. `npm run check:links` enforces it for
  `README.md`, this page and `security-posture.md`.

## Commit hygiene

* **Do not add `Co-Authored-By` trailers, and do not add AI-tool attribution lines** such as
  "Generated with" or "Co-Authored-By: an AI assistant" to commits. `Co-Authored-By` carries
  authorship meaning under git and GitHub convention, and a tool is a facilitator rather than an
  author. Use whatever tools you like, and leave them out of the commit trailer.
* Branch off `main`.

## Licensing of contributions

This repository is dual-licensed: MIT for code and CC BY 4.0 for content, depending on the paths you
touch. The table of paths, and the agreement you make by opening a pull request, are in the
[README](../README.md#contributing-under-these-licences).

## Before you open a pull request

Work through this list, and **tick honestly. An unticked box with an explanation underneath is far
more useful than a ticked box that is not quite true.** Copy it into the pull request if it helps.

### Tests

- [ ] `npm run test:all` passes locally, with a `failed` count of zero in every suite.
- [ ] `npm run test:contrast` passes, **or** this change touches no CSS, colour token, opacity or
      control size. (It is not part of `test:all`, so it needs running separately.)
- [ ] I checked which side was wrong before changing anything, if a test failed.

### Accuracy

- [ ] Every new or changed legal fact, fee, deadline or procedure cites a **primary source**, linked
      in this pull request and inline where the file supports it.
- [ ] Statutory claims quote the German text verbatim rather than paraphrasing it, and cite the
      *Absatz* rather than guessing a sentence number.
- [ ] Anything a primary source could not confirm is marked **⚠️ unverified** at the point of use,
      or left out entirely. Nothing unsourced reaches the screen.
- [ ] I updated the date stamp on any `docs/knowledge-base/` document whose sources I re-read.
- [ ] **No legal period is hardcoded.** All periods, deadlines and validity windows live in
      `src/data/rules.json`, and absent values render nothing rather than a default.

### Code and dependencies

- [ ] **No new runtime dependency, and no new CDN reference.** Third-party script, CSS and fonts stay
      vendored under `src/assets/`, so the CSP's `script-src` gains no new origin.
- [ ] No build step, bundler or transpiler was introduced. The app still runs unbuilt from a static
      file server.
- [ ] Every file I touched is still under 500 lines, and matches the surrounding naming, comment
      density and idiom.
- [ ] I updated the `CONTRACT` JSDoc block and its matching assertions in `tests/` for any engine
      function whose behaviour I changed.
- [ ] No emoji in rendered UI.

### Accessibility

- [ ] Contrast is **not regressed**, measured rather than eyeballed. Result of
      `npm run test:contrast` noted in the pull request if this touches anything visual.
- [ ] All animation respects `prefers-reduced-motion`.
- [ ] Still fully usable by keyboard, and the layout still works down to 390 px.

### Commit hygiene

- [ ] **No `Co-Authored-By` trailer, and no AI-tool attribution line** of any kind in any commit
      message.
- [ ] **No em dashes in prose**, in documentation, code comments or UI copy. Sentences restructured
      instead.
- [ ] British English spelling, matching the existing documents.

### Licensing

- [ ] I have read [the licensing of contributions](../README.md#contributing-under-these-licences)
      and understand which licence covers the paths I changed.
- [ ] I have the right to contribute this, and any text copied from elsewhere is identified with its
      licence.

### What to put in the pull request

* **What changed and why.** Link the issue it closes, for example "Closes #12". For a factual
  correction, say what the old claim was.
* **Test output.** Paste the summary lines. For example:

  ```
  npm test          → 82 passed, 0 failed
  test:browser      → 34 checks, 0 console errors
  test:course       → 481 checks, 0 failed
  test:a11y         → 8 passed
  test:csp          → 0 violations
  test:contrast     → all text passes  (or: not run, no visual change)
  ```

* **Screenshots**, before and after, for anything visual. Include a 390 px width shot if the layout
  changed.
* **Notes for the reviewer.** Anything you are unsure about, or deliberately left out of scope.
