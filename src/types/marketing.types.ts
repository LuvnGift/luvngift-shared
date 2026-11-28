/** GET /marketing/preference */
export interface MarketingPreference {
  optedIn: boolean;
  /** ISO time consent was last given, or null. */
  consentAt: string | null;
  /** True while the one-time in-app question has not been answered. */
  promptPending: boolean;
}

/** One weekly issue as admin sees it. */
export interface MarketingIssue {
  weekOf: string;
  bundleIds: string[];
  headline: string | null;
  intro: string | null;
  /** True when admin set it; false when the job filled it in automatically. */
  chosenByAdmin: boolean;
  sentAt: string | null;
  stats: { sent: number; clicked: number; unsubscribed: number };
}

/** GET /admin/marketing/issues/:weekOf/preview */
export interface MarketingIssuePreview {
  subject: string;
  html: string;
  /** How many people it would go to if it ran now. */
  recipients: number;
}

/** GET /admin/metrics/funnel: customers who registered in the last `days`. */
export interface FunnelMetrics {
  days: number;
  registered: number;
  verifiedEmail: number;
  /**
   * Saved a billing country, street and city: the API refuses an order
   * without all three, so this is the last step before an order can exist.
   */
  savedBillingAddress: number;
  startedOrder: number;
  paidOrder: number;
  email: {
    optedIn: number;
    /** Sends across the last four issues. */
    sent: number;
    clicked: number;
    /** Clicked, then paid for an order within 7 days of the click. */
    paidAfterClick: number;
  };
}

/**
 * GET /admin/marketing/policy-notice: the one-time "we've updated our Privacy
 * Policy" email. A service notice, not marketing: it goes to every verified
 * customer and must never ask for marketing consent.
 */
export interface PolicyNoticeStatus {
  /** The policy version this notice announces. */
  version: string;
  /** Human date shown in the email, e.g. "26 November 2026". */
  updatedOn: string;
  /** Verified customers who should get it. */
  eligible: number;
  /** Of those, already sent this version. */
  sent: number;
  remaining: number;
  /** A send is running in this API instance right now. */
  running: boolean;
}
