import { previewChargeDate, shiftDate } from '../src';

/** Must agree with the API's planStart, or the app promises a different charge date. */
describe('previewChargeDate', () => {
  const NOW = new Date('2026-11-06T15:00:00.000Z');

  it('is the lead time before the first delivery, at 09:00 UTC', () => {
    expect(previewChargeDate('2026-12-20', 3, NOW)).toEqual(new Date('2026-12-17T09:00:00.000Z'));
  });

  it('is null (charged now) when under 48 hours away', () => {
    expect(previewChargeDate('2026-11-11', 3, NOW)).toBeNull();
    expect(previewChargeDate('2026-11-12', 3, NOW)).not.toBeNull();
  });
});

describe('shiftDate', () => {
  it('moves by days and stays inside the allowed range', () => {
    expect(shiftDate('2026-11-30', 1, '2026-11-09', '2027-01-05')).toBe('2026-12-01');
    expect(shiftDate('2026-11-10', -7, '2026-11-09', '2027-01-05')).toBe('2026-11-09');
    expect(shiftDate('2027-01-01', 7, '2026-11-09', '2027-01-05')).toBe('2027-01-05');
  });
});
