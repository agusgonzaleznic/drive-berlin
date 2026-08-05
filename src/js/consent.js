// ============ Analytics consent ============
//
// CONTRACT
//   mountConsent()      Call once at boot. Decides whether a banner is needed and
//                       loads Google Analytics only after an explicit opt-in.
//                       Safe to call when no measurement ID is configured: it
//                       then does nothing at all.
//   consentState()      'granted' | 'denied' | null (never asked).
//   reopenConsent()     Re-show the choice so consent can be withdrawn as easily
//                       as it was given, which GDPR Art. 7(3) requires.
//
// WHY NOTHING LOADS BEFORE OPT-IN
// Google Consent Mode with denied defaults still loads gtag.js and still sends
// cookieless pings to Google, which is exactly the transfer German supervisory
// authorities have objected to, and TDDDG § 25 requires prior consent for the
// storage access regardless. So this module makes NO request to any Google host
// until the visitor clicks accept. Declining, or never answering, leaves the app
// byte-for-byte as it was before analytics existed.
//
// WHY THE ID COMES FROM A META TAG
// The app has no build step. The Pages workflow substitutes the measurement ID
// into the meta tag at deploy time from a repository variable. Locally the
// placeholder is left untouched, so development never talks to Google.

import { esc, prefersReducedMotion } from './ui.js';

const KEY = 'gds-consent-v1';
const PLACEHOLDER = '__GA_MEASUREMENT_ID__';

/** The configured GA4 measurement ID, or null when analytics is disabled. */
function measurementId() {
  const el = document.querySelector('meta[name="ga-measurement-id"]');
  const v = el && el.content ? el.content.trim() : '';
  // An unsubstituted placeholder, an empty value, or anything that is not a GA4
  // id all mean "analytics off". Checking the shape stops a half-configured
  // deploy from injecting a script tag with junk in the URL.
  if (!v || v === PLACEHOLDER || !/^G-[A-Z0-9]{4,}$/.test(v)) return null;
  return v;
}

export function consentState() {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    return null;                    // storage blocked: treat as never asked
  }
}

function remember(value) {
  try { localStorage.setItem(KEY, value); } catch { /* storage blocked */ }
}

let loaded = false;

/** Inject gtag.js. Only ever called after an explicit grant. */
function loadAnalytics(id) {
  if (loaded) return;
  loaded = true;

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
  document.head.appendChild(s);

  gtag('js', new Date());
  // anonymize_ip is the default in GA4 and is set explicitly so the intent is
  // visible in the source. Ad personalisation signals are switched off: this is
  // a study aid, and none of that data has a use here.
  gtag('config', id, {
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
}

function removeBanner() {
  const el = document.getElementById('consent-banner');
  if (el) el.remove();
}

function decide(value, id) {
  remember(value);
  removeBanner();
  if (value === 'granted') loadAnalytics(id);
}

function showBanner(id) {
  if (document.getElementById('consent-banner')) return;

  const wrap = document.createElement('div');
  wrap.id = 'consent-banner';
  wrap.className = 'consent-banner' + (prefersReducedMotion() ? '' : ' consent-in');
  wrap.setAttribute('role', 'dialog');
  wrap.setAttribute('aria-labelledby', 'consent-title');
  wrap.setAttribute('aria-describedby', 'consent-body');
  wrap.innerHTML = `
    <div class="consent-inner">
      <div class="consent-copy">
        <b id="consent-title">Analytics, only if you say so</b>
        <p id="consent-body" class="mt0 mb0">Your progress never leaves this device either way. I would
        like to count visits with Google Analytics to see whether this is useful to anyone. That sets
        cookies and sends your IP address to Google, so it is off until you allow it.
        <a href="#/privacy" class="consent-link">What gets collected</a></p>
      </div>
      <div class="consent-actions">
        <button class="btn btn-ghost small" id="consent-no">Decline</button>
        <button class="btn btn-amber small" id="consent-yes">Allow analytics</button>
      </div>
    </div>`;
  document.body.appendChild(wrap);

  wrap.querySelector('#consent-yes').addEventListener('click', () => decide('granted', id));
  wrap.querySelector('#consent-no').addEventListener('click', () => decide('denied', id));

  // Escape declines. It must never be read as agreement, so the safe outcome is
  // the one that stores nothing and loads nothing.
  wrap.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.stopPropagation(); decide('denied', id); }
  });

  // Move focus in so a keyboard user meets the choice rather than having to hunt
  // for it, but do not trap focus: the banner does not block the app.
  wrap.querySelector('#consent-no').focus();
}

export function reopenConsent() {
  const id = measurementId();
  if (!id) return false;           // nothing to consent to
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  showBanner(id);
  return true;
}

export function mountConsent() {
  const id = measurementId();
  if (!id) return;                  // analytics disabled: no banner, no script

  const state = consentState();
  if (state === 'granted') { loadAnalytics(id); return; }
  if (state === 'denied') return;
  showBanner(id);
}

/** True when a measurement ID is configured, so the UI can offer the control. */
export const analyticsConfigured = () => measurementId() !== null;
