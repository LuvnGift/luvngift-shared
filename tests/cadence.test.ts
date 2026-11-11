import { describe, it, expect } from 'vitest';
import { cycleWord, cadenceLabel, cadenceTitle, OFFERED_INTERVALS } from '../src';

describe('cadence wording', () => {
  it('sells monthly, every 2 months and quarterly, not every two weeks', () => {
    expect(OFFERED_INTERVALS).toEqual(['MONTHLY', 'BIMONTHLY', 'QUARTERLY']);
  });

  it('words every cadence, including the retired one', () => {
    expect(cycleWord('QUARTERLY')).toBe('3 months');
    expect(cadenceLabel('BIMONTHLY')).toBe('every 2 months');
    expect(cadenceTitle('BIWEEKLY')).toBe('Every 2 weeks');
  });
});
