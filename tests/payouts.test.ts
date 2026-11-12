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

import {
  createPayoutBatchSchema,
  partnerAdjustmentSchema,
  payoutRef,
  planBatch,
  transferFailedSchema,
} from '../src';

describe('planBatch', () => {
  const payable = new Set(['a', 'b', 'c']);

  it('nets each partner, largest first', () => {
    const plan = planBatch(
      [
        { vendorId: 'a', amountNgn: 50_000_00 },
        { vendorId: 'b', amountNgn: 90_000_00 },
        { vendorId: 'a', amountNgn: 30_000_00 },
        { vendorId: 'a', amountNgn: -10_000_00 },
      ],
      payable,
    );
    expect(plan).toEqual([
      { vendorId: 'b', netNgn: 90_000_00, itemCount: 1, excluded: null },
      { vendorId: 'a', netNgn: 70_000_00, itemCount: 3, excluded: null },
    ]);
  });

  it('carries forward a partner who owes more than is due', () => {
    const [plan] = planBatch([{ vendorId: 'c', amountNgn: 20_000_00 }, { vendorId: 'c', amountNgn: -25_000_00 }], payable);
    expect(plan).toMatchObject({ netNgn: -5_000_00, excluded: 'NOT_POSITIVE' });
  });

  it('a net of exactly zero is not a transfer', () => {
    const [plan] = planBatch([{ vendorId: 'c', amountNgn: 1_00 }, { vendorId: 'c', amountNgn: -1_00 }], payable);
    expect(plan.excluded).toBe('NOT_POSITIVE');
  });

  it('leaves out a partner without verified bank details', () => {
    const [plan] = planBatch([{ vendorId: 'z', amountNgn: 10_000_00 }], payable);
    expect(plan.excluded).toBe('NO_VERIFIED_BANK_ACCOUNT');
  });

  it('nothing due, nothing planned', () => {
    expect(planBatch([], payable)).toEqual([]);
  });
});

describe('phase 2 schemas', () => {
  const cuid = 'ckz1a2b3c0000qwertyuiop12';

  it('a batch needs at least one partner and a 2FA code', () => {
    expect(createPayoutBatchSchema.safeParse({ vendorIds: [cuid], totpCode: '123456' }).success).toBe(true);
    expect(createPayoutBatchSchema.safeParse({ vendorIds: [], totpCode: '123456' }).success).toBe(false);
    expect(createPayoutBatchSchema.safeParse({ vendorIds: [cuid] }).success).toBe(false);
  });

  it('an adjustment is signed, non-zero, capped and explained', () => {
    const base = { reason: 'Overpaid order #AB12CD34 by mistake', totpCode: '123456' };
    expect(partnerAdjustmentSchema.safeParse({ ...base, amountNgn: -5_000_00 }).success).toBe(true);
    expect(partnerAdjustmentSchema.safeParse({ ...base, amountNgn: 5_000_00 }).success).toBe(true);
    expect(partnerAdjustmentSchema.safeParse({ ...base, amountNgn: 0 }).success).toBe(false);
    expect(partnerAdjustmentSchema.safeParse({ ...base, amountNgn: 5_000_000_01 }).success).toBe(false);
    expect(partnerAdjustmentSchema.safeParse({ ...base, amountNgn: 10.5 }).success).toBe(false);
    expect(partnerAdjustmentSchema.safeParse({ ...base, reason: 'oops', amountNgn: 100 }).success).toBe(false);
  });

  it('a failed transfer needs a reason', () => {
    expect(transferFailedSchema.safeParse({ reason: 'Bounced: account dormant', totpCode: '123456' }).success).toBe(true);
    expect(transferFailedSchema.safeParse({ reason: 'x', totpCode: '123456' }).success).toBe(false);
  });

  it('payoutRef is the last 8 characters, upper-cased', () => {
    expect(payoutRef('ckz1a2b3c0000qwertyuiop12')).toBe('LG-TYUIOP12');
  });
});
