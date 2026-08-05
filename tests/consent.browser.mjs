// Prove the consent gate actually gates.
//
// This suite exists for ONE load-bearing claim, made in the README, in
// SECURITY.md, in the privacy view and in the banner copy itself: nothing is
// requested from any Google host until a visitor explicitly opts in. Every other
// assertion here is secondary to that.
//
// It is tested by watching real network traffic in a real browser rather than by
// reading the source, because the failure that matters is a request leaving the
// page. Consent Mode with denied defaults, for instance, looks correct in code
// and still contacts Google, which is precisely what this would catch.
//
// The measurement ID is normally substituted into the meta tag by the Pages
// workflow at deploy time. The repository ships the placeholder, so these tests
// inject a fake ID before boot via an init script and never need a real one.
import { chromium } from 'playwright-core';

const ORIGIN = 'http://localhost:4173';
const FAKE_ID = 'G-TESTONLY000';
const GOOGLE = /(^|\.)google-analytics\.com$|(^|\.)googletagmanager\.com$|(^|\.)analytics\.google\.com$/;
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

let failures = 0;
const check = (label, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${cond ? '' : '  :: ' + extra}`);
  if (!cond) failures++;
};

const browser = await chromium.launch({ executablePath: CHROME, headless: true });

/**
 * Boot the app in a fresh context.
 * @param {object} o
 * @param {string|null} o.id       measurement ID to inject, or null to leave the placeholder
 * @param {string|null} o.stored   pre-existing consent value in localStorage
 * @param {boolean}     o.onboarded seed a profile, needed for any route past welcome
 * @param {object}      o.viewport phone dimensions for the layout assertions
 * @param {string|null} o.motion   'reduce' to boot with prefers-reduced-motion set
 */
async function boot({ id = FAKE_ID, stored = null, onboarded = false,
                      viewport = { width: 1280, height: 900 }, motion = null } = {}) {
  const ctx = await browser.newContext({ viewport, ...(motion ? { reducedMotion: motion } : {}) });
  const page = await ctx.newPage();
  { const c = await ctx.newCDPSession(page); await c.send('Network.setCacheDisabled', { cacheDisabled: true }); }

  const googleHits = [];
  page.on('request', r => {
    try { if (GOOGLE.test(new URL(r.url()).hostname)) googleHits.push(r.url()); } catch { /* opaque */ }
  });

  // Every Google host is intercepted and answered locally, for two reasons.
  //
  // First, this suite exists to prove the app does not contact Google without
  // consent, and it would be a poor joke for the proof itself to contact Google on
  // every developer's machine and in CI. Second, it makes the run hermetic: no
  // network, no dependence on Google being up, no flake.
  //
  // The CSP assertions stay real regardless. A Content-Security-Policy is applied
  // by the RENDERER before a request is handed to the network stack, so a missing
  // origin still registers as a violation and the route handler is never reached.
  // Interception hides nothing that matters here; it only stops the bytes leaving.
  // googleHits above still records the attempt, which is the property under test:
  // whether the app TRIED, not whether Google answered.
  await page.route(
    url => { try { return GOOGLE.test(new URL(url).hostname); } catch { return false; } },
    route => {
      const u = route.request().url();
      if (/gtag\/js/.test(u)) {
        // Stand in for gtag.js. Enough for the page to behave as it would with the
        // real file, and nothing more.
        return route.fulfill({
          status: 200,
          contentType: 'application/javascript',
          body: 'window.dataLayer = window.dataLayer || [];',
        });
      }
      return route.fulfill({ status: 204, body: '' });
    });

  // Analytics is the first thing here allowed past 'self', so every scenario
  // watches for a refused request. A missing origin in script-src, connect-src or
  // img-src shows up here as a violation rather than as a silent no-op, and the
  // accept path below is the ONLY place the widened directives are exercised.
  await page.addInitScript(() => {
    window.__csp = [];
    document.addEventListener('securitypolicyviolation',
      e => window.__csp.push(`${e.violatedDirective} blocked ${e.blockedURI}`));
  });

  // Runs before any page script, so the ID is in place before consent.js reads it
  // and before the app can issue a single request.
  await page.addInitScript(({ id, stored, key, onboarded }) => {
    if (stored) { try { localStorage.setItem(key, stored); } catch { /* ignore */ } }
    // The Progress screen only renders its settings card for an onboarded user, so
    // routes past #/welcome need a profile in place before boot.
    if (onboarded) {
      try {
        localStorage.setItem('gds-state-v1', JSON.stringify({
          profile: { name: 'Alex', path: 'convert', residenceSince: '2026-05-15', startedAt: Date.now() },
          xp: 100, level: 2, badges: [], streak: { last: null, count: 0, best: 0 },
          counters: { correct: 0, answered: 0 }, exams: [], tasks: {}, lessons: {}, quiz: {},
        }));
      } catch { /* ignore */ }
    }
    if (!id) return;
    document.addEventListener('readystatechange', () => {
      const m = document.querySelector('meta[name="ga-measurement-id"]');
      if (m) m.setAttribute('content', id);
    }, true);
    // Also patch as early as possible in case the meta is parsed before the event.
    new MutationObserver((_, obs) => {
      const m = document.querySelector('meta[name="ga-measurement-id"]');
      if (m) { m.setAttribute('content', id); obs.disconnect(); }
    }).observe(document.documentElement || document, { childList: true, subtree: true });
  }, { id, stored, key: 'gds-consent-v1', onboarded });

  await page.goto(ORIGIN + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  return { ctx, page, googleHits };
}

const banner = page => page.locator('#consent-banner');
const violations = page => page.evaluate(() => window.__csp || []);
const choice = page => page.evaluate(() => localStorage.getItem('gds-consent-v1'));

// ---------------------------------------------------------------- 1. no ID
{
  const { ctx, page, googleHits } = await boot({ id: null });
  check('no measurement ID: no banner is shown', await banner(page).count() === 0);
  check('no measurement ID: nothing is requested from Google', googleHits.length === 0, googleHits.join(', '));
  await ctx.close();
}

// ---------------------------------------------- 2. ID, no choice stored yet
{
  const { ctx, page, googleHits } = await boot({});
  check('ID configured and no choice stored: the banner appears', await banner(page).count() === 1);
  check('THE CORE PROPERTY: no Google request before any choice is made',
    googleHits.length === 0, googleHits.join(', '));
  const txt = (await banner(page).innerText()).toLowerCase();
  check('the banner names the platform and the transfer', txt.includes('google') && txt.includes('ip'));
  check('the banner offers both a decline and an allow control',
    await page.locator('#consent-no').count() === 1 && await page.locator('#consent-yes').count() === 1);
  check('nothing is stored until something is chosen', await choice(page) === null, String(await choice(page)));

  const shape = await page.evaluate(() => {
    const el = document.getElementById('consent-banner');
    return {
      role: el.getAttribute('role'),
      labelled: el.getAttribute('aria-labelledby'),
      described: el.getAttribute('aria-describedby'),
      focused: document.activeElement?.id,
      link: el.querySelector('.consent-link')?.getAttribute('href'),
      buttons: [...el.querySelectorAll('button')].map(b => b.className).join(' | '),
    };
  });
  check('it is announced as a dialog, with its title and body named',
    shape.role === 'dialog' && shape.labelled === 'consent-title' && shape.described === 'consent-body',
    JSON.stringify(shape));
  // If focus opened on "Allow analytics", a keyboard user pressing space to
  // scroll would consent by accident. The safe choice has to be the default one.
  check('focus opens on the declining control, not the accepting one',
    shape.focused === 'consent-no', String(shape.focused));
  check('the buttons reuse the existing .btn-ghost and .btn-amber skins',
    shape.buttons === 'btn btn-ghost small | btn btn-amber small', shape.buttons);
  check('the banner links to the explainer at #/privacy', shape.link === '#/privacy', String(shape.link));
  await ctx.close();
}

// ------------------------------------------------- 2b. the privacy explainer
//
// Loaded with no profile stored, so this also proves the router lets #/privacy
// through before onboarding. Bouncing it to #/welcome would mean the one page a
// visitor is entitled to read before deciding is the one page they cannot open.
{
  const { ctx, page } = await boot({});
  await page.click('.consent-link');
  await page.waitForTimeout(800);
  const view = await page.evaluate(() => ({
    hash: location.hash,
    text: (document.getElementById('view')?.textContent || '').replace(/\s+/g, ' '),
  }));
  check('#/privacy renders before onboarding is finished',
    view.hash === '#/privacy' && view.text.length > 400, `${view.hash} len=${view.text.length}`);
  for (const [what, re] of [
    ['progress is kept in localStorage', /localStorage/],
    ['the name, Anmeldung date and licence country are named', /Anmeldung date/],
    ['it says that data is never transmitted', /never transmitted/],
    ['location is used only to sort, locally', /sort the list of places/],
    ['analytics is Google Analytics 4', /Google Analytics 4/],
    ['analytics is off unless allowed', /off unless you allow it/],
    ['page views are named as collected', /which pages you view/],
    ['the referrer is named', /arrived from/],
    ['approximate location from the IP is named', /approximate location/],
    ['device and browser are named', /operating system, browser/],
    ['it states that cookies are set', /sets cookies/],
    ['it states the IP goes to Google', /IP address goes to Google/],
    ['withdrawal points at the Progress control', /Change analytics choice/],
    ['map tiles come from OpenStreetMap and see the IP', /OpenStreetMap[\s\S]*IP address/],
    ['the contact is the GitHub profile', /github\.com\/agusgonzaleznic/],
  ]) check(`privacy states: ${what}`, re.test(view.text), 'not found in the rendered page');
  check('reading the explainer contacts nobody and decides nothing',
    await choice(page) === null && await banner(page).count() === 1, String(await choice(page)));
  await ctx.close();
}

// ------------------------------- 2b. focus, and no overlap with the tab bar
{
  const { ctx, page } = await boot({});
  // app.js defers mountConsent by one task on purpose. Mounting inline let the
  // hashchange re-render move focus into the view, stealing it from the banner.
  const focused = await page.evaluate(() => document.activeElement?.id || '');
  check('focus lands on the decline control, not stolen by the router',
    focused === 'consent-no', `activeElement was "${focused}"`);

  // The banner is fixed to the bottom, and so is the tab bar on mobile. If they
  // overlap, the banner covers navigation and there is no way past it.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  const rects = await page.evaluate(() => {
    const b = document.getElementById('consent-banner');
    const tabs = document.querySelector('.tabs');
    if (!b || !tabs) return null;
    const br = b.getBoundingClientRect(), tr = tabs.getBoundingClientRect();
    return { bBottom: br.bottom, bTop: br.top, tTop: tr.top, tBottom: tr.bottom, tH: tr.height };
  });
  check('the tab bar and the banner are both present at 390px', rects !== null);
  if (rects) {
    check('the banner sits above the tab bar rather than over it',
      rects.bBottom <= rects.tTop + 0.5,
      `banner bottom ${rects.bBottom.toFixed(2)} vs tab bar top ${rects.tTop.toFixed(2)} (bar height ${rects.tH.toFixed(2)})`);
  }
  await ctx.close();
}

// -------------------------------------------------------------- 3. decline
{
  const { ctx, page, googleHits } = await boot({});
  await page.click('#consent-no');
  await page.waitForTimeout(700);
  check('declining removes the banner', await banner(page).count() === 0);
  check('declining stores the choice',
    await page.evaluate(() => localStorage.getItem('gds-consent-v1')) === 'denied');
  check('declining contacts no Google host', googleHits.length === 0, googleHits.join(', '));
  check('nothing is refused by the CSP on the decline path',
    (await violations(page)).length === 0, (await violations(page)).join(' | '));
  await ctx.close();
}

// ------------------------------------------------- 3b. Escape is not consent
//
// A dismissal must never be read as agreement, so the key that costs a visitor
// the least effort has to produce the outcome that stores nothing and loads
// nothing. Anything else would be consent by exhaustion.
{
  const { ctx, page, googleHits } = await boot({});
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);
  check('Escape is recorded as a decline, not as agreement', await choice(page) === 'denied', String(await choice(page)));
  check('Escape removes the banner', await banner(page).count() === 0);
  check('Escape contacts no Google host', googleHits.length === 0, googleHits.join(', '));
  await ctx.close();
}

// ------------------------------------------------- 4. decline survives reload
{
  const { ctx, page, googleHits } = await boot({ stored: 'denied' });
  check('a stored decline does not re-prompt', await banner(page).count() === 0);
  check('a stored decline still contacts no Google host', googleHits.length === 0, googleHits.join(', '));
  await ctx.close();
}

// --------------------------------------------------------------- 5. accept
{
  const { ctx, page, googleHits } = await boot({});
  await page.click('#consent-yes');
  await page.waitForTimeout(1800);
  check('accepting removes the banner', await banner(page).count() === 0);
  check('accepting stores the choice',
    await page.evaluate(() => localStorage.getItem('gds-consent-v1')) === 'granted');
  check('accepting loads gtag.js', googleHits.some(u => /googletagmanager\.com\/gtag\/js/.test(u)),
    googleHits.join(', '));
  check('the loaded tag carries the configured measurement ID',
    googleHits.some(u => u.includes(FAKE_ID)), googleHits.join(', '));

  const cfg = await page.evaluate(() => {
    const calls = (window.dataLayer || []).map(a => Array.from(a));
    const config = calls.find(a => a[0] === 'config');
    return { gtag: typeof window.gtag, kinds: calls.map(a => a[0]), id: config?.[1] ?? null, opts: config?.[2] ?? null };
  });
  check('gtag is wired up and configured with that same id',
    cfg.gtag === 'function' && cfg.kinds.includes('js') && cfg.id === FAKE_ID, JSON.stringify(cfg));
  check('Google Signals and ad personalisation are switched off in the config',
    cfg.opts?.allow_google_signals === false && cfg.opts?.allow_ad_personalization_signals === false,
    JSON.stringify(cfg.opts));

  // The accept path is the only place the widened CSP is exercised in a browser,
  // so probe the two directives it added. The collection endpoints are answered
  // LOCALLY here: the renderer still applies the CSP before a request leaves it,
  // so a missing origin would still register as a violation, and this way the
  // suite invents no analytics traffic against a real Google property.
  await page.route(/google-analytics\.com/, r => r.fulfill({ status: 204, body: '' }));
  const transports = await page.evaluate(async () => {
    const out = {};
    for (const [k, url] of [
      ['collect', 'https://www.google-analytics.com/g/collect?v=2'],
      ['regional', 'https://region1.google-analytics.com/g/collect?v=2'],
    ]) {
      try { await fetch(url, { method: 'POST', body: 'x' }); out[k] = 'allowed'; }
      catch (e) { out[k] = 'blocked: ' + e.message; }
    }
    // img-src: a CSP refusal fires onerror AND records a violation, while a local
    // 204 fires onerror alone, so the violation list is what tells them apart.
    await new Promise(res => {
      const px = new Image();
      px.onload = px.onerror = () => res();
      px.src = 'https://www.google-analytics.com/collect?v=2&pixel=1';
      setTimeout(res, 2000);
    });
    return out;
  });
  check('connect-src allows the GA4 collection endpoint', transports.collect === 'allowed', JSON.stringify(transports));
  check('connect-src allows a regional endpoint, so the wildcard works',
    transports.regional === 'allowed', JSON.stringify(transports));
  const refused = await violations(page);
  check('nothing on the whole accept path is refused by the CSP', refused.length === 0, refused.join(' | '));
  await ctx.close();
}

// ------------------------------------------------- 6. accept survives reload
{
  const { ctx, page, googleHits } = await boot({ stored: 'granted' });
  check('a stored grant does not re-prompt', await banner(page).count() === 0);
  check('a stored grant loads gtag.js without asking again',
    googleHits.some(u => /googletagmanager\.com\/gtag\/js/.test(u)), googleHits.join(', '));
  await ctx.close();
}

// ------------------------------------------------ 7. withdrawal is possible
{
  const { ctx, page } = await boot({ stored: 'granted', onboarded: true });
  await page.evaluate(() => { location.hash = '#/stats'; });
  await page.waitForTimeout(900);
  const control = page.locator('#consent-btn');
  check('the Progress screen offers a control to change the choice', await control.count() === 1);
  if (await control.count()) {
    const shape = await page.evaluate(() => {
      const el = document.getElementById('consent-btn');
      return {
        cls: el.className,
        h: Math.round(el.getBoundingClientRect().height),
        row: [...el.parentElement.querySelectorAll('button')].map(x => x.id).join(','),
      };
    });
    check('it is one of the same small ghost buttons', shape.cls === 'btn btn-ghost small', shape.cls);
    check('it sits in the settings row with export and import',
      shape.row.includes('export-btn') && shape.row.includes('import-btn'), shape.row);
    check('it is a comfortable touch target', shape.h >= 44, `${shape.h}px`);
    await control.click();
    await page.waitForTimeout(600);
    check('that control re-opens the banner so consent can be withdrawn',
      await banner(page).count() === 1);
    // The stored grant has to go, not merely be overlaid by a banner: leaving it
    // in place would mean a reload silently restored the consent being withdrawn.
    check('re-opening clears the stored grant, so no answer is assumed',
      await choice(page) === null, String(await choice(page)));
    await page.click('#consent-no');
    await page.waitForTimeout(400);
    check('the withdrawal can then be recorded', await choice(page) === 'denied', String(await choice(page)));
  }
  await ctx.close();
}

// ------------------------------------------- 8. it fits, and it can be read
//
// The banner is fixed to the bottom edge, which on a phone is exactly where the
// tab bar already lives. Both facts below are measured rather than eyeballed,
// because the failure mode is a banner sitting on top of the navigation.
{
  const { ctx, page } = await boot({ onboarded: true, viewport: { width: 390, height: 844 } });
  check('the banner is up on a 390px viewport', await banner(page).count() === 1);
  const layout = await page.evaluate(() => {
    const lum = rgb => { const c = rgb.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
    const parse = s => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map(parseFloat); return { rgb: p.slice(0, 3), a: p.length > 3 ? p[3] : 1 }; };
    // Walks up for the first painted background, and refuses to guess when it
    // meets a gradient, exactly as tests/measure.mjs does.
    const bgOf = el => { let n = el; while (n && n !== document.documentElement) { const s = getComputedStyle(n); if (s.backgroundImage && s.backgroundImage !== 'none') return null; const c = parse(s.backgroundColor); if (c && c.a > 0) return c.rgb; n = n.parentElement; } return null; };
    const ratio = el => { const fg = parse(getComputedStyle(el).color), bg = bgOf(el); if (!fg || !bg) return null; const a = lum(fg.rgb), b = lum(bg); return Math.round(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)) * 100) / 100; };

    const vw = document.documentElement.clientWidth;
    const el = document.getElementById('consent-banner');
    const bar = el.getBoundingClientRect();
    const tabs = document.querySelector('.tabs').getBoundingClientRect();
    const wide = [];
    for (const n of document.querySelectorAll('*')) {
      const r = n.getBoundingClientRect();
      if (r.right > vw + 1) wide.push(`${n.tagName}.${String(n.className).slice(0, 24)} right=${Math.round(r.right)}`);
    }
    return {
      overflow: document.documentElement.scrollWidth - vw,
      wide: wide.slice(0, 3),
      height: Math.round(bar.height), bottom: Math.round(bar.bottom), tabsTop: Math.round(tabs.top),
      buttons: [...el.querySelectorAll('.btn')].map(x => Math.round(x.getBoundingClientRect().height)),
      ratios: { body: ratio(document.getElementById('consent-body')), title: ratio(document.getElementById('consent-title')), link: ratio(el.querySelector('.consent-link')) },
      animation: getComputedStyle(el).animationName,
    };
  });
  console.log(`      banner ${layout.height}px tall, bottom edge ${layout.bottom}px, tab bar starts ${layout.tabsTop}px`);
  console.log(`      measured contrast: body ${layout.ratios.body}:1, title ${layout.ratios.title}:1, link ${layout.ratios.link}:1`);
  check('no horizontal overflow at 390px', layout.overflow <= 1, `${layout.overflow}px :: ${layout.wide.join(' | ')}`);
  check('the banner sits above the bottom tab bar rather than over it',
    layout.bottom <= layout.tabsTop + 1, `banner bottom ${layout.bottom} vs tabs top ${layout.tabsTop}`);
  check('both buttons stay comfortable touch targets', layout.buttons.every(h => h >= 44), JSON.stringify(layout.buttons));
  check('the body copy clears WCAG 1.4.3 at 4.5:1', (layout.ratios.body ?? 0) >= 4.5, String(layout.ratios.body));
  check('the title clears 4.5:1', (layout.ratios.title ?? 0) >= 4.5, String(layout.ratios.title));
  check('the "what gets collected" link clears 4.5:1', (layout.ratios.link ?? 0) >= 4.5, String(layout.ratios.link));
  check('it animates in when motion is welcome', layout.animation === 'consentIn', layout.animation);
  await ctx.close();
}

// ---------------------------------------------------------- 9. reduced motion
{
  const { ctx, page } = await boot({ onboarded: true, viewport: { width: 390, height: 844 }, motion: 'reduce' });
  check('the banner still appears under reduced motion', await banner(page).count() === 1);
  const motion = await page.evaluate(() => {
    const el = document.getElementById('consent-banner');
    return { cls: el.className, duration: getComputedStyle(el).animationDuration };
  });
  check('the animating class is not applied', !motion.cls.includes('consent-in'), motion.cls);
  check('and base.css neutralises the duration regardless, so both belts hold',
    parseFloat(motion.duration) < 0.01, motion.duration);
  await ctx.close();
}

await browser.close();
console.log(`\nCONSENT TEST: ${failures === 0 ? 'ALL GREEN' : failures + ' FAILED'}`);
process.exit(failures === 0 ? 0 : 1);
