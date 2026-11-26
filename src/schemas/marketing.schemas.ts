import { z } from 'zod';
import {
  MARKETING_CONSENT_SOURCES,
  MARKETING_HEADLINE_MAX,
  MARKETING_INTRO_MAX,
  MARKETING_ISSUE_MAX_BUNDLES,
  isMarketingWeekOf,
} from '../rules/marketing';

/** PUT /marketing/preference: the customer's own choice. */
export const marketingPreferenceSchema = z.object({
  optIn: z.boolean(),
  source: z.enum(MARKETING_CONSENT_SOURCES),
});

/** An empty or whitespace-only text is no text. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : undefined));

/** PUT /admin/marketing/issues/:weekOf: the week's featured bundles and copy. */
export const adminMarketingIssueSchema = z.object({
  bundleIds: z
    .array(z.string().min(1))
    .min(1, 'Pick at least one bundle')
    .max(MARKETING_ISSUE_MAX_BUNDLES, `Pick at most ${MARKETING_ISSUE_MAX_BUNDLES} bundles`)
    .refine((ids) => new Set(ids).size === ids.length, 'A bundle is picked twice'),
  headline: optionalText(MARKETING_HEADLINE_MAX),
  intro: optionalText(MARKETING_INTRO_MAX),
});

export const marketingWeekOfParamSchema = z.object({
  weekOf: z.string().refine(isMarketingWeekOf, 'weekOf must be a Monday, YYYY-MM-DD'),
});

/** GET /admin/metrics/funnel */
export const funnelQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).optional().default(30),
});

export type MarketingPreferenceInput = z.infer<typeof marketingPreferenceSchema>;
export type AdminMarketingIssueInput = z.infer<typeof adminMarketingIssueSchema>;
