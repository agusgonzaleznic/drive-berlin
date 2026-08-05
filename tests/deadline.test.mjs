// Unit tests for the licence recognition clock.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  addMonths, daysBetween, licenceClock, clockHeadline, isoDay, urgencyLevel,
} from '../src/js/engine/deadline.js';

const RULES = { recognition_months: 6, conversion_deadline_months: 36 };

test('addMonths clamps to the end of a shorter month', () => {
  assert.equal(isoDay(addMonths(new Date('2026-08-31T00:00:00'), 6)), '2027-02-28');
  assert.equal(isoDay(addMonths(new Date('2023-08-31T00:00:00'), 6)), '2024-02-29', 'leap year');
  assert.equal(isoDay(addMonths(new Date('2026-01-15T00:00:00'), 6)), '2026-07-15');
});

test('isoDay reports the LOCAL calendar day, unlike toISOString', () => {
  // In UTC+X, local midnight is the previous day in UTC — the bug this guards against.
  const d = new Date('2026-12-01T00:00:00');
  assert.equal(isoDay(d), '2026-12-01');
});

test('daysBetween ignores time of day', () => {
  assert.equal(daysBetween(new Date('2026-08-04T23:00:00'), new Date('2026-08-05T01:00:00')), 1);
  assert.equal(daysBetween(new Date('2026-08-04T00:00:00'), new Date('2026-08-04T22:00:00')), 0);
});

test('licenceClock refuses to guess without inputs', () => {
  assert.equal(licenceClock(null, RULES), null);
  assert.equal(licenceClock('2026-01-01', null), null);
  assert.equal(licenceClock('2026-01-01', {}), null, 'no recognition period => no clock');
  assert.equal(licenceClock('not-a-date', RULES), null);
});

test('licenceClock computes remaining days and both deadlines', () => {
  const c = licenceClock('2026-06-01', RULES, new Date('2026-08-04T12:00:00'));
  assert.equal(isoDay(c.recognitionEnd), '2026-12-01');
  assert.equal(isoDay(c.conversionEnd), '2029-06-01');
  assert.equal(c.daysLeft, 119);
  assert.equal(c.expired, false);
  assert.ok(c.pctElapsed > 0.3 && c.pctElapsed < 0.4);
});

test('urgency tiers reflect real Berlin lead times (authority ~8 weeks + exam waits)', () => {
  assert.equal(urgencyLevel(200), 'ok');
  assert.equal(urgencyLevel(150), 'plan', 'start-now warning fires ~5 months out');
  assert.equal(urgencyLevel(91), 'plan');
  assert.equal(urgencyLevel(90), 'urgent');
  assert.equal(urgencyLevel(31), 'urgent');
  assert.equal(urgencyLevel(30), 'critical');
  assert.equal(urgencyLevel(0), 'critical');
  assert.equal(urgencyLevel(-1), 'expired');
});

test('a 58-day runway is urgent, and headlines escalate with the tier', () => {
  const c = licenceClock('2026-04-01', RULES, new Date('2026-08-04T12:00:00')); // ends 01-10
  assert.equal(c.daysLeft, 58);
  assert.equal(c.level, 'urgent');
  assert.equal(c.urgent, true);
  assert.equal(clockHeadline(c).tone, 'warning');

  const crit = licenceClock('2026-03-01', RULES, new Date('2026-08-04T12:00:00')); // ends 01-09
  assert.equal(crit.daysLeft, 28);
  assert.equal(crit.level, 'critical');
  assert.equal(clockHeadline(crit).tone, 'danger', 'under a month must read as danger, not a nudge');
  assert.match(clockHeadline(crit).detail, /immediately/);
});

test('expired clock reports danger and never says days remaining', () => {
  const c = licenceClock('2025-01-01', RULES, new Date('2026-08-04T12:00:00'));
  assert.equal(c.expired, true);
  assert.ok(c.daysLeft < 0);
  const h = clockHeadline(c);
  assert.equal(h.tone, 'danger');
  assert.match(h.detail, /without a licence/);
});

test('last valid day is flagged distinctly', () => {
  const c = licenceClock('2026-02-04', RULES, new Date('2026-08-04T09:00:00'));
  assert.equal(c.daysLeft, 0);
  assert.equal(clockHeadline(c).title, 'Today is your last valid day');
});

test('conversion deadline expiry is tracked separately from recognition', () => {
  const c = licenceClock('2020-01-01', RULES, new Date('2026-08-04T12:00:00'));
  assert.equal(c.expired, true);
  assert.equal(c.conversionExpired, true);
  const fresh = licenceClock('2026-06-01', RULES, new Date('2026-08-04T12:00:00'));
  assert.equal(fresh.conversionExpired, false);
});

test('clock works when only the recognition period is known', () => {
  const c = licenceClock('2026-06-01', { recognition_months: 6 }, new Date('2026-08-04T12:00:00'));
  assert.equal(c.conversionEnd, null);
  assert.equal(c.conversionDaysLeft, null);
  assert.equal(c.conversionExpired, false);
});
