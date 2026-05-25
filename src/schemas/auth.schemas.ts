import { z } from 'zod';

// ── Reusable primitives ──────────────────────────────────────────────────────

/** Letters (incl. accented), spaces, hyphens, apostrophes only. Trims whitespace. */
const nameField = (label: string, min = 1, max = 50) =>
  z.string()
    .trim()
    .min(min, `${label} is required`)
    .max(max, `${label} must be at most ${max} characters`)
    .regex(
      /^[a-zA-ZÀ-ÖØ-öø-ÿ'\-\s]+$/,
      `${label} can only contain letters, hyphens, and apostrophes`,
    );

/** E.164-compatible phone: must start with + and country code, followed by digits only.
 *  Examples: +1 555 000 0000, +234 801 234 5678, +44 20 7946 0958
 *  This validates phone format before backend validation with libphonenumber-js
 */
const phoneField = z
  .string()
  .trim()
  .refine(
    (val) => {
      // Must start with +
      if (!val.startsWith('+')) return false;
      // Remove + and all non-digit characters
      const digitsOnly = val.slice(1).replace(/\D/g, '');
      // Must have between 10 and 15 digits (E.164 standard)
      if (digitsOnly.length < 10 || digitsOnly.length > 15) return false;
      // Cannot have invalid character combinations (e.g., "----" or "()" with no digits)
      const cleaned = val.replace(/[\s\-().]/g, '');
      const hasInvalidChars = cleaned.match(/[^+\d]/);
      return !hasInvalidChars;
    },
    'Enter a valid international phone number (e.g., +1 555 000 0000 or +234 801 234 5678)',
  );

/** Strong password: 8–100 chars, at least one uppercase, one lowercase, one digit */
const passwordField = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password must be at most 100 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/\d/, 'Password must contain at least one number');

/** YYYY-MM-DD string that is a valid past date */
const dobField = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use format YYYY-MM-DD')
  .refine((val) => {
    const d = new Date(val);
    return !isNaN(d.getTime()) && d < new Date();
  }, 'Date of birth must be a valid past date')
  .optional();

// ── Schemas ──────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  firstName: nameField('First name'),
  lastName: nameField('Last name'),
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(
      /^[a-zA-Z][a-zA-Z0-9_]*$/,
      'Username must start with a letter and can only contain letters, numbers, and underscores',
    ),
  email: z.string().trim().email('Enter a valid email address'),
  password: passwordField,
  phone: phoneField.optional(),
  dateOfBirth: dobField,
});

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordField,
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

export const verify2FASchema = z.object({
  token: z.string().length(6, 'Token must be 6 digits').regex(/^\d+$/, 'Token must be 6 digits'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordField,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type Verify2FAInput = z.infer<typeof verify2FASchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
