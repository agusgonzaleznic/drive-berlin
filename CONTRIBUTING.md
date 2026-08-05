# Contributing to Führerschein Hero

Thanks for wanting to help. This project tells people in Berlin what the law requires of them and
how long they have left to act on it, so contributions are welcome and the bar for factual changes
is deliberately high.

Please read [the accuracy rule](#the-accuracy-rule) before changing any legal fact, fee, deadline or
procedure. It is the single most important guideline in this document.

## Quick start

There is **no build step and nothing to compile**. The app is hand-written ES modules and CSS, so
you serve `src/` with any static file server and open it.

```bash
git clone git@github.com:agusgonzaleznic/german-driving-school.git
cd german-driving-school
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
| `npm test` | Exam scoring, deadline maths, the progress engine, data integrity, security primitives | **73 assertions**, all passing |
| `npm run test:browser` | Every route in real Chrome plus a full mock exam, failing on any console error | 32 checks, 0 errors |
| `npm run test:course` | End-to-end walkthrough of the entire theory course | roughly 480 checks |
| `npm run test:a11y` | Keyboard navigation and `prefers-reduced-motion` | 8 assertions |
| `npm run test:contrast` | Measured WCAG 1.4.3 contrast ratios and touch-target sizes on every screen | all text passes |
| `npm run test:csp` | CSP violations, plus Leaflet, map tile and vendored font loading | **0 violations** |

> **Note:** `npm run test:all` chains the unit, browser, accessibility, CSP, emoji-scan and course
> suites. It does **not** include `test:contrast`, which is a separate command. If your change
> touches CSS, colour tokens, or the size of any control, you must run `npm run test:contrast` too
> and say so in the pull request.

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
  you read the source on.

Corrections are extremely welcome, including corrections to things currently in the app. Several
widely repeated claims did not survive verification here, such as the phantom "three-year rule" for
converting a licence, which exists nowhere in FeV §§ 28 to 31 or Anlage 11. If you can show
something else is wrong with a primary source, please do.

### Legal periods live in data, never in logic

**All legal periods belong in [`src/data/rules.json`](src/data/rules.json).** Never hardcode a
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
  vendored into `src/assets/` on purpose, so that the CSP can stay at `script-src 'self'` and no
  external host can substitute hostile code or observe visitors. Map tiles are the sole remaining
  third-party request.
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

## Licensing of contributions

This repository is **dual-licensed**, because it is mostly prose wrapped around some code. Which
licence applies to your contribution depends entirely on **which paths you touch**:

| What you changed | Paths | Licence |
|---|---|---|
| **Code** | `src/index.html`, `src/favicon.svg`, `src/css/**`, `src/js/**`, `scripts/**`, `tests/**` | [MIT](LICENSE) |
| **Content**: research, lesson prose, questions, glossary, phrases, locations | `docs/**`, `src/data/**` | [CC BY 4.0](LICENSE-CONTENT) |

**By opening a pull request you agree that your contribution is licensed under the licence that
covers the paths you changed**, on the same terms as the rest of the repository, and that you have
the right to contribute it. A pull request that touches both areas is licensed accordingly in each.

If you are copying text in from somewhere else, say so and name its licence. Note that German
statutory text quoted from gesetze-im-internet.de is an official work under **§ 5 UrhG** and is not
copyright-protected, so quoting the law verbatim is safe. Commercial driving-school prose is not.

## Proposing a change

**Open an issue first for anything non-trivial.** It saves you building something that will be
declined for scope reasons. Typo fixes and obvious one-line corrections can go straight to a pull
request.

Use the templates, which route your report to the right process:

* **[Bug report](.github/ISSUE_TEMPLATE/bug_report.yml)** for anything broken.
* **[Content accuracy](.github/ISSUE_TEMPLATE/content_accuracy.yml)** for a wrong legal fact, fee,
  deadline or procedure. This is the most valuable kind of report this project receives. A primary
  source URL is required.
* **[Feature request](.github/ISSUE_TEMPLATE/feature_request.yml)** for new functionality. Note the
  hard non-goals: **no backend, no accounts, no build step.** A proposal that needs any of the three
  will be declined regardless of merit.

**Never report a security vulnerability in a public issue.** See [SECURITY.md](SECURITY.md) for the
private reporting route.

### Pull requests

* Branch off `main` and keep the pull request focused on one thing.
* Fill in the [pull request checklist](.github/PULL_REQUEST_TEMPLATE.md) honestly. An unticked box
  with an explanation is far more useful than a ticked box that is not true.
* **Do not add `Co-Authored-By` trailers, and do not add AI-tool attribution lines** such as
  "Generated with" or "Co-Authored-By: an AI assistant" to commits. `Co-Authored-By` carries
  authorship meaning under git and GitHub convention, and a tool is a facilitator rather than an
  author. Use whatever tools you like, and leave them out of the commit trailer.
* Write commit messages in the imperative mood, explaining why rather than what.

## Writing style

* **The content is written for English speakers**, since English-language access to this process is
  the entire point of the project. German terms appear as terms of art, italicised on first use,
  with a translation and a glossary entry.
* **Use British English spelling** throughout, matching the existing documents. So "licence" for the
  noun, "recognised", "organisation", "metre".
* Be direct and specific. State the number, the section of law, and the address. Avoid marketing
  language, and avoid hedging where a primary source is clear.
* **Do not use em dashes in prose.** Split the sentence, or use a comma or a colon instead. This
  applies to documentation, code comments and UI copy alike.

## Code of conduct

Participation in this project is governed by the [Code of Conduct](CODE_OF_CONDUCT.md). Please read
it.

---

**Gute Fahrt.**
