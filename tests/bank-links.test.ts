import {
  BANK_LINK_TTL_DAYS,
  bankLinkStatus,
  cancelPartnerBankLinkSchema,
  issuePartnerBankLinkSchema,
  partnerBankAccountSchema,
  partnerBankDetailsSchema,
  partnerBankLinkSubmitSchema,
} from '../src';

/**
 * One-time bank-details links: a partner types their own details, once, from
 * a link sent to the contacts we vetted. The rules below are shared so the
 * API, the partner's page and the admin panel cannot disagree.
 */

const DETAILS = { bankName: 'GTBank', accountNumber: '0123456789', accountName: 'Ngozi Hampers Ltd' };
const NOW = new Date('2026-11-13T12:00:00Z');
const LATER = '2026-11-20T12:00:00Z';
const EARLIER = '2026-11-10T12:00:00Z';

describe('partnerBankLinkSubmitSchema', () => {
  it('accepts matching account numbers', () => {
    const parsed = partnerBankLinkSubmitSchema.safeParse({ ...DETAILS, confirmAccountNumber: '0123456789' });
    expect(parsed.success).toBe(true);
  });

  it('refuses account numbers that do not match, on the confirm field', () => {
    const parsed = partnerBankLinkSubmitSchema.safeParse({ ...DETAILS, confirmAccountNumber: '0123456788' });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0].path).toEqual(['confirmAccountNumber']);
      expect(parsed.error.issues[0].message).toMatch(/do not match/);
    }
  });

  it('applies the same NUBAN rule as admin entry', () => {
    const bad = { ...DETAILS, accountNumber: '12345', confirmAccountNumber: '12345' };
    expect(partnerBankLinkSubmitSchema.safeParse(bad).success).toBe(false);
    expect(partnerBankDetailsSchema.safeParse(bad).success).toBe(false);
  });

  it('carries no 2FA code: the link is the credential', () => {
    const parsed = partnerBankLinkSubmitSchema.parse({ ...DETAILS, confirmAccountNumber: '0123456789' });
    expect(parsed).not.toHaveProperty('totpCode');
  });
});

describe('admin bank details still need 2FA', () => {
  it('partnerBankAccountSchema is the details plus a code', () => {
    expect(partnerBankAccountSchema.safeParse(DETAILS).success).toBe(false);
    expect(partnerBankAccountSchema.safeParse({ ...DETAILS, totpCode: '123456' }).success).toBe(true);
  });
});

describe('issuing and cancelling a link', () => {
  it('sending a link needs a reason and a 2FA code', () => {
    expect(issuePartnerBankLinkSchema.safeParse({ reason: 'Called back on file', totpCode: '123456' }).success).toBe(true);
    expect(issuePartnerBankLinkSchema.safeParse({ reason: 'ok', totpCode: '123456' }).success).toBe(false);
    expect(issuePartnerBankLinkSchema.safeParse({ reason: 'Called back on file' }).success).toBe(false);
  });

  it('cancelling needs a reason but no code (it only removes access)', () => {
    expect(cancelPartnerBankLinkSchema.safeParse({ reason: 'Sent by mistake' }).success).toBe(true);
    expect(cancelPartnerBankLinkSchema.safeParse({ reason: '' }).success).toBe(false);
  });

  it('a link lives for a week', () => {
    expect(BANK_LINK_TTL_DAYS).toBe(7);
  });
});

describe('bankLinkStatus', () => {
  const base = { sentAt: null, usedAt: null, cancelledAt: null, expiresAt: LATER };

  it('is SENDING until delivered, then OPEN', () => {
    expect(bankLinkStatus(base, NOW)).toBe('SENDING');
    expect(bankLinkStatus({ ...base, sentAt: EARLIER }, NOW)).toBe('OPEN');
  });

  it('is EXPIRED once past its expiry, even if never sent', () => {
    expect(bankLinkStatus({ ...base, expiresAt: EARLIER }, NOW)).toBe('EXPIRED');
    expect(bankLinkStatus({ ...base, sentAt: EARLIER, expiresAt: NOW.toISOString() }, NOW)).toBe('EXPIRED');
  });

  it('a used or cancelled link reads as such after it would have expired', () => {
    expect(bankLinkStatus({ ...base, usedAt: EARLIER, expiresAt: EARLIER }, NOW)).toBe('USED');
    expect(bankLinkStatus({ ...base, cancelledAt: EARLIER, expiresAt: EARLIER }, NOW)).toBe('CANCELLED');
  });

  it('accepts Date objects as well as ISO strings', () => {
    expect(bankLinkStatus({ sentAt: new Date(EARLIER), usedAt: null, cancelledAt: null, expiresAt: new Date(LATER) }, NOW)).toBe('OPEN');
  });
});
