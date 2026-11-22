export enum Currency {
  CAD = 'CAD',
  USD = 'USD',
  GBP = 'GBP',
  NGN = 'NGN',
}

/**
 * STAFF is a scoped team member (e.g. the Country Brand Manager): no admin
 * dashboard, only the `/ops` endpoints their `staffPermissions` grant. Like an
 * admin, a staff account cannot shop. See `rules/staff.ts`.
 */
export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
}

/**
 * What a STAFF account may do, one switch each. ADMIN implicitly holds all of
 * them. Deny by default: an endpoint that names no permission is not reachable
 * by staff at all. Money, buyer identity and partner approval are deliberately
 * not grantable here.
 */
export enum StaffPermission {
  /** Order queue, order detail (recipient side only), partners, coverage. */
  OPS_VIEW = 'OPS_VIEW',
  /** Write notes on orders and partners, and raise flags to head office. */
  OPS_NOTES = 'OPS_NOTES',
  /** Record a partner's vetting checks. Approval itself stays with admin. */
  PARTNER_VETTING = 'PARTNER_VETTING',
  /** Rate a partner on a delivered order. */
  PARTNER_RATING = 'PARTNER_RATING',
  /** Confirm a delivery on the recipient's word, after calling them. */
  RECIPIENT_CONFIRM = 'RECIPIENT_CONFIRM',
  /** Re-send an order's partner link by email and SMS (never reveal it). */
  VENDOR_LINK_RESEND = 'VENDOR_LINK_RESEND',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum ChatMessageRole {
  USER = 'USER',
  BOT = 'BOT',
  AGENT = 'AGENT',
}

export enum NotificationType {
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_STATUS_UPDATE = 'ORDER_STATUS_UPDATE',
  PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED',
  CHAT_ESCALATED = 'CHAT_ESCALATED',
  PROMOTIONAL = 'PROMOTIONAL',
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = null> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
