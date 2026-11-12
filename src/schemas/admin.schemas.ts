import { z } from 'zod';
import { OFFERED_INTERVALS, SUBSCRIPTION_PLAN_KINDS } from '../types/subscription.types';
import { ITEM_CATEGORY_ICONS } from '../rules/aisles';
import { offeredIntervalSchema, updateSubscriptionItemsSchema } from './subscription.schemas';
import { createBundleSchema } from './bundle.schemas';
import { phoneSchema } from './order.schemas';
import { FULFILMENT_BANDS, bandFeeProblem } from '../rules/fulfilment-bands';
import { NIGERIAN_STATES } from '../constants';

/**
 * The admin dashboard's wire contract with the API. The API validates every
 * admin request with these; the web admin forms parse their text inputs into
 * these shapes and use the same limits, so a form never accepts what the API
 * then refuses with an opaque 400. Mobile does not use them.
 */

// ─── Shared building blocks ──────────────────────────────────────────────────

/** A naira amount in kobo. ₦100m is a typo guard, not a business limit. */
export const KOBO_MAX = 100_000_000_00;
export const koboSchema = z.number().int().min(0).max(KOBO_MAX);

/** Percent with at most two decimals (25.5 = 25.5%). Stored as basis points. */
export const percentSchema = (max: number) =>
  z
    .number()
    .min(0)
    .max(max)
    .refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6, 'At most two decimal places');

/** The most the platform's share of a price may be, in percent. */
export const PLATFORM_PERCENT_MAX = 60;

/** Every on-behalf or consequential admin change is explained, so the reason must say something. */
export const ADMIN_REASON_MIN = 10;
export const ADMIN_REASON_MAX = 500;
const reason = (message: string) => z.string().trim().min(ADMIN_REASON_MIN, message).max(ADMIN_REASON_MAX);

/**
 * What admin enters per bundle or plan. The goods amount is named per caller;
 * the fulfilment fee is NOT entered here: it is the HIGH band fee from
 * Settings → Fulfilment, so every price covers every state.
 */
export const costStackSchema = z.object({
  /** The branded packaging for one order, in kobo. */
  packagingNgn: koboSchema,
  /** The platform's share of the price. */
  platformPercent: percentSchema(PLATFORM_PERCENT_MAX),
});

/** 62.5% → 6250 basis points. */
export const toBps = (percent: number) => Math.round(percent * 100);

// ─── Bundles ─────────────────────────────────────────────────────────────────

/** How a bundle is priced: the price is derived from this when published, never typed. */
export const bundlePricingSchema = costStackSchema.extend({
  /** What one bundle's goods cost to buy, in kobo. */
  sourcingNgn: koboSchema.refine((v) => v > 0, 'The goods cost must be more than zero'),
});

/** The shared create schema with the typed price swapped for the cost stack. */
export const adminCreateBundleSchema = createBundleSchema.omit({ price: true, currency: true }).merge(bundlePricingSchema);

export type BundlePricingBody = z.infer<typeof bundlePricingSchema>;
export type AdminCreateBundleInput = z.infer<typeof adminCreateBundleSchema>;

// ─── Subscription plans ──────────────────────────────────────────────────────

export const planKindSchema = z.enum(SUBSCRIPTION_PLAN_KINDS);

/** Most different items a curated box may hold, and most of one item. */
export const PLAN_CONTENTS_MAX = 50;
export const PLAN_CONTENT_QUANTITY_MAX = 50;

/** What a curated plan delivers: catalogue items and how many of each. */
export const planContentsSchema = z
  .array(z.object({ customItemId: z.string().cuid(), quantity: z.number().int().min(1).max(PLAN_CONTENT_QUANTITY_MAX) }))
  .min(1, 'A curated box needs at least one item')
  .max(PLAN_CONTENTS_MAX)
  .refine((v) => new Set(v.map((i) => i.customItemId)).size === v.length, 'Each item once');

/**
 * How a plan is priced. Prices are never entered: they are derived from these
 * at today's rate when published. The goods line comes from `boxAllowanceNgn`
 * for an allowance plan (a basket's maximum, for a basket), and from the
 * catalogue cost of the contents for a curated one: `contents` here only
 * previews a curated plan not yet created.
 */
