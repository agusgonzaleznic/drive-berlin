# What this changes

<!-- One or two sentences. Link the issue it closes, for example "Closes #12". -->

## Why

<!-- What was wrong or missing. For a factual correction, say what the old claim was. -->

---

## Checklist

Please tick honestly. **An unticked box with an explanation underneath is far more useful than a
ticked box that is not quite true.**

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
      vendored under `src/assets/`, so the CSP stays at `script-src 'self'`.
- [ ] No build step, bundler or transpiler was introduced. The app still runs unbuilt from a static
      file server.
- [ ] Every file I touched is still under 500 lines, and matches the surrounding naming, comment
      density and idiom.
- [ ] I updated the `CONTRACT` JSDoc block and its matching assertions in `tests/` for any engine
      function whose behaviour I changed.
- [ ] No emoji in rendered UI.

### Accessibility

- [ ] Contrast is **not regressed**, measured rather than eyeballed. Result of
      `npm run test:contrast` noted below if this touches anything visual.
- [ ] All animation respects `prefers-reduced-motion`.
- [ ] Still fully usable by keyboard, and the layout still works down to 390 px.

### Commit hygiene

- [ ] **No `Co-Authored-By` trailer, and no AI-tool attribution line** of any kind in any commit
      message.
- [ ] **No em dashes in prose**, in documentation, code comments or UI copy. Sentences restructured
      instead.
- [ ] British English spelling, matching the existing documents.

### Licensing

- [ ] I understand this repository is dual-licensed, and that my contribution is licensed under
      **MIT** for code paths and **CC BY 4.0** for `docs/**` and `src/data/**`, matching the paths I
      changed.
- [ ] I have the right to contribute this, and any text copied from elsewhere is identified with its
      licence.

---

## Test output

<!--
Paste the summary lines. For example:

  npm test          → 73 passed, 0 failed
  test:browser      → 32 checks, 0 console errors
  test:course       → 481 checks, 0 failed
  test:a11y         → 8 passed
  test:csp          → 0 violations
  test:contrast     → all text passes  (or: not run, no visual change)
-->

## Screenshots

<!-- Before and after, for anything visual. Include a 390 px width shot if the layout changed. -->

## Notes for the reviewer

<!-- Anything you are unsure about, or deliberately left out of scope. -->
