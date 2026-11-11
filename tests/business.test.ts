import { describe, expect, it } from 'vitest';
import { BUSINESS, businessAddressLine, businessPhoneHref } from '../src';

describe('business identity', () => {
  it('names the legal entity behind the trading name', () => {
    expect(BUSINESS.legalName).toBe('DOCH FX INC');
    expect(businessAddressLine()).toBe('3354 Woodroffe Avenue, Nepean, Ontario K2J 0A8, Canada');
  });

  it('builds a dialable tel: href from a formatted number', () => {
    const original = BUSINESS.phone;
    (BUSINESS as { phone: string }).phone = '+1 (613) 555-0123';
    expect(businessPhoneHref()).toBe('tel:+16135550123');
    (BUSINESS as { phone: string }).phone = original;
  });
});
