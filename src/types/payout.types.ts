import type { BankVerificationMethod } from '../schemas/partner-payout.schemas';

export type PartnerBankAccountStatus = 'PENDING_VERIFICATION' | 'VERIFIED' | 'SUPERSEDED';

/**
 * A partner's bank account as admin reads it. Lists carry `accountLast4` only;
 * `accountNumber` is present on the partner's own Bank details panel.
 */
export interface PartnerBankAccountView {
  id: string;
  bankName: string;
  accountName: string;
  accountLast4: string;
  accountNumber?: string;
  status: PartnerBankAccountStatus;
  verificationMethod: BankVerificationMethod | null;
  verificationNote: string | null;
  verifiedAt: string | null;
  verifiedByEmail: string | null;
  createdByEmail: string;
  supersededAt: string | null;
  createdAt: string;
}

export type PayoutEventKind =
  | 'PAYOUT_ACCRUED'
  | 'PAYOUT_PAID'
  | 'PAYOUT_CANCELLED'
  | 'BANK_ACCOUNT_ADDED'
  | 'BANK_ACCOUNT_VERIFIED'
  | 'BANK_ACCOUNT_SUPERSEDED';

/** One row of the append-only partner money trail. */
export interface PayoutEventView {
  id: string;
  kind: PayoutEventKind;
  vendorId: string;
  payoutId: string | null;
  bankAccountId: string | null;
  orderId: string | null;
  amountNgn: number | null;
  reference: string | null;
  proofUrl: string | null;
  note: string | null;
  /** null = the system (an order delivered, reassigned or closed). */
  actorEmail: string | null;
  requestId: string | null;
  createdAt: string;
}
