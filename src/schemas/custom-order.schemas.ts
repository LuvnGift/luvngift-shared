import { z } from 'zod';

/**
 * The custom gift request conversation. The API validates with these and the
 * web and mobile forms use the same schemas and limits, so a value a form
 * accepts is never an opaque 400.
 */

export const MESSAGE_MAX = 2000;
export const SCOPE_MAX = 4000;
/** "Please change it" alone is not actionable. */
export const CHANGE_REQUEST_MIN = 3;
export const SCOPE_MIN = 10;
/** The most one quote may be, in the smallest unit of the order's currency. */
export const QUOTE_SUBTOTAL_MAX = 1_000_000_00;

export const orderMessageSchema = z.object({
  body: z.string().trim().min(1, 'Write a message first').max(MESSAGE_MAX),
});

export const requestChangesSchema = z.object({
  comment: z.string().trim().min(CHANGE_REQUEST_MIN, 'Tell us what you would like changed').max(MESSAGE_MAX),
});

export const quoteRoundParamsSchema = z.object({
  id: z.string().cuid(),
  // Arrives as a string from the path.
  round: z.coerce.number().int().min(1).max(1000),
});

export const respondToQuoteSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('ACCEPT') }),
  z.object({
    action: z.literal('REQUEST_CHANGES'),
    // Required: the next quote is only as good as this text.
    comment: requestChangesSchema.shape.comment,
  }),
  z.object({
    action: z.literal('DECLINE'),
    comment: z.string().trim().max(MESSAGE_MAX).optional(),
  }),
]);

/** Admin sends a quote. */
export const sendQuoteSchema = z.object({
  /** Smallest currency unit, in the ORDER's currency (the buyer's). */
  subtotal: z.number().int().min(1).max(QUOTE_SUBTOTAL_MAX),
  scope: z
    .string()
    .trim()
    .min(SCOPE_MIN, 'Describe what will be delivered — the vendor works from this')
    .max(SCOPE_MAX),
  note: z.string().trim().max(MESSAGE_MAX).optional(),
  isFinal: z.boolean().default(false),
});

export type RespondToQuoteInput = z.infer<typeof respondToQuoteSchema>;
export type SendQuoteInput = z.infer<typeof sendQuoteSchema>;
