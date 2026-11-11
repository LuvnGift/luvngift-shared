/**
 * When a subscription starts. The subscriber picks the date of their FIRST
 * DELIVERY (a birthday, a holiday); the first charge is taken `leadDays`
 * before it at CHARGE_HOUR_UTC, the same lead time every cycle uses, so the
 * first delivery's window opens on the chosen date. Until then nothing is
 * charged. The API turns an out-of-range date into a 422; the apps use the
 * same rules to preview the charge date.
 *
 * Dates are calendar days (YYYY-MM-DD) in UTC.
 */

/** The furthest ahead a first delivery may be booked. */
export const MAX_START_DAYS = 60;

/**
 * A first charge closer than this is simply taken now. Stripe requires a
 * deferred start to be in the future, and holding a subscription for a few
 * hours buys the subscriber nothing but a confusing "starts today" state.
 */
export const MIN_DEFERRAL_HOURS = 48;

/** 09:00 UTC = 10:00 in Lagos. */
export const CHARGE_HOUR_UTC = 9;

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Midnight UTC of a YYYY-MM-DD date, or null if it is not a real date (2026-02-31 is not). */
export function parseCalendarDate(value: string): Date | null {
  if (!DATE_RE.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

export function toCalendarDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** The first and last first-delivery dates a subscriber may choose today. */
export function startDateRange(leadDays: number, now: Date = new Date()) {
  const today = startOfUtcDay(now);
  return {
    earliest: toCalendarDate(new Date(today.getTime() + leadDays * DAY_MS)),
    latest: toCalendarDate(new Date(today.getTime() + MAX_START_DAYS * DAY_MS)),
  };
}

/** The charge time for a first delivery on `date` (midnight UTC), before the 48h rule. */
export function chargeTimeFor(date: Date, leadDays: number): Date {
  return new Date(date.getTime() - leadDays * DAY_MS + CHARGE_HOUR_UTC * HOUR_MS);
}

/** True when a charge at `chargeAt` is close enough to now that it is simply taken now. */
export function chargesNow(chargeAt: Date, now: Date = new Date()): boolean {
  return chargeAt.getTime() - now.getTime() < MIN_DEFERRAL_HOURS * HOUR_MS;
}

/**
 * When the first charge will be taken for a chosen first delivery date, or
 * null when it is taken now (or the date is not a real one).
 */
export function previewChargeDate(firstDeliveryDate: string, leadDays: number, now: Date = new Date()): Date | null {
  const date = parseCalendarDate(firstDeliveryDate);
  if (!date) return null;
  const chargeAt = chargeTimeFor(date, leadDays);
  return chargesNow(chargeAt, now) ? null : chargeAt;
}

/** A YYYY-MM-DD date moved by `days`, kept within [min, max]. */
export function shiftDate(value: string, days: number, min: string, max: string): string {
  const base = parseCalendarDate(value) ?? parseCalendarDate(min)!;
  const next = toCalendarDate(new Date(base.getTime() + days * DAY_MS));
  return next < min ? min : next > max ? max : next;
}

/** True while a later-starting subscription has not taken its first charge. */
export function hasNotStarted(sub: { startsAt?: string | Date | null }, now: Date = new Date()): boolean {
  return Boolean(sub.startsAt && new Date(sub.startsAt).getTime() > now.getTime());
}

/** "17 December 2026". Calendar dates are UTC days, so they are formatted in UTC. */
export function longDate(value: string | Date): string {
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
