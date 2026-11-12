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

// ─── Reporting (phase 3) ─────────────────────────────────────────────────────

export interface PayoutFundingView {
  id: string;
  fundedOn: string;
  amountNgn: number;
  sourceAmount: number;
  sourceCurrency: 'CAD' | 'USD' | 'GBP';
  /** Naira per 1 unit of the source currency. */
  rate: number;
  provider: string;
  reference: string | null;
  note: string | null;
  createdByEmail: string;
  voidedAt: string | null;
  voidedReason: string | null;
  createdAt: string;
}

export interface PayoutReconciliationView {
  id: string;
  month: string;
  recordedPaidNgn: number;
  bankOutflowNgn: number;
  /** bank minus recorded. Positive: more left the bank than we recorded. */
  differenceNgn: number;
  note: string | null;
  reconciledByEmail: string;
  createdAt: string;
}

/** One payment that left the naira account in the month: a batch transfer or a single payout. */
export interface MonthlyPaymentLine {
  kind: 'TRANSFER' | 'PAYOUT';
  id: string;
  ref: string;
  paidAt: string;
  vendorId: string;
  vendorName: string;
  bankName: string | null;
  accountLast4: string | null;
  reference: string | null;
  amountNgn: number;
}

export interface MonthlyPayoutReport {
  month: string;
  payments: MonthlyPaymentLine[];
  paidNgn: number;
  byPartner: { vendorId: string; vendorName: string; paidNgn: number; count: number }[];
  funding: { currency: 'CAD' | 'USD' | 'GBP'; sourceAmount: number; amountNgn: number; rate: number }[];
  fundedNgn: number;
  /** As of now, not as of the month end. */
  outstanding: { dueNgn: number; batchedNgn: number; adjustmentsNetNgn: number };
  reconciliations: PayoutReconciliationView[];
}

export interface PartnerPayoutSummary {
  dueNgn: number;
  batchedNgn: number;
  adjustmentsNetNgn: number;
  paidThisMonthNgn: number;
  paidAllTimeNgn: number;
  lastPaidAt: string | null;
}

/**
 * An order's money in and out. `estimate` is in CAD (the reporting currency)
 * and excludes card fees, which are not stored: it is a guide, not accounts.
 */
export interface OrderMoneyView {
  moneyIn: { currency: string; totalMinor: number; refundedMinor: number; paymentStatus: string | null; cadRate: number };
  moneyOut: { owedNgn: number; paidNgn: number; batchedNgn: number; dueNgn: number; adjustmentsNgn: number };
  estimate: {
    netInCadCents: number;
    partnerCostCadCents: number;
    marginCadCents: number;
    /** Naira per CA$ from the latest CAD funding on or before the order. */
    fundingRate: number;
    fundingDate: string;
  } | null;
}
