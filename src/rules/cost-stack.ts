import { PRICED_CURRENCIES, costInCents, type PricedCurrency, type PricingRates, type PublishedPrices } from './pricing';

/**
 * Cost-stack pricing, as pure arithmetic — no I/O, so every published price
 * can be recomputed by hand.
 *
 *   partner payout (₦) = goods + fulfilment fee       (one partner, one line)
 *   cost (₦)           = partner payout + packaging    (packaging is our cost)
 *   deductions (%)     = platform share + FX buffer + the dearest card fee
 *   price (US$)        = cost ÷ ₦-per-US$ ÷ (1 − deductions)
 *   price (CAD/GBP)    = price (US$) × rate
 *
 * One fulfilment partner per order is owed fixed naira (the order's line), so
 * the platform's share is what is left of the price once card fees, the
 * partner and the packaging are paid. Pricing against the dearest card fee
 * keeps the platform share at least `platformBps` in every currency; the FX
 * buffer is headroom for the naira strengthening while a published price is
 * fixed. The fulfilment fee depends on the recipient's state band
 * (fulfilment-bands.ts): a published price is built on the PRICING band
 * (HIGH), so it covers every state.
 *
 * The customer sees ONE all-in price. These parts are admin-only: an itemised
 * fee to a Canadian buyer would likely be taxable (see CLAUDE.md "Tax").
 *
 * Amounts are integers in the smallest unit (kobo, cents, pence).
 */

export interface CostStack {
  /** What the goods cost to buy in Nigeria, in kobo. */
  goodsNgn: number;
  /** The fulfilment partner's fee per order (packing and delivery), in kobo. */
  fulfilmentFeeNgn: number;
  /** The Luvngift-branded packaging, in kobo. Our cost: never paid to the partner. */
  packagingNgn: number;
}

export interface StackRules {
  fxBufferPercent: number;
  cardFeePercent: Record<PricedCurrency, number>;
}

/**
 * Above this the price would be mostly deductions, and close to 100% it blows
 * up (division by ~0). A guard against a typo, not a business limit.
 */
export const MAX_DEDUCTION_PERCENT = 80;

/** What the fulfilment partner is owed for one order: goods + fee. */
export function partnerPayoutNgn(stack: Pick<CostStack, 'goodsNgn' | 'fulfilmentFeeNgn'>): number {
  return stack.goodsNgn + stack.fulfilmentFeeNgn;
}

/** Everything the price must cover before deductions. */
export function stackCostNgn(stack: CostStack): number {
  return partnerPayoutNgn(stack) + stack.packagingNgn;
}

export function deductionPercent(platformBps: number, rules: StackRules): number {
  const dearestCard = Math.max(...PRICED_CURRENCIES.map((c) => rules.cardFeePercent[c]));
  return platformBps / 100 + rules.fxBufferPercent + dearestCard;
}

export function publishStackPrices(
  stack: CostStack,
  platformBps: number,
  rules: StackRules,
  rates: PricingRates,
): PublishedPrices {
  const deduction = deductionPercent(platformBps, rules);
  if (deduction >= MAX_DEDUCTION_PERCENT) {
    throw new RangeError(`Deductions of ${deduction}% leave too little for the partner`);
  }
  const costUsdCents = costInCents(stackCostNgn(stack), rates, 'USD');
  const usdCents = Math.ceil(costUsdCents / (1 - deduction / 100));
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

export interface StackSplit {
  amount: number;
  /** Estimated card + conversion fees. The platform pays them. */
  cardFees: number;
  /** Each naira line in this currency at `rates`, rounded up. */
  goods: number;
  fulfilmentFee: number;
  packaging: number;
  /** What the platform keeps. Negative = the charge no longer covers the costs. */
  platform: number;
  /** `platform` as basis points of the charge. */
  platformBps: number;
}

/** Who gets what from one charge, at `rates`. */
export function stackSplit(
  amount: number,
  currency: PricedCurrency,
  stack: CostStack,
  rates: PricingRates,
  cardFeePercent: number,
): StackSplit {
  const inCurrency = (ngn: number) => Math.ceil(costInCents(ngn, rates, currency));
  const cardFees = Math.ceil((amount * cardFeePercent) / 100);
  const goods = inCurrency(stack.goodsNgn);
  const fulfilmentFee = inCurrency(stack.fulfilmentFeeNgn);
  const packaging = inCurrency(stack.packagingNgn);
  const platform = amount - cardFees - goods - fulfilmentFee - packaging;
  const platformBps = amount > 0 ? Math.round((platform / amount) * 10_000) : 0;
  return { amount, cardFees, goods, fulfilmentFee, packaging, platform, platformBps };
}
