import { basketFillMessage, boxFill, boxFillMessage } from '../src';

// Pure helpers only — kept free of React Native so this runs without a device.

const ITEMS = [
  { id: 'rice', share: 20 },
  { id: 'oil', share: 10 },
  { id: 'beans', share: 15.5 },
];

describe('boxFill', () => {
  it('is EMPTY with nothing picked', () => {
    expect(boxFill({}, ITEMS, 80)).toEqual({ percent: 0, status: 'EMPTY' });
  });

  it('counts quantity: four bags of rice fill 80%', () => {
    expect(boxFill({ rice: 4 }, ITEMS, 80)).toEqual({ percent: 80, status: 'OK' });
  });

  it('is UNDER below the minimum and OVER past 100%', () => {
    expect(boxFill({ rice: 1, oil: 2 }, ITEMS, 80).status).toBe('UNDER');
    expect(boxFill({ rice: 4, beans: 2 }, ITEMS, 80)).toEqual({ percent: 111, status: 'OVER' });
  });

  it('accepts exactly 100%', () => {
    expect(boxFill({ rice: 5 }, ITEMS, 80).status).toBe('OK');
  });
});

describe('boxFillMessage', () => {
  it('tells the subscriber which way to go', () => {
    expect(boxFillMessage({ percent: 40, status: 'UNDER' }, 80)).toContain('reach 80%');
    expect(boxFillMessage({ percent: 111, status: 'OVER' }, 80)).toContain('Remove or reduce');
  });
});

describe('basketFillMessage', () => {
  it('has no minimum to reach and promises no points', () => {
    const msg = basketFillMessage({ percent: 12, status: 'OK' });
    expect(msg).toBe('Your basket is 12% of the most one delivery can hold.');
    expect(msg).not.toMatch(/points|at least/);
  });

  it('says what to do when the basket is over the maximum', () => {
    expect(basketFillMessage({ percent: 104, status: 'OVER' })).toMatch(/Remove or reduce/);
  });
});
