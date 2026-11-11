import { PRICED_CURRENCIES, costInCents, type PricedCurrency, type PricingRates, type PublishedPrices } from './pricing';

/**
 * Cost-stack pricing, as pure arithmetic — no I/O, so every published price
 * can be recomputed by hand.
 *
 *   partner cost (₦) = goods + agent fee + delivery fee
 *   deductions (%)   = platform share + FX buffer + the dearest card fee
 *   price (US$)      = partner cost ÷ ₦-per-US$ ÷ (1 − deductions)
 *   price (CAD/GBP)  = price (US$) × rate
 *
 * Partners are owed fixed naira (each role's line on the order), so the
 * platform's share is what is left of the price once card fees and the partner
 * cost are paid. Pricing against the dearest card fee keeps the platform share
 * at least `platformBps` in every currency; the FX buffer is headroom for the
 * naira strengthening while a published price is fixed.
 *
 * The customer sees ONE all-in price. These parts are admin-only: an itemised
 * fee to a Canadian buyer would likely be taxable (see CLAUDE.md "Tax").
 *
 * Amounts are integers in the smallest unit (kobo, cents, pence).
 */


export interface CostStack {
  /** What the goods cost to buy in Nigeria, in kobo. */
  goodsNgn: number;
  /** The agent's fee per order, in kobo. */
  agentFeeNgn: number;
  /** The delivery partner's fee per order, in kobo. */
  deliveryFeeNgn: number;
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

export function partnerCostNgn(stack: CostStack): number {
  return stack.goodsNgn + stack.agentFeeNgn + stack.deliveryFeeNgn;
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
    throw new RangeError(`Deductions of ${deduction}% leave too little for the partners`);
  }
  const costUsdCents = costInCents(partnerCostNgn(stack), rates, 'USD');
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
  /** Each role's naira line in this currency at `rates`, rounded up. */
  goods: number;
  agent: number;
  delivery: number;
  /** What the platform keeps. Negative = the charge no longer covers the partners. */
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
  const agent = inCurrency(stack.agentFeeNgn);
  const delivery = inCurrency(stack.deliveryFeeNgn);
  const platform = amount - cardFees - goods - agent - delivery;
  const platformBps = amount > 0 ? Math.round((platform / amount) * 10_000) : 0;
  return { amount, cardFees, goods, agent, delivery, platform, platformBps };
}
