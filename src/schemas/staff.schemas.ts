import { z } from 'zod';
import { StaffPermission, UserRole } from '../types/common.types';
import { NIGERIAN_STATES } from '../constants';
import { STAFF_TITLE_MAX } from '../rules/staff';
import { paginationSchema } from './common.schemas';
import { OPS_ORDER_VIEWS } from '../types/ops.types';

/**
 * Granting access from `/admin/admin-access`. STAFF must carry at least one
 * permission and a title; CUSTOMER and ADMIN carry neither (any sent are
 * stripped, and the API clears the stored ones).
 */
export const updateUserAccessSchema = z.discriminatedUnion('role', [
  z.object({ role: z.literal(UserRole.CUSTOMER) }),
  z.object({ role: z.literal(UserRole.ADMIN) }),
  z.object({
    role: z.literal(UserRole.STAFF),
    permissions: z
      .array(z.nativeEnum(StaffPermission))
      .min(1, 'Choose at least one permission')
      .max(Object.keys(StaffPermission).length),
    title: z.string().trim().min(2, 'Give the role a title').max(STAFF_TITLE_MAX),
  }),
]);
export type UpdateUserAccessInput = z.infer<typeof updateUserAccessSchema>;

export const OPS_NOTE_TARGETS = ['ORDER', 'PARTNER'] as const;
export type OpsNoteTarget = (typeof OPS_NOTE_TARGETS)[number];

export const OPS_NOTE_MAX = 2000;
export const OPS_FLAG_RESOLUTION_MIN = 3;

export const createOpsNoteSchema = z.object({
  targetType: z.enum(OPS_NOTE_TARGETS),
  targetId: z.string().cuid('Invalid ID format'),
  body: z.string().trim().min(3, 'Write at least a few words').max(OPS_NOTE_MAX),
  /** A flag asks head office to act (and emails them); a plain note is a record. */
  isFlag: z.boolean().optional().default(false),
});
export type CreateOpsNoteInput = z.infer<typeof createOpsNoteSchema>;

const queryBool = z
  .enum(['true', 'false'])
  .transform((v) => v === 'true')
  .optional();

export const opsNoteListSchema = paginationSchema.extend({
  targetType: z.enum(OPS_NOTE_TARGETS).optional(),
  targetId: z.string().cuid('Invalid ID format').optional(),
  flagsOnly: queryBool,
  status: z.enum(['OPEN', 'RESOLVED']).optional(),
});
export type OpsNoteListQuery = z.infer<typeof opsNoteListSchema>;

export const resolveOpsFlagSchema = z.object({
  resolution: z.string().trim().min(OPS_FLAG_RESOLUTION_MIN, 'Say what was done').max(1000),
});

export const opsPartnerListSchema = paginationSchema.extend({
  search: z.string().trim().max(100).optional(),
  state: z.enum(NIGERIAN_STATES).optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
});
export type OpsPartnerListQuery = z.infer<typeof opsPartnerListSchema>;

export const opsOrderListSchema = paginationSchema.extend({
  view: z.enum(OPS_ORDER_VIEWS).optional().default('open'),
  state: z.enum(NIGERIAN_STATES).optional(),
  partnerId: z.string().cuid('Invalid ID format').optional(),
  /** An order reference as shown everywhere (`#AB12CD34`); the leading # is optional. */
  reference: z
    .string()
    .trim()
    .regex(/^#?[A-Za-z0-9]{4,8}$/, 'Enter an order reference like #AB12CD34')
    .transform((v) => v.replace(/^#/, ''))
    .optional(),
});
export type OpsOrderListQueryInput = z.infer<typeof opsOrderListSchema>;
