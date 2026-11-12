import type { CostStack, StackSplit } from '../rules/cost-stack';
import type { PricedCurrency, PricingRates } from '../rules/pricing';
import type { SubscriptionBilling, SubscriptionInterval } from './subscription.types';

/**
 * What the API's pricing endpoints return to the admin dashboard. The API
 * builds them from these declarations, and the dashboard reads them, so a
 * preview never shows a field the API does not send.
 */

/** A cost stack priced at today's rate. */
export interface StackQuote {
  rates: PricingRates;
  stack: CostStack;
  platformBps: number;
  fxBufferPercent: number;
  cardFeePercent: Record<PricedCurrency, number>;
  /** Platform + FX buffer + the dearest card fee, in percent. */
  deductionPercent: number;
  costUsdCents: number;
  /** The US$ price of record. */
  usdCents: number;
  amounts: Record<PricedCurrency, number>;
  /** Who gets what from each currency's charge. */
  splits: Record<PricedCurrency, StackSplit>;
  /** Why it cannot be published. Empty = publishable. */
  problems: string[];
}

export type PriceChange = 'NEW' | 'INCREASE' | 'DECREASE' | 'SAME';

/** One plan price a publish would set. */
export interface PriceLine {
  interval: SubscriptionInterval;
  currency: PricedCurrency;
  /** ANNUAL: a year of deliveries at this cadence, at `discountBps` off. */
  billing: SubscriptionBilling;
  discountBps: number | null;
  amount: number;
  /** The live amount today; null for a row that does not exist yet. */
  current: number | null;
  change: PriceChange;
  priceId: string | null;
  /** Who gets what from ONE DELIVERY, whatever the cadence or billing. */
  split: StackSplit;
}

/** Admin → Settings → Subscription pricing, as stored. */
export interface SubscriptionRules {
  minFillPercent: number;
  marginTolerancePoints: number;
  cardFeePercent: Record<PricedCurrency, number>;
  pointsPerCurrencyUnit: number;
  annualDiscountPercent: number;
  annualCancellationFeePercent: number;
}

/** POST /admin/subscription-plans/[:id/]pricing-preview. */
export interface PricingPreview extends StackQuote {
  lines: PriceLine[];
  rules: SubscriptionRules;
  /** The goods line the prices were built on, in kobo. */
  goodsNgn: number;
}

/** POST /admin/bundles/[:id/]pricing-preview. */
export interface BundlePricingPreview extends StackQuote {
  /** The bundle's price today; null for a new bundle. */
  current: number | null;
  change: PriceChange;
}
