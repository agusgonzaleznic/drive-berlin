// ============ Pure deadline maths for a non-EU (Argentine) licence ============
//
// Germany recognises a valid non-EU licence only for a limited period after you
// establish ordinary residence (ordentlicher Wohnsitz). After that, driving on it
// is a criminal offence. A second, longer deadline governs how long the simplified
// conversion (Umschreibung) route stays open.
//
// The periods themselves are NOT hardcoded here. They come from data/rules.json,
// which is filled from verified legal research, so this module never invents law.

export const DAY = 864e5;

export function addMonths(date, months) {
  const d = new Date(date.getTime());
  const targetMonth = d.getMonth() + months;
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(targetMonth);
  // clamp to end of month (e.g. 31 Aug + 6 months -> 28/29 Feb)
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return d;
}

export function daysBetween(a, b) {
  const da = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const db = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((db - da) / DAY);
}

/** Local YYYY-MM-DD. Never use toISOString() for calendar dates: it shifts by timezone. */
export function isoDay(d) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// Urgency tiers, chosen against real Berlin lead times: the authority alone takes
// roughly 8 weeks, and a practical-exam slot can take months on top. So "start now"
// has to fire long before the recognition period actually runs out.
export const URGENCY = { plan: 150, urgent: 90, critical: 30 };

export function urgencyLevel(daysLeft) {
  if (daysLeft < 0) return 'expired';
  if (daysLeft <= URGENCY.critical) return 'critical';
  if (daysLeft <= URGENCY.urgent) return 'urgent';
  if (daysLeft <= URGENCY.plan) return 'plan';
  return 'ok';
}

/**
 * How long the non-EU licence is still valid to drive on.
 *
 * CONTRACT (the safety-critical one in this app):
 * - Returns NULL when the residence date or the legal period is missing or
 *   malformed. It NEVER guesses a deadline: a wrong recognition date could lead
 *   the user to commit a criminal offence (StVG § 21), and there is no plausible
 *   default for that. Callers must render an honest "not available" state.
 * - `daysLeft` is negative once expired; `expired` is true from the day after.
 * - Month arithmetic clamps to the end of a shorter month (31 Aug + 6 = 28 Feb).
 * - All dates are LOCAL calendar dates, never toISOString(), which shifts by
 *   timezone and would report the wrong day for anyone east of UTC.
 * - The conversion deadline is optional; when the rules omit it, the returned
 *   `conversionEnd` is null and `conversionExpired` is false (there is no such
 *   deadline in German law, so absence is the correct state, not an error).
 *
 * @param {string} residenceSince ISO date (YYYY-MM-DD) residence was established
 * @param {{recognition_months?:number, conversion_deadline_months?:number|null}} rules
 * @param {Date}   [now]
 * @returns {null|object} null when inputs are insufficient, never a guess
 */
export function licenceClock(residenceSince, rules, now = new Date()) {
  if (!residenceSince || !rules || !rules.recognition_months) return null;
  const start = new Date(residenceSince + 'T00:00:00');
  if (Number.isNaN(start.getTime())) return null;

  const recognitionEnd = addMonths(start, rules.recognition_months);
  const daysLeft = daysBetween(now, recognitionEnd);
  const totalDays = daysBetween(start, recognitionEnd) || 1;
  const elapsed = Math.min(Math.max(daysBetween(start, now), 0), totalDays);

  let conversionEnd = null, conversionDaysLeft = null;
  if (rules.conversion_deadline_months) {
    conversionEnd = addMonths(start, rules.conversion_deadline_months);
    conversionDaysLeft = daysBetween(now, conversionEnd);
  }

  const level = urgencyLevel(daysLeft);
  return {
    start,
    recognitionEnd,
    daysLeft,
    expired: level === 'expired',
    level,
    urgent: level === 'urgent' || level === 'critical',
    pctElapsed: elapsed / totalDays,
    conversionEnd,
    conversionDaysLeft,
    conversionExpired: conversionDaysLeft != null && conversionDaysLeft < 0,
    recognitionMonths: rules.recognition_months,
    conversionMonths: rules.conversion_deadline_months || null,
  };
}

export function fmtDate(d, locale = 'en-GB') {
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Human summary of the clock, for a headline. */
export function clockHeadline(clock) {
  if (!clock) return null;
  if (clock.expired) {
    return {
      tone: 'danger',
      title: 'Your Argentine licence is no longer valid for driving here',
      detail: `The ${clock.recognitionMonths}-month recognition period ended on ${fmtDate(clock.recognitionEnd)}. ` +
        `Driving now counts as driving without a licence. Do not drive until your German licence is issued.`,
    };
  }
  if (clock.daysLeft === 0) {
    return { tone: 'danger', title: 'Today is your last valid day', detail: `Recognition ends today, ${fmtDate(clock.recognitionEnd)}.` };
  }
  if (clock.level === 'critical') {
    return {
      tone: 'danger',
      title: `Only ${clock.daysLeft} days left to drive on your Argentine licence`,
      detail: `Recognition ends ${fmtDate(clock.recognitionEnd)}. There is no longer enough time to finish the conversion before then, so ` +
        `file the application immediately and plan for a gap where you may not drive.`,
    };
  }
  if (clock.level === 'urgent') {
    return {
      tone: 'warning',
      title: `${clock.daysLeft} days left to drive on your Argentine licence`,
      detail: `Recognition ends ${fmtDate(clock.recognitionEnd)}. Get the application in now, because the authority alone takes weeks and exam slots are booked out.`,
    };
  }
  if (clock.level === 'plan') {
    return {
      tone: 'warning',
      title: `${clock.daysLeft} days left on your Argentine licence`,
      detail: `Recognition ends ${fmtDate(clock.recognitionEnd)}. This is the right moment to start: budget ~2 months for the authority plus exam waiting time.`,
    };
  }
  return {
    tone: 'tip',
    title: `${clock.daysLeft} days left on your Argentine licence`,
    detail: `You may drive on it until ${fmtDate(clock.recognitionEnd)}. Plenty of runway, but the earlier you apply, the calmer this gets.`,

  };
}
