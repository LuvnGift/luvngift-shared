import { z } from 'zod';
import { OFFERED_INTERVALS, SUBSCRIPTION_BILLINGS, SUBSCRIPTION_INTERVALS } from '../types/subscription.types';
import { MIN_REDEEM } from '../rules/points';

/**
 * Recurring gifting validation, shared by API middleware, web forms and mobile
 * forms. Subscription management is a core service on every platform.
 */

/** Any cadence a subscription can be on (a retired one included). */
export const subscriptionIntervalSchema = z.enum(SUBSCRIPTION_INTERVALS);
/** The cadences a NEW subscriber may choose. */
export const offeredIntervalSchema = z.enum(OFFERED_INTERVALS);
export const substitutionPreferenceSchema = z.enum(['SMART', 'ASK_FIRST', 'NONE']);
/** Per delivery (default), or a year at a time at the annual discount. */
export const subscriptionBillingSchema = z.enum(SUBSCRIPTION_BILLINGS);

/**
 * Recipient dietary constraints — SAFETY, not preference. These override the
 * substitution ladder in both directions.
 */
export const dietarySchema = z.object({
  dietaryFlags: z.array(z.string().trim().min(2).max(40)).max(20).optional(),
  dietaryNotes: z.string().trim().max(500).optional(),
});

/** Most of one item a box may hold. Pickers cap their + button at this. */
export const MAX_BOX_ITEM_QUANTITY = 20;

const boxItemSchema = z.object({
  customItemId: z.string().cuid(),
  quantity: z.number().int().positive().max(MAX_BOX_ITEM_QUANTITY),
});

/**
 * The price a subscriber was shown for their basket, in the smallest unit of
 * their currency. The API re-prices and refuses (409 PRICE_CHANGED) if it
 * moved, so nobody is charged a price they did not see. Ignored for other plans.
 */
export const expectedAmountSchema = z.number().int().positive().max(100_000_00).optional();

/**
 * The first DELIVERY date (YYYY-MM-DD). The range (lead time to 60 days) is
 * checked by the API, because it depends on today and the admin-set lead time.
 * Omitted = start now.
 */
export const firstDeliveryDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD')
  .optional();

export const createSubscriptionSchema = z.object({
  planId: z.string().cuid(),
  addressId: z.string().cuid(),
  interval: offeredIntervalSchema,
  substitutionPreference: substitutionPreferenceSchema.optional(),
  dietaryFlags: z.array(z.string().trim().min(2).max(40)).max(20).optional(),
  dietaryNotes: z.string().trim().max(500).optional(),
  /** The box. Ignored for a curated plan (its contents are the box). */
  items: z.array(boxItemSchema).max(50).optional().default([]),
  firstDeliveryDate: firstDeliveryDateSchema,
  expectedAmount: expectedAmountSchema,
  billing: subscriptionBillingSchema.optional(),
});

export const updateSubscriptionItemsSchema = z.object({
  items: z.array(boxItemSchema).max(50),
  /** A basket: the new price, as shown. */
  expectedAmount: expectedAmountSchema,
});

/** "What would this basket cost me?" Signed in: priced in the buyer's currency. */
export const basketQuoteSchema = z.object({
  planId: z.string().cuid(),
  addressId: z.string().cuid(),
  items: z.array(boxItemSchema).max(50),
});

export const skipCycleSchema = z.object({
  /** true = skip the next cycle (no charge), false = undo a pending skip. */
  skip: z.boolean(),
});

export const updatePreferenceSchema = z.object({
  substitutionPreference: substitutionPreferenceSchema,
});

/** Points put towards a subscription's next charge. */
export const applySubscriptionPointsSchema = z.object({
  points: z.number().int().min(MIN_REDEEM).max(1_000_000),
});

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionItemsInput = z.infer<typeof updateSubscriptionItemsSchema>;
export type BasketQuoteInput = z.infer<typeof basketQuoteSchema>;
export type DietaryInput = z.infer<typeof dietarySchema>;
