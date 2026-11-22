import type { OrderStatus, StaffPermission, UserRole } from './common.types';
import type { OpsNoteTarget } from '../schemas/staff.schemas';

/**
 * What the ops dashboard (`/api/v1/ops/*`) returns. Staff see the RECIPIENT
 * side of an order and the partner doing it, never the buyer, never money,
 * never bank account numbers.
 */

export interface OpsMe {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  title: string | null;
  permissions: StaffPermission[];
  twoFactorEnabled: boolean;
}

/** Order problems, most urgent first: money has been taken on every one. */
export const OPS_PROBLEM_KINDS = ['AWAITING_PARTNER', 'BOX_HELD', 'LINK_UNOPENED', 'DELIVERY_OVERDUE'] as const;
export type OpsProblemKind = (typeof OPS_PROBLEM_KINDS)[number];

export const OPS_PROBLEM_LABELS: Record<OpsProblemKind, string> = {
  AWAITING_PARTNER: 'Paid, no partner yet',
  BOX_HELD: 'Box held for review',
  LINK_UNOPENED: 'Partner has not opened the link',
  DELIVERY_OVERDUE: 'Past the promised delivery window',
};

export interface OpsProblem {
  kind: OpsProblemKind;
  orderId: string;
  reference: string;
  partner: { id: string; name: string } | null;
  destination: string;
  detail: string;
  /** When the problem started (ISO). */
  since: string;
}

export interface OpsQueue {
  generatedAt: string;
  problems: OpsProblem[];
  counts: { awaitingPartner: number; processing: number; shipped: number; deliveredLast7Days: number };
  openFlags: number;
}

export const OPS_ORDER_VIEWS = ['open', 'delivered', 'all'] as const;
export type OpsOrderView = (typeof OPS_ORDER_VIEWS)[number];

export interface OpsOrderSummary {
  id: string;
  reference: string;
  status: OrderStatus;
  kind: 'BUNDLE' | 'SUBSCRIPTION' | 'CUSTOM';
  recipientName: string;
  deliveryCity: string;
  deliveryState: string;
  partner: { id: string; name: string } | null;
  createdAt: string;
  /** Latest date the delivery was promised by (ISO), or null when it cannot be worked out. */
  dueBy: string | null;
  isOverdue: boolean;
  linkLastUsedAt: string | null;
}

export interface OpsOrderLink {
  issuedAt: string;
  expiresAt: string;
  lastUsedAt: string | null;
  active: boolean;
}

export interface OpsOrderDetail extends OpsOrderSummary {
  recipientPhone: string;
  deliveryStreet: string;
  personalMessage: string | null;
  specialInstructions: string | null;
  preferredDeliveryDate: string | null;
  items: { name: string; quantity: number; substitutedForName: string | null; isOmitted: boolean }[];
  events: { kind: string; createdAt: string }[];
  deliveryProofUrl: string | null;
  deliveryProofAt: string | null;
  deliveryProofNote: string | null;
  recipientConfirmedAt: string | null;
  recipientConfirmedVia: string | null;
  partnerContact: { contactName: string | null; phone: string; email: string } | null;
  link: OpsOrderLink | null;
  /** Partners already rated on this order. */
  ratedPartnerIds: string[];
}

export type OpsBankStatus = 'NONE' | 'PENDING_VERIFICATION' | 'VERIFIED';

export interface OpsPartnerScore {
  score: number | null;
  averageRating: number | null;
  onTimeRate: number | null;
  confirmationRate: number | null;
  ratingCount: number;
}

export interface OpsPartnerRow {
  id: string;
  name: string;
  contactName: string | null;
  state: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  isActive: boolean;
  states: string[];
  score: OpsPartnerScore | null;
  openOrders: number;
  lastLinkUsedAt: string | null;
  vetting: { passed: number; required: number };
  bankStatus: OpsBankStatus;
}

export interface OpsPartnerDetail extends OpsPartnerRow {
  phone: string;
  email: string;
  address: string;
  portfolioUrl: string | null;
  cacNumber: string | null;
  createdAt: string;
  vettingChecks: { kind: string; status: string; note: string | null; checkedAt: string | null }[];
  ratings: {
    orderId: string;
    reference: string;
    punctuality: number;
    quality: number;
    communication: number;
    packaging: number | null;
    note: string | null;
    createdAt: string;
  }[];
  recentOrders: OpsOrderSummary[];
}

export interface OpsCoverageRow {
  state: string;
  partners: { id: string; name: string }[];
  pendingApplicants: number;
}

export interface OpsNote {
  id: string;
  targetType: OpsNoteTarget;
  orderId: string | null;
  vendorId: string | null;
  /** Order reference or partner name, for lists. */
  targetLabel: string;
  body: string;
  isFlag: boolean;
  /** For the partner portal: whether the partner may read it. Always false today. */
  partnerVisible: boolean;
  authorName: string;
  createdAt: string;
  resolvedAt: string | null;
  resolvedByName: string | null;
  resolution: string | null;
}
