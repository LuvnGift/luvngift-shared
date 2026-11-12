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
  | 'BANK_ACCOUNT_SUPERSEDED'
  | 'PAYOUT_BATCHED'
  | 'PAYOUT_RETURNED'
  | 'ADJUSTMENT_ADDED'
  | 'ADJUSTMENT_CANCELLED'
  | 'ADJUSTMENT_BATCHED'
  | 'ADJUSTMENT_PAID'
  | 'ADJUSTMENT_RETURNED'
  | 'TRANSFER_CREATED'
  | 'TRANSFER_PAID'
  | 'TRANSFER_FAILED'
  | 'BATCH_EXPORTED';

/** One row of the append-only partner money trail. */
export interface PayoutEventView {
  id: string;
  kind: PayoutEventKind;
  vendorId: string;
  payoutId: string | null;
  bankAccountId: string | null;
  batchId: string | null;
  transferId: string | null;
  adjustmentId: string | null;
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

// ─── Batches (phase 2) ───────────────────────────────────────────────────────

export type PayoutBatchStatus = 'OPEN' | 'CLOSED';
export type PayoutTransferStatus = 'PENDING' | 'PAID' | 'FAILED';
export type PartnerAdjustmentStatus = 'DUE' | 'BATCHED' | 'PAID' | 'CANCELLED';

/** One partner in the batch preview: what a transfer would be today. */
export interface BatchPreviewPartner {
  vendorId: string;
  name: string;
  netNgn: number;
  itemCount: number;
  excluded: import('../rules/payouts').BatchExclusion | null;
  /** Masked: the account the transfer would go to. */
  account: { bankName: string; accountLast4: string; accountName: string } | null;
  /** The oldest item: how long this partner has been waiting. */
  oldestDueAt: string;
}

export interface PayoutTransferView {
  id: string;
  batchId: string;
  vendorId: string;
  vendorName: string;
  bankName: string;
  accountLast4: string;
  accountName: string;
  amountNgn: number;
  status: PayoutTransferStatus;
  reference: string | null;
  proofUrl: string | null;
  note: string | null;
  failureReason: string | null;
  settledAt: string | null;
  settledByEmail: string | null;
  items: {
    kind: 'PAYOUT' | 'ADJUSTMENT';
    id: string;
    amountNgn: number;
    orderId: string | null;
    /** ADVANCE / BALANCE for a payout; the reason for an adjustment. */
    label: string;
  }[];
}

export interface PayoutBatchView {
  id: string;
  status: PayoutBatchStatus;
  note: string | null;
  createdByEmail: string;
  createdAt: string;
  closedAt: string | null;
  totalNgn: number;
  paidNgn: number;
  transferCount: number;
  pendingCount: number;
  exportedAt: string | null;
}

export interface PartnerAdjustmentView {
  id: string;
  vendorId: string;
  vendorName: string;
  amountNgn: number;
  reason: string;
  orderId: string | null;
  status: PartnerAdjustmentStatus;
  transferId: string | null;
  createdByEmail: string;
  cancelledReason: string | null;
  createdAt: string;
}
