import { isAdultDateOfBirth } from '../src';

const now = new Date('2026-10-19T12:00:00Z');

describe('isAdultDateOfBirth', () => {
  it('draws the line at the 18th birthday', () => {
    expect(isAdultDateOfBirth('2008-10-19', now)).toBe(true);
    expect(isAdultDateOfBirth('2008-10-20', now)).toBe(false);
  });

  it('rejects malformed input', () => {
    expect(isAdultDateOfBirth('2000-1-1', now)).toBe(false);
  });
});
