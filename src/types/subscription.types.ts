import type { Currency } from './common.types';

/**
 * Recurring gifting contract, shared by API, web and mobile.
 *
 * Subscription management is a core service on every platform, so this lives in
 * the shared package rather than being duplicated per app. Anything the API
 * sends or accepts about subscriptions is declared here, never restated in an app.
 */

/**
 * These are wire values: they arrive from JSON as plain strings, so they're
 * const arrays + union types rather than TS enums. An enum would force a cast
 * at every API boundary in both clients.
 */

/**
 * Every cadence a subscription can be on. BIWEEKLY is no longer sold
 * (2026-11-06) but subscribers already on it keep billing, so it stays valid.
 */
export const SUBSCRIPTION_INTERVALS = ['MONTHLY', 'BIMONTHLY', 'QUARTERLY', 'BIWEEKLY'] as const;
export type SubscriptionInterval = (typeof SUBSCRIPTION_INTERVALS)[number];

/** The cadences on sale to new subscribers. */
export const OFFERED_INTERVALS = ['MONTHLY', 'BIMONTHLY', 'QUARTERLY'] as const;
export type OfferedInterval = (typeof OFFERED_INTERVALS)[number];

export const SUBSCRIPTION_STATUSES = [
  'ACTIVE',
  'PAUSED',
  /** Stripe couldn't collect. Deliveries continue during the retry window. */
  'PAST_DUE',
  'CANCELLED',
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

/**
 * ALLOWANCE: the subscriber fills a box to a naira allowance (retired for new
 * plans). CURATED: we set the box. BASKET: the subscriber fills a cart up to a
 * maximum and pays for what is in it.
 */
export const SUBSCRIPTION_PLAN_KINDS = ['ALLOWANCE', 'CURATED', 'BASKET'] as const;
export type SubscriptionPlanKind = (typeof SUBSCRIPTION_PLAN_KINDS)[number];

/** Per delivery, or a year of deliveries paid at once at the annual discount. */
export const SUBSCRIPTION_BILLINGS = ['PER_DELIVERY', 'ANNUAL'] as const;
export type SubscriptionBilling = (typeof SUBSCRIPTION_BILLINGS)[number];

/** The plan kinds that can be paid for by the year. */
export const ANNUAL_PLAN_KINDS: readonly SubscriptionPlanKind[] = ['CURATED', 'BASKET'];

/** Whether a plan of this kind can be paid for by the year. */
export const isAnnualPlanKind = (kind: string | null | undefined): boolean =>
  (ANNUAL_PLAN_KINDS as readonly string[]).includes(kind ?? '');

/**
 * How the subscriber wants unavailable items handled.
 * SMART — replace with equal or better, no delivery delay (default).
 * ASK_FIRST — contact the subscriber, fall back to SMART after 24h.
 * NONE — never replace; omit and make good.
 */
export const SUBSTITUTION_PREFERENCES = ['SMART', 'ASK_FIRST', 'NONE'] as const;
export type SubstitutionPreference = (typeof SUBSTITUTION_PREFERENCES)[number];

/**
 * Hard constraints on what may be delivered to a recipient.
 * SAFETY, not preference: these override the substitution ladder in both
 * directions. See SUBSTITUTION-POLICY.md clause 3.
 */
export const DIETARY_FLAGS = [
  'Peanuts / groundnuts',
  'Tree nuts',
  'Dairy',
  'Gluten',
  'Shellfish',
  'Eggs',
  'Soy',
  'No alcohol',
  'No pork',
  'Halal only',
  'Vegetarian',
] as const;

export type DietaryFlag = (typeof DIETARY_FLAGS)[number];

export interface SubscriptionPrice {
  id: string;
  interval: SubscriptionInterval;
  currency: Currency;
  /** Smallest currency unit, like every other monetary value. */
  amount: number;
  /**
   * ANNUAL: `amount` is a year of deliveries at this cadence. An annual row has
   * the same interval and currency as the per-delivery one, so every lookup
   * must say which billing it wants (see `pickPrice`). Missing = per delivery.
   */
  billing?: SubscriptionBilling;
}

/** One line of a curated box, as the public may see it (never a naira cost). */
export interface PlanContent {
  quantity: number;
  customItem: {
    id: string;
    name: string;
    description?: string | null;
    category: string;
    /** Nigerian states it can be sourced in; empty = nationwide. */
    availableStates: string[];
  };
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  /** ALLOWANCE plans: how many different items a box may hold. */
  slotCount: number;
  image?: string | null;
  sortOrder: number;
  isActive: boolean;
  prices: SubscriptionPrice[];
  /** Missing from an API older than curated plans: treat as ALLOWANCE. */
  kind?: SubscriptionPlanKind;
  /** CURATED: what every delivery holds. */
  contents?: PlanContent[];
  /** The cadences sold. A basket has no fixed prices, so this is its list. */
  intervals?: SubscriptionInterval[];
  /** ALLOWANCE: how full a box must be. */
  boxMinFillPercent?: number;
  /** What paying for the year saves; null when the plan is not sold by the year. */
  annualDiscountPercent?: number | null;
}

/**
 * A picker item. `share` is the percentage of the plan's box (or a basket's
 * maximum) one unit uses; the naira cost behind it is never sent.
 */
export interface BoxCatalogueItem {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  /** The admin-chosen aisle icon key (see ITEM_CATEGORY_ICONS). */
  categoryIcon?: string | null;
  share: number | null;
}

/** @deprecated The API never sends a catalogue item's price to a subscriber; use BoxCatalogueItem. */
export interface SubscriptionCatalogueItem {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  currency: Currency;
  category: string;
}

export interface SubscriptionItem {
  id: string;
  quantity: number;
  customItem: { id: string; name: string; description?: string | null; category: string };
}

export interface SubscriptionRecipient {
  id?: string;
  recipientName: string;
  city: string;
  state: string;
  dietaryFlags?: string[];
  dietaryNotes?: string | null;
}

/** One delivery of a subscription, as its subscriber may see it. */
export interface SubscriptionDelivery {
  id: string;
  status: string;
  createdAt: string;
  preferredDeliveryDate: string | null;
  deliveryProofUrl: string | null;
  deliveryProofAt: string | null;
}

/** The year being delivered on an annual plan. */
export interface SubscriptionTermSummary {
  deliveries: number;
  deliveriesMade: number;
  nextDueAt: string | null;
  startedAt: string;
  amountPaid: number;
}

export interface Subscription {
  id: string;
  addressId?: string;
  status: SubscriptionStatus;
  interval: SubscriptionInterval;
  currency: Currency;
  substitutionPreference: SubstitutionPreference;
  /** What THIS subscriber is charged per charge (a year, for ANNUAL). */
  amount?: number | null;
  billing?: SubscriptionBilling;
  currentPeriodEnd?: string | null;
  /** Start of the promised delivery window for the upcoming cycle. */
  nextDeliveryDate?: string | null;
  /** First charge time of a subscription that starts later; null = already charging. */
  startsAt?: string | null;
  skipNextCycle: boolean;
  cancelAtPeriodEnd: boolean;
  plan: SubscriptionPlan;
  address: SubscriptionRecipient;
  items: SubscriptionItem[];
  /** The latest deliveries. */
  orders?: SubscriptionDelivery[];
  /** ANNUAL: the year being delivered (at most one). */
  terms?: SubscriptionTermSummary[];
}

export interface CreateSubscriptionResult {
  subscriptionId: string;
  stripeSubscriptionId: string;
  /** Null when nothing needed confirming. */
  clientSecret: string | null;
  /** Which Stripe call confirms it: confirmSetup for a later start, confirmPayment otherwise. */
  intentType?: 'setup' | 'payment';
  /** When the first charge is taken; null = it was taken now. */
  startsAt?: string | null;
  firstDeliveryFrom?: string | null;
}

/** POST /subscriptions/basket-quote. */
export interface BasketQuote {
  currency: Currency;
  /** Per delivery, smallest unit; null for an empty basket. */
  amount: number | null;
  /** How much of the plan's maximum it uses. */
  fillPercent: number;
  /** The same basket paid for the year, per cadence. */
  annual: { discountPercent: number; amounts: Partial<Record<SubscriptionInterval, number>> } | null;
}

/** GET /subscriptions/:id/cancel-quote: what cancelling an annual plan now refunds (Refund Policy § 6). */
export interface CancelQuote {
  currency: Currency;
  feePercent: number;
  undelivered: number;
  undeliveredValue: number;
  fee: number;
  clawback: number;
  refund: number;
  deliveriesMade: number;
  deliveries: number;
  amountPaid: number;
}

/** GET /subscriptions/start-dates. */
export interface StartDates {
  earliest: string;
  latest: string;
  leadDays: number;
  maxDaysAhead: number;
}
