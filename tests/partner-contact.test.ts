import { CONTACT_CHANGE_HOLD_HOURS, bankLinkHoldUntil, partnerContactChanges, updateVendorSchema } from '../src';

/**
 * A partner's email and phone are where bank-details links go, so a real
 * change needs 2FA and starts a hold. These pin what counts as a change.
 */

const CURRENT = { email: 'ngozi@example.com', phone: '0801 234 5678' };

describe('partnerContactChanges', () => {
  it('nothing sent, or the same values sent back, is no change', () => {
    expect(partnerContactChanges(CURRENT, {})).toEqual([]);
    expect(partnerContactChanges(CURRENT, { email: ' Ngozi@Example.com ', phone: '+234 801 234 5678' })).toEqual([]);
    expect(partnerContactChanges(CURRENT, { phone: '08012345678' })).toEqual([]);
  });

  it('names each field that really changes', () => {
    expect(partnerContactChanges(CURRENT, { email: 'other@example.com' })).toEqual(['email']);
    expect(partnerContactChanges(CURRENT, { phone: '0802 000 0000' })).toEqual(['phone']);
    expect(partnerContactChanges(CURRENT, { email: 'other@example.com', phone: '0802 000 0000' })).toEqual(['email', 'phone']);
  });
});

describe('bankLinkHoldUntil', () => {
  const changed = new Date('2026-11-13T12:00:00Z');

  it('holds for CONTACT_CHANGE_HOLD_HOURS after a change', () => {
    const until = bankLinkHoldUntil(changed, new Date('2026-11-14T12:00:00Z'));
    expect(until?.toISOString()).toBe(new Date(changed.getTime() + CONTACT_CHANGE_HOLD_HOURS * 3_600_000).toISOString());
  });

  it('is null when there was no change or the hold has passed', () => {
    expect(bankLinkHoldUntil(null)).toBeNull();
    expect(bankLinkHoldUntil(changed, new Date('2026-11-15T12:00:01Z'))).toBeNull();
  });
});

describe('updateVendorSchema', () => {
  it('accepts an optional 6-digit 2FA code alongside the fields', () => {
    expect(updateVendorSchema.safeParse({ notes: 'x' }).success).toBe(true);
    expect(updateVendorSchema.safeParse({ email: 'a@b.co', totpCode: '123456' }).success).toBe(true);
    expect(updateVendorSchema.safeParse({ email: 'a@b.co', totpCode: '12' }).success).toBe(false);
  });
});
