import { z } from 'zod';

/**
 * Admin request bodies for paying fulfilment partners (Admin → Payouts and the
 * partner profile's Bank details panel). Money moves outside the app, by bank
 * transfer; these record it.
 *
 * Every action that moves or redirects money carries a fresh 2FA code
 * (`totpCode`): the API refuses it from an admin without 2FA, so a stolen
 * session alone cannot pay anyone or change where money goes.
 */

/** A 6-digit authenticator code. */
export const totpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'Enter the 6-digit code from your authenticator app');

/** Nigerian account numbers are 10-digit NUBANs. */
export const NUBAN_LENGTH = 10;

export const BANK_VERIFICATION_METHODS = ['NAME_CHECK', 'TEST_TRANSFER'] as const;
export type BankVerificationMethod = (typeof BANK_VERIFICATION_METHODS)[number];

export const PAYOUT_REFERENCE_MIN = 3;
export const PAYOUT_NOTE_MAX = 500;
export const PAYOUT_REASON_MIN = 5;

/**
 * `PUT /admin/partners/:id/bank-account`. Saving new details supersedes the
 * current account; the new one cannot be paid until it is verified.
 */
export const partnerBankAccountSchema = z.object({
  bankName: z.string().trim().min(2, 'Enter the bank name').max(80),
  accountNumber: z
    .string()
    .trim()
    .regex(new RegExp(`^\\d{${NUBAN_LENGTH}}$`), `Account number must be ${NUBAN_LENGTH} digits`),
  accountName: z.string().trim().min(2, 'Enter the account name exactly as the bank shows it').max(120),
  totpCode: totpCodeSchema,
});
export type PartnerBankAccountInput = z.infer<typeof partnerBankAccountSchema>;

/** `POST /admin/partners/:id/bank-account/verify`: how the account name was confirmed. */
export const verifyPartnerBankAccountSchema = z.object({
  method: z.enum(BANK_VERIFICATION_METHODS),
  note: z
    .string()
    .trim()
    .min(PAYOUT_REASON_MIN, 'Say what you checked (e.g. the name the bank app showed)')
    .max(PAYOUT_NOTE_MAX),
  totpCode: totpCodeSchema,
});
export type VerifyPartnerBankAccountInput = z.infer<typeof verifyPartnerBankAccountSchema>;

/**
 * `POST /admin/partner-payouts/:id/paid`, sent as multipart with an optional
 * `proof` image (the transfer receipt), so every field arrives as a string.
 */
export const payoutPaidSchema = z.object({
  reference: z.string().trim().min(PAYOUT_REFERENCE_MIN, 'Enter the bank transfer reference').max(100),
  note: z.string().trim().max(PAYOUT_NOTE_MAX).optional(),
  totpCode: totpCodeSchema,
});
export type PayoutPaidInput = z.infer<typeof payoutPaidSchema>;

/** `POST /admin/partner-payouts/:id/cancel`. */
export const payoutCancelSchema = z.object({
  reason: z.string().trim().min(PAYOUT_REASON_MIN, 'Say why this payout is cancelled').max(PAYOUT_NOTE_MAX),
  totpCode: totpCodeSchema,
});
export type PayoutCancelInput = z.infer<typeof payoutCancelSchema>;

/** `GET /admin/partners/:id/payout-events` and `GET /admin/partner-payouts/:id/events`. */
export const payoutEventListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
