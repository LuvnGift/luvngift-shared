import { describe, expect, it } from 'vitest';
import { boxFill } from '../src';

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

  it('is UNDER below the minimum fill', () => {
    expect(boxFill({ rice: 1, oil: 2 }, ITEMS, 80)).toEqual({ percent: 40, status: 'UNDER' });
  });

  it('accepts exactly 100%', () => {
    expect(boxFill({ rice: 5 }, ITEMS, 80).status).toBe('OK');
  });

  it('is OVER past 100%', () => {
    expect(boxFill({ rice: 4, beans: 2 }, ITEMS, 80)).toEqual({ percent: 111, status: 'OVER' });
  });

  it('ignores items it has no share for rather than counting them as free space', () => {
    expect(boxFill({ gone: 3, rice: 4 }, ITEMS, 80).percent).toBe(80);
  });
});
