import { z } from 'zod';

export const faqSchema = z.object({
  question: z.string().trim().min(3, 'Question is too short').max(300),
  answer: z.string().trim().min(3, 'Answer is too short').max(1500),
});

export const createBundleSchema = z.object({
  occasionId: z.string().min(1, 'Occasion is required'),
  name: z
    .string()
    .trim()
    .min(3, 'Bundle name must be at least 3 characters')
    .max(100, 'Bundle name must be at most 100 characters'),
  description: z
    .string()
    .trim()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be at most 2000 characters'),
  price: z.number().int().positive('Price must be a positive integer (in smallest currency unit)'),
  currency: z.enum(['CAD', 'USD', 'GBP']),
  estimatedDeliveryDays: z
    .number()
    .int()
    .positive()
    .max(30, 'Estimated delivery cannot exceed 30 days'),
  images: z.array(z.string().url('Each image must be a valid URL')).min(1).max(10),
  items: z.array(z.object({
    name: z
      .string()
      .trim()
      .min(2, 'Item name must be at least 2 characters')
      .max(100),
    description: z.string().trim().max(500).optional(),
    quantity: z.number().int().positive('Quantity must be a positive integer'),
  })).min(1, 'At least one item is required'),
  // SEO content (optional) — rich copy rendered on the public bundle page.
  seoBody: z.string().trim().max(5000).optional(),
  faqs: z.array(faqSchema).max(20).optional(),
});

export const updateBundleSchema = createBundleSchema.partial();

export const createOccasionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Occasion name must be at least 2 characters')
    .max(100)
    .regex(
      /^[a-zA-ZÀ-ÖØ-öø-ÿ0-9'\-\s&]+$/,
      'Occasion name contains invalid characters',
    ),
  description: z
    .string()
    .trim()
    .min(10, 'Description must be at least 10 characters')
    .max(1000),
  image: z.string().url('Must be a valid URL').optional(),
  // SEO content (optional) — rich copy rendered on the public occasion page.
  seoIntro: z.string().trim().max(5000).optional(),
  highlights: z.array(z.string().trim().min(2).max(200)).max(12).optional(),
  faqs: z.array(faqSchema).max(20).optional(),
});

export const updateOccasionSchema = createOccasionSchema.partial();

export const createCustomItemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Item name must be at least 2 characters')
    .max(100),
  description: z.string().trim().max(500).optional(),
  price: z.number().int().positive('Price must be a positive integer (in smallest currency unit)'),
  currency: z.enum(['CAD', 'USD', 'GBP']),
  category: z
    .string()
    .trim()
    .min(2, 'Category is required')
    .max(50)
    .regex(/^[a-zA-Z0-9\s\-&]+$/, 'Category contains invalid characters'),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
});

export const updateCustomItemSchema = createCustomItemSchema.partial();

export type CreateBundleInput = z.infer<typeof createBundleSchema>;
export type CreateOccasionInput = z.infer<typeof createOccasionSchema>;
export type CreateCustomItemInput = z.infer<typeof createCustomItemSchema>;
// Note: the `Faq` type is exported from ./types to avoid a duplicate export.