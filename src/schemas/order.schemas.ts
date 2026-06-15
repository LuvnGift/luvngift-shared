import { z } from 'zod';

// ── Reusable primitives ──────────────────────────────────────────────────────

/** Letters (incl. accented), spaces, hyphens, apostrophes only */
const nameField = (label: string, min = 2, max = 100) =>
  z.string()
    .trim()
    .min(min, `${label} is required`)
    .max(max, `${label} must be at most ${max} characters`)
    .regex(
      /^[a-zA-ZÀ-ÖØ-öø-ÿ'\-\s]+$/,
      `${label} can only contain letters, hyphens, and apostrophes`,
    );

/** Letters, digits, spaces, hyphens, periods — for place names */
const placeField = (label: string, min = 2, max = 100) =>
  z.string()
    .trim()
    .min(min, `${label} is required`)
    .max(max, `${label} must be at most ${max} characters`)
    .regex(
      /^[a-zA-ZÀ-ÖØ-öø-ÿ0-9'\-\s.]+$/,
      `${label} contains invalid characters`,
    );

/** E.164-compatible phone: optional +, then digits/spaces/dashes/parens */
const phoneField = z
  .string()
  .trim()
  .regex(/^\+?[\d\s\-(). ]{7,20}$/, 'Enter a valid phone number (e.g. +234 801 234 5678)');

/** Street addresses: letters, digits, spaces, common punctuation */
const streetField = z
  .string()
  .trim()
  .min(5, 'Street address is required')
  .max(200)
  .regex(/^[a-zA-ZÀ-ÖØ-öø-ÿ0-9\s,.'#\-/]+$/, 'Street address contains invalid characters');

/** Postal codes: alphanumeric with optional spaces and hyphens */
const postalField = z
  .string()
  .trim()
  .max(20)
  .regex(/^[a-zA-Z0-9\s\-]+$/, 'Enter a valid postal / ZIP code')
  .optional();

// ── Schemas ──────────────────────────────────────────────────────────────────

const deliveryAddressSchema = z.object({
  street: streetField,
  city: placeField('City', 2, 100),
  state: placeField('State', 2, 50),
  country: z.string().trim().default('Nigeria'),
  postalCode: postalField,
});

export const createOrderSchema = z.object({
  bundleId: z.string().cuid().optional(),
  items: z.array(z.object({
    customItemId: z.string().cuid(),
    quantity: z.number().int().positive(),
  })).optional(),
  recipientName: nameField('Recipient name'),
  recipientPhone: phoneField,
  deliveryAddress: deliveryAddressSchema,
  personalMessage: z.string().trim().max(500, 'Message must be at most 500 characters').optional(),
  specialInstructions: z.string().trim().max(500, 'Instructions must be at most 500 characters').optional(),
  preferredDeliveryDate: z.string().datetime().optional(),
  currency: z.enum(['CAD', 'USD', 'GBP']).optional(),
}).refine(data => data.bundleId || (data.items && data.items.length > 0), {
  message: 'Order must include either a bundle or at least one custom item',
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
  adminNotes: z.string().trim().max(1000).optional(),
});

export const assignVendorSchema = z.object({
  vendorId: z.string().cuid(),
});

export const customOrderSchema = z.object({
  occasionType: z
    .string()
    .trim()
    .min(2, 'Occasion type is required')
    .max(100)
    .regex(/^[a-zA-ZÀ-ÖØ-öø-ÿ0-9'\-\s]+$/, 'Occasion type contains invalid characters'),
  giftType: z.enum(['EXPERIENCE', 'PHYSICAL']),
  preferredDate: z.string().datetime().optional(),
  estimatedBudget: z.number().positive('Budget must be a positive number').optional(),
  currency: z.enum(['CAD', 'USD', 'GBP']).optional(),
  description: z
    .string()
    .trim()
    .min(10, 'Please provide at least 10 characters of description')
    .max(1000, 'Description must be at most 1000 characters'),
  recipientName: nameField('Recipient name'),
  recipientPhone: phoneField,
  deliveryStreet: streetField.optional(),
  deliveryCity: placeField('Delivery city', 2, 100),
  deliveryState: placeField('Delivery state', 2, 50),
  personalMessage: z.string().trim().max(500, 'Message must be at most 500 characters').optional(),
  specialInstructions: z.string().trim().max(500, 'Instructions must be at most 500 characters').optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type CustomOrderInput = z.infer<typeof customOrderSchema>;