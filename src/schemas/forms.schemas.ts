import { z } from 'zod';
import { phoneSchema } from './order.schemas';

/**
 * Public and customer forms: the API validates the request with these and the
 * web and mobile forms validate with the same schemas, so the two can never
 * disagree about what is acceptable.
 */

// ─── Contact ─────────────────────────────────────────────────────────────────

export const contactSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(50),
  lastName: z.string().trim().min(1, 'Last name is required').max(50),
  email: z.string().trim().email('Enter a valid email address'),
  comment: z.string().trim().min(10, 'Message must be at least 10 characters').max(2000),
});
export type ContactInput = z.infer<typeof contactSchema>;

// ─── Support chat ────────────────────────────────────────────────────────────

export const CHAT_MESSAGE_MAX = 5000;

export const chatMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Message cannot be empty')
    .max(CHAT_MESSAGE_MAX, `Message is too long (max ${CHAT_MESSAGE_MAX} characters)`)
    .refine((val) => !val.includes('\0'), 'Message contains invalid characters'),
});

/**
 * Asking for a person. Contact details are optional HERE and required by the
 * API for a guest only: a signed-in user already has a reachable email.
 */
export const escalateChatSchema = z.object({
  reason: z.string().min(1, 'Reason cannot be empty').max(500, 'Reason is too long').optional(),
  name: z.string().trim().min(1, 'Please enter your name').max(100).optional(),
  email: z.string().trim().email('Enter a valid email address').max(254).optional(),
});

// ─── Partner (vendor / agent) application ────────────────────────────────────

export const FULFILMENT_ROLES = ['SOURCING', 'AGENT', 'DELIVERY'] as const;
export type FulfilmentRole = (typeof FULFILMENT_ROLES)[number];
export const fulfilmentRoleSchema = z.enum(FULFILMENT_ROLES);

export const PARTNER_BUSINESS_TYPES = ['RETAIL', 'DELIVERY', 'LOGISTICS', 'AGENT'] as const;
/** How a partner is paid: legacy revenue share, or stated naira per role. */
export const PARTNER_PAY_TERMS = ['REVENUE_SHARE', 'FIXED_NAIRA'] as const;
export type PartnerPayTerms = (typeof PARTNER_PAY_TERMS)[number];
/** When a fixed-naira partner is paid (payout-rules in the API). */
export const PAYOUT_MODES = ['ADVANCE', 'REIMBURSE', 'SPLIT'] as const;
export type PayoutMode = (typeof PAYOUT_MODES)[number];
/** The checks an admin records before approving a partner. */
export const VETTING_KINDS = [
  'ID_VERIFIED',
  'GUARANTOR_CONFIRMED',
  'REFERENCES_CHECKED',
  'ADDRESS_VERIFIED',
  'INTERVIEWED',
  'TRAINED',
] as const;
export type VettingKind = (typeof VETTING_KINDS)[number];
export const PARTNER_ID_TYPES = ['NIN', 'PASSPORT', 'DRIVERS_LICENCE', 'VOTERS_CARD'] as const;
/** An AGENT gives this many references. */
export const REQUIRED_REFERENCES = 2;
/** An ID number as printed on the document. Only the last four characters are stored. */
export const PARTNER_ID_NUMBER_RE = /^[A-Za-z0-9-]{6,20}$/;
/** The ID photo or scan an AGENT uploads. */
export const PARTNER_ID_DOCUMENT_MAX_BYTES = 5 * 1024 * 1024;
export const PARTNER_ID_DOCUMENT_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'] as const;

export const coverageEntrySchema = z.object({
  state: z.string().trim().min(2).max(60),
  role: fulfilmentRoleSchema,
});


export const partnerPersonSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(100),
  phone: phoneSchema,
  relationship: z.string().trim().min(2, 'Say how you know them').max(60),
});

/**
 * Public partner application: business and contact details, the accepted
 * Vendor Agreement, and for an AGENT the vetting details (ID, guarantor,
 * references, transport, the states and roles they would cover).
 */
export const applyPartnerSchema = z
  .object({
    name: z.string().trim().min(2, 'Business name is required').max(100),
    contactName: z.string().trim().min(2, 'Contact name is required').max(100),
    email: z.string().trim().email('Invalid email address').toLowerCase(),
    phone: phoneSchema,
    address: z.string().trim().min(5, 'Business address is required').max(200),
    state: z.string().trim().min(2, 'State is required').max(100),
    businessType: z.enum(PARTNER_BUSINESS_TYPES),
    notes: z.string().trim().max(1000).optional(),
    idType: z.enum(PARTNER_ID_TYPES).optional(),
    /** Only the last four characters are stored. */
    idNumber: z.string().trim().regex(PARTNER_ID_NUMBER_RE, 'Enter the ID number as printed').optional(),
    guarantor: partnerPersonSchema.optional(),
    references: z.array(partnerPersonSchema).max(REQUIRED_REFERENCES).optional(),
    transport: z.string().trim().min(2).max(100).optional(),
    // 37 states × 3 roles fits.
    coverage: z.array(coverageEntrySchema).max(120).optional(),
    agreedToTerms: z.literal(true, { errorMap: () => ({ message: 'You must accept the Vendor Agreement' }) }),
    // Honeypot — real users leave this empty.
    companyWebsite: z.string().max(200).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.businessType !== 'AGENT') return;
    const need = (ok: unknown, path: string, message: string) => {
      if (!ok) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });
    };
    need(v.idType && v.idNumber, 'idNumber', 'Your ID type and number are required');
    need(v.guarantor, 'guarantor', 'A guarantor is required');
    need(v.references?.length === REQUIRED_REFERENCES, 'references', `${REQUIRED_REFERENCES} references are required`);
    need(v.transport, 'transport', 'Tell us how you get around');
    need(v.coverage?.length, 'coverage', 'Choose at least one state and role you can cover');
  });
export type ApplyPartnerInput = z.infer<typeof applyPartnerSchema>;

// ─── Careers and roadmap ─────────────────────────────────────────────────────

const NAME_RE = /^[a-zA-ZÀ-ÖØ-öø-ÿ'\-\s]+$/;

/** Text fields of a job application; the CV arrives as a file. */
export const jobApplicationSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(50).regex(NAME_RE, 'Letters only'),
  lastName: z.string().trim().min(1, 'Last name is required').max(50).regex(NAME_RE, 'Letters only'),
  email: z.string().trim().email('Enter a valid email address'),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  coverLetter: z.string().trim().max(5000).optional().or(z.literal('')),
  // Honeypot — hidden; must stay empty.
  website: z.string().max(0).optional(),
});
/** The CV upload: the API's upload middleware and the form enforce the same limits. */
export const RESUME_MAX_BYTES = 5 * 1024 * 1024;
export const RESUME_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export type JobApplicationInput = z.infer<typeof jobApplicationSchema>;

export const subscribeRoadmapSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
});

// ─── Account deletion ────────────────────────────────────────────────────────

/**
 * Body for `DELETE /api/v1/users/me`. `password` and `totpCode` are optional
 * here because which is required depends on the account (an OAuth-only
 * account has no password; only some have 2FA). The API enforces that.
 */
export const deleteAccountSchema = z.object({
  confirm: z.literal('DELETE', { errorMap: () => ({ message: 'Type DELETE to confirm' }) }),
  password: z.string().min(1, 'Password is required').max(200).optional(),
  totpCode: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code from your authenticator app').optional(),
});
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
