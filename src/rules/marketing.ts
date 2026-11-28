/**
 * Marketing email consent and the weekly bundle email (2026-11-26).
 *
 * Consent is opt-in only. CASL (Canada) and PECR (UK) require it, and CASL
 * also forbids emailing someone to ASK for consent, so existing users are
 * asked inside the app, never by email. The Privacy Policy promises the same.
 */

/**
 * The words the person agreed to. Every app shows exactly this beside the
 * tickbox, and the API stores `MARKETING_CONSENT_VERSION` with the consent,
 * so we can prove what was agreed. Change the wording → bump the version.
 */
export const MARKETING_CONSENT_TEXT =
  "I'd like to receive Luvngift's weekly email with new gift bundles and seasonal gift ideas. I can unsubscribe at any time.";
/**
 * The line shown above the box, saying what people get. Not part of what they
 * agree to (that is MARKETING_CONSENT_TEXT), so changing it needs no version
 * bump. Keep it truthful: no promises the email does not keep.
 */
export const MARKETING_OPT_IN_HEADLINE =
  'Gift ideas for every occasion: birthdays, Mother’s Day, Christmas, Eid and more';
/** 2026-11-26: first wording. 2026-11-28: reworded, names the sender (CASL). */
export const MARKETING_CONSENT_VERSION = '2026-11-28';

/** Where consent was given or withdrawn, stored with the consent record. */
export const MARKETING_CONSENT_SOURCES = [
  'signup_web',
  'signup_mobile',
  /** The box above "Continue with Google" on the web sign-up page. */
  'signup_google',
  'prompt_web',
  'account_web',
  'account_mobile',
] as const;
export type MarketingConsentSource = (typeof MARKETING_CONSENT_SOURCES)[number];

/** Limits on one weekly issue. */
export const MARKETING_ISSUE_MAX_BUNDLES = 4;
export const MARKETING_HEADLINE_MAX = 90;
export const MARKETING_INTRO_MAX = 600;
/** Bundles picked automatically when admin has not set the week's issue. */
export const MARKETING_FALLBACK_BUNDLES = 3;
/** Someone who paid for an order this recently is not sent the weekly email. */
export const MARKETING_RECENT_BUYER_DAYS = 14;

/**
 * Opted in = consent given, and not withdrawn since. Both timestamps are kept
 * (never cleared), so the record shows the whole history of the latest choice.
 */
export function isMarketingOptedIn(user: {
  marketingConsentAt: Date | string | null;
  marketingUnsubscribedAt: Date | string | null;
}): boolean {
  if (!user.marketingConsentAt) return false;
  if (!user.marketingUnsubscribedAt) return true;
  return new Date(user.marketingConsentAt).getTime() > new Date(user.marketingUnsubscribedAt).getTime();
}

/**
 * The week an issue belongs to: the Monday (UTC) on or before `date`, as
 * YYYY-MM-DD. One issue per week, keyed by this.
 */
export function marketingWeekOf(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const daysSinceMonday = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - daysSinceMonday);
  return d.toISOString().slice(0, 10);
}

/** True when `value` is a YYYY-MM-DD that is a Monday. */
export function isMarketingWeekOf(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value && d.getUTCDay() === 1;
}
