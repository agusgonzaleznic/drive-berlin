# Security policy

Thank you for taking the time to look at this project's security. This document explains what is
in scope, how to report something privately, and what the current posture already covers so that
you do not spend time re-reporting a known and accepted position.

This is a static, offline-capable web app with no backend, no accounts and no server-side state.
That shape determines most of what follows.

## Supported versions

There is a single release line and no long-lived maintenance branches.

| Version | Supported |
|---|:--:|
| Latest commit on `main` | ✅ |
| Any earlier commit, tag, fork or mirror | ❌ |

Fixes land on `main` and are deployed from `main`. Older commits are never back-patched, so if you
are running a fork or a pinned copy, please confirm the issue still reproduces against current
`main` before reporting it.

## Reporting a vulnerability

**Please do not open a public issue for a security problem.**

The primary channel is **GitHub Private Vulnerability Reporting**:

1. Go to the [repository Security tab](https://github.com/agusgonzaleznic/german-driving-school/security).
2. Choose **Report a vulnerability**.
3. Describe the issue, the impact, and the steps to reproduce it.

This keeps the report private between you and the maintainer until a fix is published, and it gives
us a private fork to work in.

If Private Vulnerability Reporting is unavailable to you for any reason, contact the maintainer
through the contact details on their GitHub profile: **https://github.com/agusgonzaleznic**. No
dedicated security mailbox exists for this project, so please do not send reports to any address
you find guessed or scraped elsewhere.

### What helps

* The affected file or screen, and the route (for example `#/map`).
* Browser and operating system.
* A minimal reproduction. For anything involving saved state, a redacted progress export or a
  minimal crafted import file is ideal.
* What an attacker gains. Impact is what decides severity here, because the app holds no
  credentials and talks to no server.

### Response expectations

This is a personal project maintained by one person in their own time, so what follows is a
best-effort commitment and explicitly **not** a service level agreement:

| Stage | Best-effort target |
|---|---|
| Acknowledgement that the report was received | within 7 days |
| Initial assessment and a severity view | within 30 days |
| Fix for a confirmed high-severity issue | as soon as practical, prioritised over other work |

If you have not heard anything after 30 days, a polite nudge on the same private thread is welcome.
There is no bug bounty and no payment available. Credit in the release notes and the commit message
is offered gladly if you want it.

Please give a reasonable window for a fix before publishing. There is no fixed embargo period, and
we will agree disclosure timing with you on the report thread.

## In scope

* **The static app itself**: `src/index.html`, `src/css/**`, `src/js/**`. In particular the
  rendering path, since every view is built from template literals and assigned through
  `innerHTML`.
* **Import and export of progress files.** This is the only place where the app parses data it did
  not write, so it is the highest-value target in the codebase.
* **The data files** in `src/data/**`, where a crafted or corrupted value could reach the DOM or
  break rendering.
* **The deployment configuration** and anything that weakens the Content-Security-Policy or the
  referrer policy.
* **The vendored third-party assets** in `src/assets/vendor/**` and `src/assets/fonts/**`. If the
  vendored Leaflet build differs from the official released bytes, that is a supply-chain finding
  and we want to hear about it.
* **The test and script tooling** in `tests/**` and `scripts/**`, where a supply-chain or
  code-execution issue would affect contributors rather than visitors.

## Out of scope

These are either by design or outside what this project controls. A report on one of them will be
closed with a pointer back to this section.

* **Anyone with access to the browser profile can read `localStorage`.** All state lives in the
  visitor's own `localStorage` under a single key, and an exported progress file contains whatever
  the visitor typed, meaning their name, registration date and licence country. There is no
  backend, no account, no cookie, no session and no analytics, so there is nothing to steal
  server-side and no credential to escalate with. Reading local state already implies control of
  the browser profile. This is inherent to a local-first design and it is a documented non-goal to
  encrypt it, because encryption would need a passphrase to defend against an attacker who by
  definition already holds the profile.
* **The accuracy of the legal content.** A wrong deadline, fee or procedure is a serious bug, but
  it is a *content* bug rather than a security one. Please report it with the
  [content accuracy issue template](https://github.com/agusgonzaleznic/german-driving-school/issues/new?template=content_accuracy.yml),
  publicly, so it can be discussed and sourced in the open.
* **Third-party services the app links out to.** The app links to authority and provider websites
  such as LABO, service.berlin.de, DEKRA, TÜV and driving schools, and it loads map tiles from
  OpenStreetMap. Their security posture is theirs. Report issues in those services to their
  operators.
* **Self-inflicted execution.** Pasting hostile code into your own browser console, or installing a
  hostile extension, is not a vulnerability in this app.
* **Denial of service.** There is no server to exhaust and no rate limit to bypass.
* **Automated scanner output with no demonstrated impact**, including reports that consist only of
  a missing header that this project cannot set (see below).
* **`style-src 'unsafe-inline'`.** It is currently required because the views use `style=""`
  attributes throughout. Style injection cannot execute script under this policy, so the payoff for
  removing it is low. A concrete script-execution or data-exfiltration path through it *is* in
  scope and very welcome.

## What the app already does

Please check this list before reporting, so you do not re-report existing posture.

* **A strict Content-Security-Policy**, set in the document `<meta>` tag, with **no external origin
  permitted for script, style or fonts**:

  ```
  default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
  font-src 'self'; img-src 'self' data: https://tile.openstreetmap.org
  https://*.tile.openstreetmap.org; connect-src 'self'; object-src 'none';
  base-uri 'none'; form-action 'none'
  ```

  The app contains **zero** inline `<script>`, so `script-src 'self'` is genuinely tight rather
  than nominally tight. An injected `<script>` cannot execute even if markup escaping were
  bypassed.
* **No CDN, and therefore no third-party code to compromise.** Every byte of script the page can
  run lives in this repository. Leaflet 1.9.4 is vendored under `src/assets/vendor/leaflet/`, the
  Cinzel and DM Sans font files under `src/assets/fonts/`, and the 84 Lucide icons under
  `src/assets/icons/`. There are **zero runtime npm dependencies**. Note that Subresource Integrity
  attributes are deliberately absent rather than forgotten: SRI existed to pin bytes served from a
  host we did not control, and there is no longer such a host. The vendored Leaflet build was
  byte-verified against the `sha384` hashes the app previously pinned.
* **The only remaining third-party request is OpenStreetMap map tiles**, which is why the two OSM
  hosts are the sole external entry in `img-src`. Nothing else leaves the origin. The former Google
  Fonts dependency, which disclosed every visitor's IP address to Google before a glyph was drawn,
  has been removed.
* **Graceful degradation instead of trust.** If Leaflet or the tile server is unreachable, the app
  detects the missing global and renders a list-only view, with a local font fallback stack behind
  the vendored faces. Nothing functional depends on any external host.
* **URL-scheme allowlisting.** `safeUrl()` in `src/js/security.js` allowlists schemes for every
  data-driven `href`, and it strips control characters *before* matching so that a value like
  `java\nscript:` cannot slip past.
* **An import sanitiser built against prototype pollution and type confusion.**
  `sanitizeState()` copies only allowlisted keys and never copies `__proto__`, `constructor` or
  `prototype`. It coerces every value per key, clamps counters, and caps collection and string
  sizes, so a crafted import cannot change an object's shape or blank the screen mid-render.
* **Full HTML escaping in every rendering primitive**, covering `&`, `<`, `>`, `"` and `'`.
* **`no-referrer` document-wide**, plus `rel="noopener noreferrer"` on every external link, so
  browsing this app never leaks the referring page to a German authority site.
* **Tests that hold the line.** `tests/security.test.mjs` asserts the documented contract of
  `src/js/security.js` assertion by assertion, and `tests/csp.mjs` drives a real browser to assert
  zero CSP violations while confirming that Leaflet, the map tiles and both fonts still load.

## Known and accepted: response headers

Three protections can only be delivered by the hosting layer, because a `<meta>` tag cannot set
them:

```
Content-Security-Policy: frame-ancestors 'none'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
```

`frame-ancestors` is not supported in a `<meta>` policy by design, which is why it is absent from
the document CSP rather than forgotten.

**GitHub Pages cannot set custom response headers.** The v1 deployment uses GitHub Pages, so on
that host the app ships without clickjacking protection and without `nosniff`. This is a **known
and accepted limitation of the current hosting choice**, not an oversight, and reporting it as a
vulnerability will not change the v1 position. Hosts that can set these headers, and the file each
one uses, are listed in the deployment section of the [README](README.md). Anyone self-hosting this
app is encouraged to set all three, and to serve over HTTPS so that the CSP cannot be stripped in
transit.
