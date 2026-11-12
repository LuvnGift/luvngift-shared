/**
 * Partner payout rules shared by the API and the admin dashboard.
 */

/**
 * An account number as lists show it: the last four digits only. The full
 * number is shown only on the verified detail view, where admin needs it to pay.
 */
export function maskAccountNumber(accountNumber: string): string {
  const digits = accountNumber.replace(/\D/g, '');
  if (digits.length <= 4) return '••••';
  return `••••${digits.slice(-4)}`;
}

/** Last four digits, stored beside the account so lists never need the full number. */
export function accountLast4(accountNumber: string): string {
  return accountNumber.replace(/\D/g, '').slice(-4);
}

/** Bank details may be paid only once verified and while current. */
export function isBankAccountPayable(account: { status: string } | null | undefined): boolean {
  return account?.status === 'VERIFIED';
}

// ─── Batch planning (phase 2) ────────────────────────────────────────────────

export interface BatchItem {
  vendorId: string;
  /** Kobo. Payouts are positive; an adjustment may be negative. */
  amountNgn: number;
}

export type BatchExclusion = 'NO_VERIFIED_BANK_ACCOUNT' | 'NOT_POSITIVE';

export interface BatchPartnerPlan {
  vendorId: string;
  /** What the transfer would be: everything due, adjustments netted off. */
  netNgn: number;
  itemCount: number;
  /** null = payable in this batch. */
  excluded: BatchExclusion | null;
}

/**
 * Groups what is due by partner and nets adjustments off. A partner is left
 * out (and everything of theirs stays due for a later batch) when they have
 * no verified bank account, or when their net is zero or negative, which
 * happens when an overpayment is bigger than what they are now owed.
 * Sorted by net, largest first.
 */
export function planBatch(items: BatchItem[], payableVendorIds: ReadonlySet<string>): BatchPartnerPlan[] {
  const byVendor = new Map<string, { netNgn: number; itemCount: number }>();
  for (const item of items) {
    const entry = byVendor.get(item.vendorId) ?? { netNgn: 0, itemCount: 0 };
    entry.netNgn += item.amountNgn;
    entry.itemCount += 1;
    byVendor.set(item.vendorId, entry);
  }
  return [...byVendor.entries()]
    .map(([vendorId, { netNgn, itemCount }]) => ({
      vendorId,
      netNgn,
      itemCount,
      excluded: !payableVendorIds.has(vendorId)
        ? ('NO_VERIFIED_BANK_ACCOUNT' as const)
        : netNgn <= 0
          ? ('NOT_POSITIVE' as const)
          : null,
    }))
    .sort((a, b) => b.netNgn - a.netNgn);
}

export const BATCH_EXCLUSION_LABELS: Record<BatchExclusion, string> = {
  NO_VERIFIED_BANK_ACCOUNT: 'No verified bank details',
  NOT_POSITIVE: 'Owes more than is due (carried forward)',
};

/** A batch or transfer reference as admin, the CSV and the partner's statement show it. */
export function payoutRef(id: string): string {
  return `LG-${id.slice(-8).toUpperCase()}`;
}
