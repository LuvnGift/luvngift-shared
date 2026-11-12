/**
 * Pricing maths: how a naira cost becomes the US$, CA$ and £ prices, and who
 * gets what from a charge. Pure functions, used by the API to publish prices
 * and by the admin dashboard to show the same figures, so the two can never
 * disagree.
 */

/** Units of each currency per US$ (NGN: naira per US$). */
export interface PricingRates {
  NGN: number;
  CAD: number;
  GBP: number;
  USD: 1;
}

/**
 * Subscription pricing, as pure arithmetic — no I/O, so every rule here is
 * unit-tested and every published price can be recomputed by hand:
 *
 *   cost (US$)   = sourcing (₦) ÷ ₦-per-US$
 *   price (US$)  = cost × (1 + markup)            ← the price of record
 *   price (CAD)  = price (US$) × CAD-per-US$      ← what a Canadian is charged
 *   price (GBP)  = price (US$) × GBP-per-US$
 *
 * Every step rounds UP to the cent and never further: a price that is exact to
 * the cent is one a customer can check, and rounding up means a fraction of a
 * cent is never silently taken out of the vendor's share.
 *
 * Amounts are integers in the smallest unit (kobo, cents, pence). Because both
 * kobo and cents are hundredths, sourcingKobo ÷ ₦-per-US$ is already in cents.
 */


/** Currencies a plan is charged in. Everyone else is charged in US$ (getUserCurrency). */
export const PRICED_CURRENCIES = ['USD', 'CAD', 'GBP'] as const;
export type PricedCurrency = (typeof PRICED_CURRENCIES)[number];

export interface PublishedPrices {
  /** The sourcing cost in US cents, before markup. Unrounded — it is a cost, not a charge. */
  costUsdCents: number;
  /** The price of record. */
  usdCents: number;
  /** What each currency is charged, derived from usdCents. */
  amounts: Record<PricedCurrency, number>;
}

export function costInCents(sourcingKobo: number, rates: PricingRates, currency: PricedCurrency) {
  return (sourcingKobo / rates.NGN) * rates[currency];
}

export function publishPrices(
  sourcingKobo: number,
  markupBps: number,
  rates: PricingRates,
): PublishedPrices {
  const costUsdCents = costInCents(sourcingKobo, rates, 'USD');
  const usdCents = Math.ceil(costUsdCents * (1 + markupBps / 10_000));
  return {
    costUsdCents,
    usdCents,
    amounts: {
      USD: usdCents,
      CAD: Math.ceil(usdCents * rates.CAD),
      GBP: Math.ceil(usdCents * rates.GBP),
    },
  };
}

/**
 * The markup a charge actually earns at `rates`. It drifts from the plan's
 * markup as the naira (or CAD/GBP) moves after the price was published.
 */
export function liveMarkupBps(
  amountCents: number,
  currency: PricedCurrency,
  sourcingKobo: number,
  rates: PricingRates,
): number {
  const cost = costInCents(sourcingKobo, rates, currency);
  return Math.round((amountCents / cost - 1) * 10_000);
}
