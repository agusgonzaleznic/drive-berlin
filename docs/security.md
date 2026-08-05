# Security audit

**Audited:** 5 August 2026, against the app as it stands.
**Scope:** the whole static app. No backend, no accounts, no analytics, no cookies.
All state lives in `localStorage`.

A note on method: I intended to run five adversarial agent lenses over this, but
every attempt failed immediately on API capacity errors (529, zero tokens consumed,
twice). So this audit was done directly: a mechanical sweep of all 475 template
interpolations that reach `innerHTML`, plus a manual review of the import path, the
network surface and the third-party dependency. **It has not had an independent
second pair of eyes**, which is worth knowing when weighing it.

## Threat model

What is worth defending against for a personal, offline-capable, backend-less tool:

| Vector | Realistic? |
|---|---|
| A hostile "progress file" someone is sent and imports | **Yes**, the app has an import button and the file is user-chosen |
| Content reaching `innerHTML` unescaped | **Yes**, every view builds HTML from template literals |
| A compromised or hijacked CDN serving hostile JS | **Yes**, Leaflet loads from unpkg into our origin |
| `javascript:` URLs through data-driven links | Yes, if content is ever edited by someone else |
| Personal data leaving the device | Yes. The UI *promises* it doesn't, so that promise is a security property |
| A user attacking their own browser | **No**, not a threat, they own it |

## Findings and fixes

### 1. Prototype pollution through the import path: fixed

`importState()` did `Object.assign(state, DEFAULTS, JSON.parse(json))`.

I verified this empirically rather than reasoning about it, and it is real:

```
JSON.parse('{"__proto__":{"pwned":true}}')  → creates __proto__ as an OWN property
Object.assign(target, that)                 → target's prototype IS changed
```

`Object.prototype` itself stayed clean (so not a global pollution), but `state`'s
prototype was attacker-controlled, which is an integrity break in the object every
view reads from.

**Fixed:** all imported JSON now passes through `sanitizeState()` in
`src/js/security.js`, which never copies `__proto__`, `constructor` or `prototype`.

### 2. Type confusion through the import path: fixed

The same path accepted any types at all. `badges: "ignition"` made `.includes()` do
*substring* matching, and `exams: {}` made `.filter()` throw mid-render, giving a blank
screen with no recovery path.

**Fixed:** `sanitizeState()` is an **allowlist** with per-key coercion. Unknown keys
are dropped; every value is forced to the expected type; counts are clamped
non-negative; Leitner boxes clamp to 0–4; collections and strings are capped so an
enormous file cannot hang a render.

`load()` now sanitises too, so a corrupt or hand-edited `localStorage` payload
degrades to defaults instead of bricking the app.

### 3. `javascript:` URLs in data-driven links: fixed (hardening)

`esc()` escapes quotes and angle brackets, but it does **not** neutralise a URL
scheme, so `javascript:alert(1)` survives escaping intact and executes on click.
Three render paths put data-supplied URLs into an `href`: task links, POI links, and
the readiness "go there" link.

Not exploitable today, because those URLs come from our own verified content files, but it
is the wrong shape for a content-driven app.

**Fixed:** `safeUrl()` with a scheme allowlist (`http`, `https`, `mailto`, `tel`,
plus in-app `#/` links). It also strips control characters and whitespace before the
scheme test, so `java\nscript:` and `java script:`, both of which browsers execute,
cannot slip past.

### 4. Partial escaping in rendering primitives: fixed (hardening)

`icon()`, `emblem()` and `flag()` escaped only `"` in their `aria-label`, and
`glyph()` interpolated its fallback character completely unescaped. All are rendering
primitives, so they must be safe regardless of what a future data file contains.

**Fixed:** full `&<>"'` escaping in all four.

### 5. No Content-Security-Policy: fixed

**Added**, and it is unusually tight on the directive that matters because this app
has **no inline `<script>` at all**:

```
script-src 'self' https://unpkg.com
```

An injected `<script>` therefore cannot execute even if markup escaping were
bypassed somewhere. `style-src` does need `'unsafe-inline'` (the views use `style=""`
attributes throughout), but style injection is far lower severity than script
injection.

Verified with a dedicated test: **zero CSP violations**, Leaflet still loads and
initialises, OSM tiles still fetch (HTTP 200), and both web fonts still load.

### 6. No Subresource Integrity on Leaflet: fixed

Leaflet loaded from unpkg with no integrity check, so a compromised CDN could have
executed arbitrary JS in the app's origin.

**Fixed** with hashes computed from the actual 1.9.4 files rather than copied from
memory:

```
leaflet.js   sha384-cxOPjt7s7Iz04uaHJceBmS+qpjv2JkIHNVcuOrM+YHwZOmJGBXI00mdUXEq65HTH
leaflet.css  sha384-sHL9NAb7lN7rfvG5lfHpm643Xkcjzp4jFvuavGOndn6pjVqS6ny56CAt3nsEVT4H
```

SRI is **not** possible for the Google Fonts stylesheet: it varies by user agent, so
its bytes are not fixed. It is constrained by CSP instead, and every rule has a local
fallback stack, so a blocked font CDN degrades rather than breaks.

### 7. Referrer leakage: fixed

The app links out to German authority sites. `no-referrer` is now set document-wide,
and every external link carries `rel="noopener noreferrer"`.

### 8. The privacy promise: verified, holds

The UI states *"Everything stays in your browser. Nothing is uploaded anywhere"* and
*"Location stays in your browser. Nothing is sent anywhere."* Both hold:

- Geolocation is requested only on an explicit click, used to sort a local list, and
  never stored or transmitted.
- No personal data is put into any URL, query string or third-party request. The
  Google Maps links are built from a place's *name and address*, never from user data.
- `connect-src 'self'` means the only fetches are the local JSON files.
- There is no logging, no analytics and no error reporting.

**One honest caveat for the applicant, not a code fix:** the exported progress file
contains their name, Anmeldung date and licence country, and the same data sits in
`localStorage`. On a shared computer, anyone with the browser profile can read it.
That is inherent to a local-first design and is the right trade for an app that
promises nothing leaves the device.

## Not fixed, and why

- **`style-src 'unsafe-inline'`**: removing it means moving every inline `style=""`
  into stylesheets or nonces. Real work, low payoff: style injection cannot execute
  script under this CSP.
- **`frame-ancestors`** cannot be set from a `<meta>` tag. See deployment below.
- **localStorage encryption** would need a passphrase the applicant must re-enter, for a
  threat (local disk access) that already implies control of the browser profile.

## Required at deployment

The static files are safe to serve as-is, but two protections can only come from
response headers:

```
Content-Security-Policy: frame-ancestors 'none'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
```

Serve over HTTPS so the SRI and CSP cannot be stripped in transit.

## Verification

| Suite | Result |
|---|---|
| Unit, data-integrity and security tests | 73 passed |
| Browser smoke, all routes | 32 checks, 0 console errors |
| Keyboard and reduced-motion | 8 checks passed |
| Contrast and touch targets | all text passes on every screen |
| CSP + SRI (Leaflet, tiles, fonts) | 0 violations, everything loads |
| Full course walkthrough | 482 checks passed |

`tests/security.test.mjs` is written as the **specification** for
`src/js/security.js`. Each assertion maps to a line in that module's `CONTRACT` doc
block, including a fuzz set of scheme-obfuscation payloads and a check that no
shipped data file contains a `javascript:` URL, a `<script>` tag or an inline event
handler.
