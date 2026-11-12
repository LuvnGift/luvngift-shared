import { describe, expect, it } from 'vitest';
import {
  NIGERIAN_STATES,
  applyPartnerSchema,
  bandFeeProblem,
  bandForState,
  feeForState,
  fulfilmentRulesSchema,
  partnerPayoutNgn,
  pricingFeeNgn,
  publishStackPrices,
  stackCostNgn,
  stackSplit,
  unplacedStates,
  type BandRules,
} from '../src';

const rules: BandRules = {
  bandFeesNgn: { HIGH: 8_000_00, MEDIUM: 6_000_00, LOW: 4_000_00 },
  stateBands: { Lagos: 'HIGH', FCT: 'HIGH', Oyo: 'MEDIUM', Kebbi: 'LOW' },
};

describe('fulfilment bands', () => {
  it('finds the band a state was placed in, ignoring case and spaces', () => {
    expect(bandForState('Oyo', rules.stateBands)).toBe('MEDIUM');
    expect(bandForState('  kebbi ', rules.stateBands)).toBe('LOW');
  });

  it('treats a state nobody placed, an unknown state or no state as HIGH', () => {
    expect(bandForState('Enugu', rules.stateBands)).toBe('HIGH');
    expect(bandForState('Atlantis', rules.stateBands)).toBe('HIGH');
    expect(bandForState(null, rules.stateBands)).toBe('HIGH');
  });

  it('pays the fee for the recipient band and prices on the HIGH fee', () => {
    expect(feeForState('Kebbi', rules)).toBe(4_000_00);
    expect(feeForState('Lagos', rules)).toBe(8_000_00);
    expect(pricingFeeNgn(rules)).toBe(8_000_00);
  });

  it('lists the states still unplaced', () => {
    const unplaced = unplacedStates(rules.stateBands);
    expect(unplaced).toHaveLength(NIGERIAN_STATES.length - 4);
    expect(unplaced).not.toContain('Lagos');
    expect(unplaced).toContain('Enugu');
  });

  it('refuses a Medium or Low fee above High, because prices are built on High', () => {
    expect(bandFeeProblem(rules.bandFeesNgn)).toBeNull();
    expect(bandFeeProblem({ HIGH: 5_000_00, MEDIUM: 6_000_00, LOW: 1 })).toMatch(/cannot be more than the High fee/);
  });
});

describe('fulfilmentRulesSchema', () => {
  const valid = {
    bandFeesNgn: rules.bandFeesNgn,
    stateBands: { Lagos: 'HIGH', FCT: 'HIGH' },
    defaultPackagingNgn: 1_500_00,
    defaultPlatformPercent: 25,
    fxBufferPercent: 5,
    defaultSplitPercent: 50,
    requireRecipientConfirmation: false,
  };

  it('accepts a partial state map', () => {
    expect(fulfilmentRulesSchema.safeParse(valid).success).toBe(true);
  });

  it('refuses a state that is not a Nigerian state', () => {
    expect(fulfilmentRulesSchema.safeParse({ ...valid, stateBands: { Lagoss: 'HIGH' } }).success).toBe(false);
  });

  it('refuses bands where Low pays more than High', () => {
    const bad = { ...valid, bandFeesNgn: { HIGH: 1_000_00, MEDIUM: 1_000_00, LOW: 2_000_00 } };
    expect(fulfilmentRulesSchema.safeParse(bad).success).toBe(false);
  });
});

describe('cost stack: goods + fulfilment fee + packaging', () => {
  const stack = { goodsNgn: 40_000_00, fulfilmentFeeNgn: 8_000_00, packagingNgn: 2_000_00 };
  const rates = { NGN: 1500, CAD: 1.4, GBP: 0.8, USD: 1 as const };
  const stackRules = { fxBufferPercent: 5, cardFeePercent: { USD: 3, CAD: 3.5, GBP: 4 } };

  it('pays the partner goods + fee, and prices goods + fee + packaging', () => {
    expect(partnerPayoutNgn(stack)).toBe(48_000_00);
    expect(stackCostNgn(stack)).toBe(50_000_00);
  });

  it('builds the price on the whole cost and the dearest card fee', () => {
    // ₦50,000 ÷ 1500 = US$33.33…; deductions 25 + 5 + 4 = 34% → ÷ 0.66
    const published = publishStackPrices(stack, 2500, stackRules, rates);
    expect(published.usdCents).toBe(Math.ceil((50_000_00 / 1500) / 0.66));
    expect(published.amounts.CAD).toBe(Math.ceil(published.usdCents * 1.4));
  });

  it('leaves the platform at least its share once everyone is paid', () => {
    const published = publishStackPrices(stack, 2500, stackRules, rates);
    const split = stackSplit(published.amounts.GBP, 'GBP', stack, rates, 4);
    expect(split.platform).toBe(split.amount - split.cardFees - split.goods - split.fulfilmentFee - split.packaging);
    expect(split.platformBps).toBeGreaterThanOrEqual(2500);
  });
});

describe('applyPartnerSchema', () => {
  const application = {
    name: 'Ada Hampers',
    contactName: 'Ada Obi',
    email: 'ADA@example.com',
    phone: '+2348012345678',
    address: '12 Allen Avenue, Ikeja',
    state: 'Lagos',
    coverage: ['Lagos', 'Ogun'],
    agreedToTerms: true,
  };

  it('accepts a business with the states it covers', () => {
    const parsed = applyPartnerSchema.parse(application);
    expect(parsed.email).toBe('ada@example.com');
  });

  it('needs at least one state, each once', () => {
    expect(applyPartnerSchema.safeParse({ ...application, coverage: [] }).success).toBe(false);
    expect(applyPartnerSchema.safeParse({ ...application, coverage: ['Lagos', 'lagos'] }).success).toBe(false);
  });

  it('checks a CAC number when one is given', () => {
    expect(applyPartnerSchema.safeParse({ ...application, cacNumber: 'RC123456' }).success).toBe(true);
    expect(applyPartnerSchema.safeParse({ ...application, cacNumber: 'not a number' }).success).toBe(false);
  });
});

describe('applyPartnerSchema portfolio link', () => {
  const base = {
    name: 'Ada Hampers', contactName: 'Ada Obi', email: 'ada@example.com', phone: '+2348012345678',
    address: '12 Allen Avenue, Ikeja', state: 'Lagos', coverage: ['Lagos'], agreedToTerms: true,
  };

  it('accepts an https link and refuses a javascript: one', () => {
    expect(applyPartnerSchema.safeParse({ ...base, portfolioUrl: 'https://instagram.com/ada' }).success).toBe(true);
    expect(applyPartnerSchema.safeParse({ ...base, portfolioUrl: 'javascript:alert(1)' }).success).toBe(false);
  });
});
