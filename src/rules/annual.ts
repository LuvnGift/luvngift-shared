/**
 * Annual billing arithmetic. Pure: no I/O, so every money rule here is tested
 * directly (tests/annual.test.ts).
 *
 * A subscriber may pay for a year of deliveries at once, at a discount
 * (`annualDiscountPercent`, Admin → Settings). The year buys a fixed number
 * of deliveries at their cadence; how often they come does not change.
 *
 * Cancelling part-way through (Refund Policy § 6, user decision 2026-11-11):
 *   refund = value of the undelivered deliveries at the price paid
 *          − an admin fee of `annualCancellationFeePercent` of that value
 *          − the discount already enjoyed on the deliveries made
 * and never below zero. A delivery counts as made once its order exists:
 * from then on it is being prepared and will arrive.
 */

import type { SubscriptionInterval } from '../types/subscription.types';

/** Deliveries a year buys at each cadence. */
export const DELIVERIES_PER_YEAR: Record<SubscriptionInterval, number> = {
  MONTHLY: 12,
  BIMONTHLY: 6,
  QUARTERLY: 4,
  BIWEEKLY: 26,
};

/** Months between deliveries; biweekly is not sold annually. */
export const CADENCE_MONTHS: Partial<Record<SubscriptionInterval, number>> = {
  MONTHLY: 1,
  BIMONTHLY: 2,
  QUARTERLY: 3,
};

/** A year of deliveries at `perDelivery`, discounted, rounded up to the cent like every price. */
export function annualAmount(perDelivery: number, interval: SubscriptionInterval, discountBps: number): number {
  return Math.ceil((perDelivery * DELIVERIES_PER_YEAR[interval] * (10_000 - discountBps)) / 10_000);
}

/**
 * The undiscounted equivalent of one delivery inside an annual price: what the
 * margin check measures, so it watches for drift and not for the discount
 * the business chose to give.
 */
export function perDeliveryEquivalent(annual: number, interval: SubscriptionInterval, discountBps: number): number {
  return Math.round((annual * 10_000) / (DELIVERIES_PER_YEAR[interval] * (10_000 - discountBps)));
}

/**
 * Delivery `index`'s share of the year's payment, so the year's orders add up
 * to exactly what was paid: the last one takes the remainder.
 */
export function deliveryShare(amountPaid: number, deliveries: number, index: number): number {
  const base = Math.floor(amountPaid / deliveries);
  return index === deliveries - 1 ? amountPaid - base * (deliveries - 1) : base;
}

/** `date` moved by whole calendar months, clamped to the month's last day (31 Jan + 1 → 28/29 Feb). */
export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d;
}

export interface CancellationTerm {
  amountPaid: number;
  deliveries: number;
  deliveriesMade: number;
  listPerDelivery: number;
}

export interface CancellationRefund {
  undelivered: number;
  /** The undelivered deliveries at the price actually paid. */
  undeliveredValue: number;
  fee: number;
  /** The discount enjoyed on deliveries already made, taken back. */
  clawback: number;
  refund: number;
}

export function cancellationRefund(term: CancellationTerm, feeBps: number): CancellationRefund {
  const made = Math.min(term.deliveriesMade, term.deliveries);
  const undelivered = term.deliveries - made;
  const undeliveredValue = Math.round((term.amountPaid * undelivered) / term.deliveries);
  const paidForMade = term.amountPaid - undeliveredValue;
  const fee = Math.round((undeliveredValue * feeBps) / 10_000);
  const clawback = Math.max(0, term.listPerDelivery * made - paidForMade);
  const refund = Math.max(0, undeliveredValue - fee - clawback);
  return { undelivered, undeliveredValue, fee, clawback, refund };
}
