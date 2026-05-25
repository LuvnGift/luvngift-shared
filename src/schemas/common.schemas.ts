import { z } from 'zod';

/**
 * Path parameter validation schemas - used across all API routes
 */

// Single ID parameter validation
export const idParamSchema = z.object({
  id: z.string()
    .trim()
    .cuid('Invalid ID format'),
});

// Slug parameter validation (for occasions, bundles, etc.)
export const slugParamSchema = z.object({
  slug: z.string()
    .min(1, 'Slug cannot be empty')
    .max(100, 'Slug is too long')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug must contain only lowercase letters, numbers, and hyphens',
    ),
});

// Common pagination query parameters
export const paginationSchema = z.object({
  page: z.coerce
    .number()
    .int('Page must be an integer')
    .min(1, 'Page must be at least 1')
    .optional()
    .default(1),
  limit: z.coerce
    .number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .optional()
    .default(10),
});

// Search/filter with pagination
export const searchPaginationSchema = paginationSchema.extend({
  search: z.string()
    .max(100, 'Search term is too long')
    .optional(),
  sort: z.enum(['asc', 'desc']).optional().default('desc'),
});
