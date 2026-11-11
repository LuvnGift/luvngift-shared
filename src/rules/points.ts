/**
 * Points rules (decided 2026-11-06). The API applies them; web and mobile use
 * the same functions to preview them, so a preview can never disagree with
 * what is earned or spent.
 *
 *  - A box not filled to the top earns POINTS_PER_STEP for every full
 *    STEP_PERCENT left unfilled (an 80% box earns 40). Nominal on purpose:
 *    a thank-you, NOT the value of what was left unfilled.
 *  - Each earning expires EXPIRY_MONTHS after it was made; spending takes the
 *    oldest first. The ledger itself lives in the API (points-ledger.ts).
 *  - At least MIN_REDEEM may be spent at once. What a point is worth is an
 *    admin setting (pointsPerCurrencyUnit).
 */

export const POINTS_PER_STEP = 10;
export const STEP_PERCENT = 5;
export const MIN_REDEEM = 500;
export const EXPIRY_MONTHS = 12;
export const EXPIRY_WARNING_DAYS = 30;
/** Stripe will not take a charge below this (US$/CA$0.50, £0.30 rounded up). */
export const MIN_CHARGE_CENTS = 50;

/** Points a delivery earns for a box filled to `fillPercent` of its allowance. */
export function pointsForFill(fillPercent: number): number {
  const unfilled = Math.max(0, 100 - Math.min(100, fillPercent));
  // The epsilon keeps 85.0000001% from rounding a whole step away.
  return Math.floor(unfilled / STEP_PERCENT + 1e-9) * POINTS_PER_STEP;
}

/** What `points` take off, in the smallest currency unit. Rounded down: never more than promised. */
export function discountFor(points: number, pointsPerCurrencyUnit: number): number {
  return Math.floor((points * 100) / pointsPerCurrencyUnit);
}

/** The same as `discountFor`, under the name the clients use for display. */
export const pointsValue = discountFor;

/** When an earning made at `earnedAt` expires. */
export function expiryFor(earnedAt: Date): Date {
  const d = new Date(earnedAt);
  d.setUTCMonth(d.getUTCMonth() + EXPIRY_MONTHS);
  return d;
}

/**
 * How many points to spend for a request against a charge of `amount`. The
 * discount is capped so at least MIN_CHARGE_CENTS is still charged (Stripe's
 * floor), and the points are reduced to match, so nobody spends points for a
 * discount they did not get.
 */
export function planRedemption(
  requested: number,
  amount: number,
  pointsPerCurrencyUnit: number,
): { points: number; discount: number } {
  const maxDiscount = Math.max(0, amount - MIN_CHARGE_CENTS);
  const discount = Math.min(discountFor(requested, pointsPerCurrencyUnit), maxDiscount);
  if (discount === 0) return { points: 0, discount: 0 };
  // The fewest points that still buy this discount.
  const points = Math.min(requested, Math.ceil((discount * pointsPerCurrencyUnit) / 100));
  return { points, discount };
}

export const formatPoints = (n: number) => n.toLocaleString('en-GB');
