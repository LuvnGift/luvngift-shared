import { z } from 'zod';
import { paginationSchema } from './common.schemas';
import {
  REVIEW_COMMENT_MAX,
  REVIEW_RATING_MAX,
  REVIEW_RATING_MIN,
  REVIEW_REJECTION_NOTE_MAX,
  REVIEW_REJECTION_REASONS,
  REVIEW_REPLY_MAX,
  REVIEW_STATUSES,
} from '../rules/reviews';

/**
 * Reviews: the customer's form, the public lists and admin moderation. The API
 * validates with these and the web and mobile forms use the same limits.
 */

/** An empty or whitespace-only comment is no comment. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : undefined));

export const createReviewSchema = z.object({
  orderId: z.string().cuid('Invalid order ID'),
  rating: z
    .number()
    .int()
    .min(REVIEW_RATING_MIN, 'Choose a rating')
    .max(REVIEW_RATING_MAX),
  comment: optionalText(REVIEW_COMMENT_MAX),
});

/** GET /reviews: the public list. `featured=true` is the home page strip. */
export const publicReviewListQuerySchema = paginationSchema.extend({
  featured: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
});

export const adminReviewListQuerySchema = paginationSchema.extend({
  status: z.enum(REVIEW_STATUSES).optional().default('PENDING'),
});

/** Rejecting always names one of the permitted grounds. The note is internal. */
export const adminReviewStatusSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('APPROVED') }),
  z.object({
    status: z.literal('REJECTED'),
    reason: z.enum(REVIEW_REJECTION_REASONS),
    note: optionalText(REVIEW_REJECTION_NOTE_MAX),
  }),
]);

/** A public reply under the review. `null` (or blank) removes it. */
export const adminReviewReplySchema = z.object({
  reply: z
    .string()
    .trim()
    .max(REVIEW_REPLY_MAX)
    .nullable()
    .transform((value) => (value ? value : null)),
});

export const adminReviewFeaturedSchema = z.object({
  featured: z.boolean(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type PublicReviewListQuery = z.infer<typeof publicReviewListQuerySchema>;
export type AdminReviewListQuery = z.infer<typeof adminReviewListQuerySchema>;
export type AdminReviewStatusInput = z.infer<typeof adminReviewStatusSchema>;
export type AdminReviewReplyInput = z.infer<typeof adminReviewReplySchema>;
export type AdminReviewFeaturedInput = z.infer<typeof adminReviewFeaturedSchema>;