export const planPricingSchema = costStackSchema.extend({
  /** A plan not yet created: whether to preview annual prices too. */
  kind: planKindSchema.optional(),
  boxAllowanceNgn: z.number().int().positive().max(KOBO_MAX).optional(),
  contents: planContentsSchema.optional(),
  intervals: z
    .array(offeredIntervalSchema)
    .min(1, 'Offer the plan at least one cadence')
    .max(OFFERED_INTERVALS.length)
    .refine((v) => new Set(v).size === v.length, 'Each cadence once'),
});

export const PLAN_NAME_MIN = 2;
export const PLAN_NAME_MAX = 100;
export const PLAN_DESCRIPTION_MIN = 10;
export const PLAN_DESCRIPTION_MAX = 1000;
export const PLAN_SLOTS_MAX = 100;

export const planDetailsSchema = z.object({
  name: z.string().trim().min(PLAN_NAME_MIN).max(PLAN_NAME_MAX),
  description: z.string().trim().min(PLAN_DESCRIPTION_MIN).max(PLAN_DESCRIPTION_MAX),
  /** Allowance plans only: a curated plan's slot count is its number of items. */
  slotCount: z.number().int().positive().max(PLAN_SLOTS_MAX),
  image: z.string().url().optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const createPlanSchema = planDetailsSchema
  .extend({ slotCount: planDetailsSchema.shape.slotCount.optional() })
  .merge(planPricingSchema)
  // After the merge: pricing's optional `kind` (for previews) must not undo the default.
  .extend({ kind: planKindSchema.default('ALLOWANCE') })
  .superRefine((plan, ctx) => {
    if (plan.kind === 'CURATED' && !plan.contents) {
      ctx.addIssue({ code: 'custom', path: ['contents'], message: 'Choose what the box holds' });
    }
    if (plan.kind === 'ALLOWANCE' && (plan.boxAllowanceNgn === undefined || plan.slotCount === undefined)) {
      ctx.addIssue({ code: 'custom', path: ['boxAllowanceNgn'], message: 'Set the box allowance and slot count' });
    }
    if (plan.kind === 'BASKET' && plan.boxAllowanceNgn === undefined) {
      ctx.addIssue({ code: 'custom', path: ['boxAllowanceNgn'], message: 'Set the most a basket may hold' });
    }
  });

/** Details only: pricing changes go through POST /subscription-plans/:id/pricing. */
export const updatePlanSchema = planDetailsSchema.partial();

/** Changing a curated box is emailed to its subscribers, so it needs a reason. */
export const updatePlanContentsSchema = z.object({
  contents: planContentsSchema,
  reason: reason('Say why the box is changing'),
});

/** Reprice every basket on a plan at today's catalogue cost and rate. */
export const basketRepriceSchema = z.object({ dryRun: z.boolean().optional() });

export type PlanPricingInput = z.infer<typeof planPricingSchema>;
export type PlanDetailsInput = z.infer<typeof planDetailsSchema>;
export type PlanContentsInput = z.infer<typeof planContentsSchema>;
export type PlanKind = z.infer<typeof planKindSchema>;
export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;

// ─── Catalogue ───────────────────────────────────────────────────────────────

export const CATALOGUE_ITEM_NAME_MAX = 120;
export const CATALOGUE_ITEM_DESCRIPTION_MAX = 500;
/** Sourcing cost cap in kobo (₦1m per unit). */
export const CATALOGUE_ITEM_COST_MAX = 1_000_000_00;
export const CATALOGUE_ITEM_STATES_MAX = 40;

export const createItemSchema = z.object({
  name: z.string().trim().min(2).max(CATALOGUE_ITEM_NAME_MAX),
  description: z.string().trim().max(CATALOGUE_ITEM_DESCRIPTION_MAX).optional(),
  /** Sourcing cost in kobo — always naira (the API sets the currency). */
  price: z.number().int().positive().max(CATALOGUE_ITEM_COST_MAX),
  /** An ItemCategory id; the API copies its name onto the item. */
  categoryId: z.string().min(1),
  stock: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  /** Nigerian states this can be sourced in. Empty = available everywhere. */
  availableStates: z.array(z.string().trim().min(2).max(50)).max(CATALOGUE_ITEM_STATES_MAX).optional(),
});

export const updateItemSchema = createItemSchema.partial();

export const ITEM_CATEGORY_NAME_MAX = 60;
const categoryName = z.string().trim().min(2).max(ITEM_CATEGORY_NAME_MAX);

export const createItemCategorySchema = z.object({
  name: categoryName,
  icon: z.enum(ITEM_CATEGORY_ICONS).optional(),
});

export const updateItemCategorySchema = z
  .object({ name: categoryName, icon: z.enum(ITEM_CATEGORY_ICONS) })
  .partial()
  .refine((v) => v.name !== undefined || v.icon !== undefined, { message: 'Nothing to change' });

/** Every category id, in the new aisle order. */
export const reorderItemCategoriesSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
});

