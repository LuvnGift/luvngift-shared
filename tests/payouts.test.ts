import {
  accountLast4,
  isBankAccountPayable,
  maskAccountNumber,
  partnerBankAccountSchema,
  payoutCancelSchema,
  payoutPaidSchema,
  verifyPartnerBankAccountSchema,
} from '../src';

describe('maskAccountNumber', () => {
  it('shows only the last four digits', () => {
    expect(maskAccountNumber('0123456789')).toBe('••••6789');
  });
  it('never reveals a short value', () => {
    expect(maskAccountNumber('1234')).toBe('••••');
    expect(maskAccountNumber('')).toBe('••••');
  });
  it('ignores spaces and separators', () => {
    expect(maskAccountNumber('0123 456 789')).toBe('••••6789');
    expect(accountLast4('0123-456-789')).toBe('6789');
  });
});

describe('isBankAccountPayable', () => {
  it('only a verified account is payable', () => {
    expect(isBankAccountPayable({ status: 'VERIFIED' })).toBe(true);
    expect(isBankAccountPayable({ status: 'PENDING_VERIFICATION' })).toBe(false);
    expect(isBankAccountPayable({ status: 'SUPERSEDED' })).toBe(false);
    expect(isBankAccountPayable(null)).toBe(false);
  });
});

describe('partnerBankAccountSchema', () => {
  const valid = { bankName: 'GTBank', accountNumber: '0123456789', accountName: 'Ada Hampers Ltd', totpCode: '123456' };

  it('accepts a 10-digit NUBAN', () => {
    expect(partnerBankAccountSchema.parse(valid).accountNumber).toBe('0123456789');
  });
  it.each(['012345678', '01234567890', '01234abcde'])('refuses account number %s', (accountNumber) => {
    expect(partnerBankAccountSchema.safeParse({ ...valid, accountNumber }).success).toBe(false);
  });
  it('requires a 2FA code', () => {
    const { totpCode: _omit, ...rest } = valid;
    expect(partnerBankAccountSchema.safeParse(rest).success).toBe(false);
    expect(partnerBankAccountSchema.safeParse({ ...valid, totpCode: '12345' }).success).toBe(false);
  });
});

describe('payout action schemas', () => {
  it('mark-paid needs a reference and a 2FA code', () => {
    expect(payoutPaidSchema.safeParse({ reference: 'TRF-001', totpCode: '000111' }).success).toBe(true);
    expect(payoutPaidSchema.safeParse({ reference: 'ab', totpCode: '000111' }).success).toBe(false);
    expect(payoutPaidSchema.safeParse({ reference: 'TRF-001' }).success).toBe(false);
  });
  it('cancel needs a reason and a 2FA code', () => {
    expect(payoutCancelSchema.safeParse({ reason: 'Duplicate order', totpCode: '000111' }).success).toBe(true);
    expect(payoutCancelSchema.safeParse({ reason: 'no', totpCode: '000111' }).success).toBe(false);
  });
  it('verification needs a method and what was checked', () => {
    expect(
      verifyPartnerBankAccountSchema.safeParse({ method: 'NAME_CHECK', note: 'GTBank app showed ADA HAMPERS LTD', totpCode: '000111' }).success,
    ).toBe(true);
    expect(verifyPartnerBankAccountSchema.safeParse({ method: 'GUESS', note: 'looked fine', totpCode: '000111' }).success).toBe(false);
  });
});
