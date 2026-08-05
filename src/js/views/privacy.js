// ============ Privacy: what this app stores, and what leaves the device ============
//
// Linked from the consent banner in js/consent.js and reachable at #/privacy
// before onboarding, because a visitor cannot be asked to decide about analytics
// and then be redirected away from the explanation.
//
// Everything here is a statement of fact about the code in this repository, so it
// must be edited whenever that code changes. No data controller address and no
// email address is invented: this is a personal project on GitHub Pages, and the
// only honest contact route is the profile the repository sits under.

import { icon } from '../icons.js';

export function render(el) {
  el.innerHTML = `
    <h1>${icon('shield-check', { size: 22 })} Privacy</h1>
    <p class="muted mt0">Short version: your progress stays in your browser, and analytics is off
    until you switch it on.</p>

    <div class="card" style="margin-top:14px;">
      <h2>${icon('key', { size: 19 })} What stays on this device</h2>
      <p>Your progress is stored in this browser's <code>localStorage</code> and is never transmitted
      anywhere. That includes the parts you typed:</p>
      <ul style="margin:6px 0 10px;padding-left:20px;">
        <li>your first name, as you entered it during onboarding;</li>
        <li>your Anmeldung date, the date you registered your address in Germany;</li>
        <li>the country that issued your current licence;</li>
        <li>which path you chose, and every task, lesson, quiz answer, mock exam, badge and XP total.</li>
      </ul>
      <p>There is no account, no server and no database behind this app. It is static files.
      Clearing your browser data for this site deletes all of it, and there is no copy elsewhere
      to restore it from. The Progress screen can export it to a file you keep.</p>
      <p class="mb0">Your analytics choice is stored the same way, as a single value in
      <code>localStorage</code>, which is how the banner knows not to ask again.</p>
    </div>

    <div class="card" style="margin-top:14px;">
      <h2>${icon('crosshair', { size: 19 })} Location</h2>
      <p class="mb0">The Places screen has a "Use my location" button. If you grant the browser
      permission, your coordinates are used once, in this page, to sort the list of places by
      distance from you. They are not stored, not written to <code>localStorage</code> and not sent
      anywhere. Refusing the permission leaves the list in its default order.</p>
    </div>

    <div class="card" style="margin-top:14px;">
      <h2>${icon('gauge', { size: 19 })} Analytics, only with your consent</h2>
      <p>Analytics here is Google Analytics 4, and it is off unless you allow it. Nothing at all is
      requested from any Google server until you press "Allow analytics": declining, or simply
      never answering, leaves the app exactly as it would be if analytics did not exist.</p>
      <p>If you do allow it, Google Analytics collects:</p>
      <ul style="margin:6px 0 10px;padding-left:20px;">
        <li>which pages you view, and in what order;</li>
        <li>the site or search engine you arrived from, if any;</li>
        <li>an approximate location, derived from your IP address, usually no finer than a city;</li>
        <li>your device, screen size, operating system, browser and language.</li>
      </ul>
      <p>Two things about that are worth saying without hedging. It sets cookies in your browser,
      which is how it recognises a repeat visit. And your IP address goes to Google, because that
      is unavoidable once your browser makes a request to their servers. What Google then does with
      it is governed by their terms, at
      <a href="https://policies.google.com/privacy">policies.google.com/privacy</a>, not by mine.
      In the configuration this app sends, Google Signals and ad personalisation are both switched
      off and IP anonymisation is requested.</p>
      <p class="mb0">Why bother at all: to see whether anyone is using this and where they get
      stuck. Nothing you type into the app is ever sent to Google, because none of it ever leaves
      your browser in the first place.</p>
    </div>

    <div class="card" style="margin-top:14px;">
      <h2>${icon('corner-up-left', { size: 19 })} Changing your mind</h2>
      <p class="mb0">Go to <a href="#/stats">Progress</a> and use "Change analytics choice" in the
      Settings panel at the bottom. It brings the same banner back, so withdrawing consent is
      exactly as easy as giving it. Withdrawing takes effect on the next page load, and you can
      delete the cookies Google set from your browser's own settings. The control is only there
      when analytics is actually configured, so you will not see it when running this app locally.</p>
    </div>

    <div class="card" style="margin-top:14px;">
      <h2>${icon('map-pin', { size: 19 })} Map tiles</h2>
      <p class="mb0">The map is drawn with tiles from OpenStreetMap. Loading an image from their
      servers means those servers see your IP address, in the ordinary way that any image on any
      web page does. That is a normal consequence of displaying a map and it happens whether or not
      you allow analytics. Their usage policy is at
      <a href="https://operations.osmfoundation.org/policies/tiles/">operations.osmfoundation.org</a>.</p>
    </div>

    <div class="card" style="margin-top:14px;">
      <h2>${icon('info', { size: 19 })} Questions</h2>
      <p class="mb0">This is a personal, non-commercial project, and the whole of it is readable:
      the consent logic is in <code>src/js/consent.js</code> and this page is
      <code>src/js/views/privacy.js</code>. Open an issue or reach me through
      <a href="https://github.com/agusgonzaleznic">github.com/agusgonzaleznic</a>.</p>
    </div>`;
}