/** A category that still has items can only be deleted by moving them somewhere else. */
export const deleteItemCategorySchema = z.object({
  moveToId: z.string().min(1).optional(),
});

export type CreateItemCategoryInput = z.infer<typeof createItemCategorySchema>;
export type UpdateItemCategoryInput = z.infer<typeof updateItemCategorySchema>;

// ─── Subscriptions, on the subscriber's behalf ───────────────────────────────

/** What an admin may do for a subscriber: exactly what the subscriber could, plus undoing a cancel. */
export const ADMIN_SUBSCRIPTION_ACTIONS = ['SKIP', 'UNSKIP', 'PAUSE', 'RESUME', 'CANCEL', 'UNCANCEL'] as const;
export type AdminSubscriptionAction = (typeof ADMIN_SUBSCRIPTION_ACTIONS)[number];

export const adminSubscriptionActionSchema = z.object({
  action: z.enum(ADMIN_SUBSCRIPTION_ACTIONS),
  reason: reason('Say why — the subscriber is emailed this'),
});

export const standingVendorSchema = z.object({
  vendorId: z.string().cuid().nullable(),
  reason: reason('Say why the standing vendor is changing'),
});

/** A subscriber's box edited by admin: the subscriber's own rules, a reason, and optionally one waiting order. */
export const adminBoxEditSchema = updateSubscriptionItemsSchema.extend({
  reason: reason('Say why the box is being changed'),
  applyToOrderId: z.string().cuid().optional(),
});

// ─── Settings ────────────────────────────────────────────────────────────────

const feePercent = z.number().min(0).max(20);

/** Admin → Settings → Subscription pricing. Every value sets the margin on every subscription. */
export const subscriptionRulesSchema = z.object({
  minFillPercent: z.number().int().min(50).max(100),
  marginTolerancePoints: z.number().min(1).max(50),
  cardFeePercent: z.object({ USD: feePercent, CAD: feePercent, GBP: feePercent }),
  /** Points that take 1 unit of the buyer's currency off. */
  pointsPerCurrencyUnit: z.number().int().min(10).max(10_000).optional(),
  /** Off a year paid at once; out of the platform share. */
  annualDiscountPercent: z.number().min(0).max(30).optional(),
  /** On the undelivered value when an annual plan is cancelled part-way. */
  annualCancellationFeePercent: z.number().min(0).max(25).optional(),
});

const bandFeesSchema = z.object({ HIGH: koboSchema, MEDIUM: koboSchema, LOW: koboSchema });

/**
 * Admin → Settings → Fulfilment: the fee per state band, which state is in
 * which band, the cost-stack defaults and the FX buffer.
 */
export const fulfilmentRulesSchema = z.object({
  bandFeesNgn: bandFeesSchema.superRefine((fees, ctx) => {
    const problem = bandFeeProblem(fees);
    if (problem) ctx.addIssue({ code: 'custom', message: problem });
  }),
  /** Only states in NIGERIAN_STATES; one left out counts as HIGH. */
  stateBands: z.record(z.enum(NIGERIAN_STATES), z.enum(FULFILMENT_BANDS)),
  defaultPackagingNgn: koboSchema,
  defaultPlatformPercent: z.number().min(0).max(PLATFORM_PERCENT_MAX),
  fxBufferPercent: z.number().min(0).max(30),
  defaultSplitPercent: z.number().int().min(0).max(100),
  requireRecipientConfirmation: z.boolean(),
});

export type SubscriptionRulesInput = z.infer<typeof subscriptionRulesSchema>;
export type FulfilmentRulesInput = z.infer<typeof fulfilmentRulesSchema>;

