import { describe, it, expect } from 'vitest';
import { pointsForFill, pointsValue } from '../src';

describe('points preview', () => {
  it('matches the API: 10 points per full 5% unfilled', () => {
    expect(pointsForFill(80)).toBe(40);
    expect(pointsForFill(83)).toBe(30);
    expect(pointsForFill(100)).toBe(0);
    expect(pointsForFill(110)).toBe(0);
  });

  it('values points at the admin rate, rounding down', () => {
    expect(pointsValue(640, 100)).toBe(640);
    expect(pointsValue(555, 200)).toBe(277);
  });
});
