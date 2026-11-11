import { describe, expect, it } from 'vitest';
import { isAdultDateOfBirth, latestAdultDateOfBirth } from '../src';

const now = new Date('2026-10-19T12:00:00Z');

describe('isAdultDateOfBirth', () => {
  it('draws the line at the 18th birthday', () => {
    expect(isAdultDateOfBirth('2008-10-19', now)).toBe(true);
    expect(isAdultDateOfBirth('2008-10-20', now)).toBe(false);
  });

  it('rejects malformed and implausible input', () => {
    expect(isAdultDateOfBirth('19/10/2000', now)).toBe(false);
    expect(isAdultDateOfBirth('1850-01-01', now)).toBe(false);
  });

  it('gives the date input a max matching the rule', () => {
    expect(latestAdultDateOfBirth(now)).toBe('2008-10-19');
  });
});