// ─── Orders ──────────────────────────────────────────────────────────────────

/**
 * The admin orders list tabs. The API decides what each holds (every order in
 * exactly one, plus "all"); the dashboard labels and orders them.
 */
export const ORDER_TABS = ['needs-action', 'pending', 'processing', 'shipped', 'delivered', 'closed', 'all'] as const;
export type OrderTab = (typeof ORDER_TABS)[number];
export const ORDER_SORTS = ['newest', 'oldest'] as const;
export type OrderSort = (typeof ORDER_SORTS)[number];

export const adminOrderListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  // 'all' by default so any caller that predates tabs keeps its behaviour.
  tab: z.enum(ORDER_TABS).default('all'),
  q: z.string().trim().max(100).optional(),
  sort: z.enum(ORDER_SORTS).default('newest'),
});
export type AdminOrderListInput = z.infer<typeof adminOrderListSchema>;

/** Stripe refund statuses where money is moving or has moved back. */
export const OPEN_REFUND_STATUSES = ['pending', 'requires_action', 'succeeded'] as const;

/** Refund Policy § 7: a requested refund is issued within this many business days. */
export const REFUND_TARGET_BUSINESS_DAYS = 5;

// ─── Refunds ─────────────────────────────────────────────────────────────────

/** `amount` omitted = refund everything still refundable (smallest unit of the charge currency). */
export const issueRefundSchema = z.object({
  amount: z.number().int().positive().max(100_000_000).optional(),
  reason: z.string().trim().max(500).optional(),
});
export const refundRequestSchema = z.object({
  note: z.string().trim().max(1000).optional(),
});
export type IssueRefundInput = z.infer<typeof issueRefundSchema>;
export type RefundRequestInput = z.infer<typeof refundRequestSchema>;

// ─── Partners (admin) ────────────────────────────────────────────────────────

export const createVendorSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  contactName: z.string().trim().min(2).max(100).optional(),
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  phone: phoneSchema,
  address: z.string().trim().min(5, 'Address is required').max(200),
  state: z.string().trim().min(2, 'State is required').max(100),
  notes: z.string().trim().max(500).optional(),
});
export const updateVendorSchema = createVendorSchema.partial();
export const setVendorActiveSchema = z.object({
  isActive: z.boolean(),
  reason: z.string().trim().min(1).max(500).optional(),
});
export const setVendorStatusSchema = z.object({ status: z.enum(['APPROVED', 'REJECTED']) });
export type CreateVendorInput = z.infer<typeof createVendorSchema>;

// ─── Careers and roadmap (admin) ─────────────────────────────────────────────

export const JOB_EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'REMOTE'] as const;
export const JOB_STATUSES = ['OPEN', 'CLOSED'] as const;
export const APPLICATION_STATUSES = ['NEW', 'REVIEWING', 'INTERVIEW', 'REJECTED', 'HIRED'] as const;
export const jobEmploymentEnum = z.enum(JOB_EMPLOYMENT_TYPES);
export const jobStatusEnum = z.enum(JOB_STATUSES);
export const applicationStatusEnum = z.enum(APPLICATION_STATUSES);

export const createJobSchema = z.object({
  title: z.string().trim().min(2).max(120),
  department: z.string().trim().max(80).optional(),
  location: z.string().trim().max(120).optional(),
  employmentType: jobEmploymentEnum.optional(),
  description: z.string().trim().min(20).max(20000),
  status: jobStatusEnum.optional(),
});
export const updateJobSchema = createJobSchema.partial();
export const updateApplicationStatusSchema = z.object({ status: applicationStatusEnum });
export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;

export const ROADMAP_STATUSES = ['PLANNED', 'IN_PROGRESS', 'LAUNCHED'] as const;
export const roadmapStatusEnum = z.enum(ROADMAP_STATUSES);
export const createRoadmapItemSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().min(10).max(2000),
  category: z.string().max(60).optional(),
  status: roadmapStatusEnum.optional(),
  targetLabel: z.string().max(40).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});
export const updateRoadmapItemSchema = createRoadmapItemSchema.partial();
export type CreateRoadmapItemInput = z.infer<typeof createRoadmapItemSchema>;
export type UpdateRoadmapItemInput = z.infer<typeof updateRoadmapItemSchema>;
