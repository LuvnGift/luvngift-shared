import { describe, expect, it } from 'vitest';
import { billingOf, formatMoney, isBasket, isCurated, pickPrice } from '../src';

describe('formatMoney', () => {
  it('names the dollar every time, because buyers are in Canada and the US', () => {
    expect(formatMoney(4266, 'CAD')).toBe('CA$42.66');
    expect(formatMoney(4266, 'USD')).toBe('US$42.66');
    expect(formatMoney(4266, 'GBP')).toBe('£42.66');
    expect(formatMoney(150_000_00, 'NGN')).toBe('₦150,000.00');
  });

  it('keeps a minus sign in front of the symbol', () => {
    expect(formatMoney(-500, 'USD')).toBe('-US$5.00');
  });

  it('writes an unknown currency code in front rather than guessing a symbol', () => {
    expect(formatMoney(500, 'EUR')).toBe('EUR 5.00');
  });
});

describe('pickPrice', () => {
  const prices = [
    { interval: 'MONTHLY', currency: 'CAD', amount: 145_07 },
    { interval: 'MONTHLY', currency: 'CAD', amount: 1566_76, billing: 'ANNUAL' as const },
    { interval: 'MONTHLY', currency: 'USD', amount: 105_00, billing: 'PER_DELIVERY' as const },
  ];

  it('never shows a year as one delivery: billing is part of the match', () => {
    expect(pickPrice(prices, 'MONTHLY', 'CAD')?.amount).toBe(145_07);
    expect(pickPrice(prices, 'MONTHLY', 'CAD', 'ANNUAL')?.amount).toBe(1566_76);
  });

  it("takes the buyer's own currency, never another", () => {
    expect(pickPrice(prices, 'MONTHLY', 'GBP')).toBeUndefined();
  });

  it('reads a row without billing as per delivery', () => {
    expect(billingOf({})).toBe('PER_DELIVERY');
  });
});

describe('plan kinds', () => {
  it('tells curated and basket plans apart, whatever shape the plan has', () => {
    expect(isCurated({ kind: 'CURATED' })).toBe(true);
    expect(isBasket({ kind: 'BASKET' })).toBe(true);
    expect(isCurated({})).toBe(false);
    expect(isBasket(null)).toBe(false);
  });
});
