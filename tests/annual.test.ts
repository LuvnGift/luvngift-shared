import {
  addMonths,
  annualAmount,
  cancellationRefund,
  deliveryShare,
  perDeliveryEquivalent,
} from '../src';

/**
 * The money rules of annual billing. The cancellation example is the one
 * agreed with the business (2026-11-11): US$100 a delivery monthly, so
 * US$1,080 a year (US$90 each); cancel after 4 → 720 undelivered − 72 fee −
 * 40 clawback = US$608 back.
 */
describe('annual terms', () => {
  it('prices a year of deliveries at the discount, rounded up to the cent', () => {
    expect(annualAmount(100_00, 'MONTHLY', 1000)).toBe(1080_00);
    expect(annualAmount(100_00, 'QUARTERLY', 1000)).toBe(360_00);
    expect(annualAmount(33_33, 'MONTHLY', 1000)).toBe(359_97); // 359.964 → up
  });

  it('measures an annual price as its undiscounted per-delivery equivalent', () => {
    expect(perDeliveryEquivalent(1080_00, 'MONTHLY', 1000)).toBe(100_00);
  });

  it("splits the year's payment so the orders add up to exactly what was paid", () => {
    const shares = Array.from({ length: 12 }, (_, i) => deliveryShare(1000_01, 12, i));
    expect(shares.reduce((a, b) => a + b, 0)).toBe(1000_01);
    expect(shares[0]).toBe(83_33);
    expect(shares[11]).toBe(83_38);
  });

  it('moves dates by calendar months, clamped to the end of a short month', () => {
    expect(addMonths(new Date('2026-01-31T09:00:00Z'), 1).toISOString()).toBe('2026-02-28T09:00:00.000Z');
    expect(addMonths(new Date('2026-11-15T09:00:00Z'), 3).toISOString()).toBe('2027-02-15T09:00:00.000Z');
  });

  describe('cancellation refund', () => {
    const YEAR = { amountPaid: 1080_00, deliveries: 12, listPerDelivery: 100_00 };

    it('matches the agreed example', () => {
      expect(cancellationRefund({ ...YEAR, deliveriesMade: 4 }, 1000)).toEqual({
        undelivered: 8,
        undeliveredValue: 720_00,
        fee: 72_00,
        clawback: 40_00,
        refund: 608_00,
      });
    });

    it('with no fee, takes back only the discount', () => {
      expect(cancellationRefund({ ...YEAR, deliveriesMade: 4 }, 0).refund).toBe(680_00);
    });

    it('refunds nothing once every delivery is made', () => {
      expect(cancellationRefund({ ...YEAR, deliveriesMade: 12 }, 1000)).toMatchObject({ undelivered: 0, refund: 0 });
    });

    it('never goes below zero, however late', () => {
      expect(cancellationRefund({ ...YEAR, deliveriesMade: 11 }, 9000).refund).toBe(0);
    });

    it('takes back nothing when there was no discount', () => {
      const r = cancellationRefund({ amountPaid: 1200_00, deliveries: 12, listPerDelivery: 100_00, deliveriesMade: 3 }, 0);
      expect(r).toMatchObject({ clawback: 0, refund: 900_00 });
    });
  });
});
