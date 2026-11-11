import type { SubscriptionBilling, SubscriptionInterval, SubscriptionPrice } from '../types/subscription.types';

/** A price row's billing; rows from before annual billing are per delivery. */
export const billingOf = (price: { billing?: string | null }): SubscriptionBilling =>
  price.billing === 'ANNUAL' ? 'ANNUAL' : 'PER_DELIVERY';

/**
 * The price row a buyer will actually be charged: their currency (the API
 * charges getUserCurrency(buyerCountry)), this cadence, this billing. Billing
 * is explicit because an annual row shares its cadence and currency with the
 * per-delivery one: a lookup without it can show a year's price as one
 * delivery's. Never converted on the client.
 */
export function pickPrice<P extends Pick<SubscriptionPrice, 'currency' | 'billing'> & { interval: string }>(
  prices: P[],
  interval: SubscriptionInterval | string,
  currency: string,
  billing: SubscriptionBilling = 'PER_DELIVERY',
): P | undefined {
  return prices.find((p) => p.interval === interval && p.currency === currency && billingOf(p) === billing);
}

/** Takes any plan shape (a subscriber view's plan may not carry `kind`). */
const kindOf = (plan?: object | null) => (plan as { kind?: string } | null | undefined)?.kind;

/** A curated plan: we set the box and it is delivered as is. */
export const isCurated = (plan?: object | null) => kindOf(plan) === 'CURATED';

/** A basket plan: the subscriber fills a cart and pays for what is in it. */
export const isBasket = (plan?: object | null) => kindOf(plan) === 'BASKET';
