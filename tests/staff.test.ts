import { describe, expect, it } from 'vitest';
import {
  STAFF_PERMISSIONS,
  STAFF_PRESETS,
  StaffPermission,
  UserRole,
  canUseOps,
  createOpsNoteSchema,
  deliveryDueBy,
  hasStaffPermission,
  isDeliveryOverdue,
  isStaffRole,
  normaliseStaffPermissions,
  opsNoteListSchema,
  sameStaffPermissions,
  staffNeedsTwoFactor,
  updateUserAccessSchema,
} from '../src';

describe('staff roles', () => {
  it('admin and staff are staff; customers and nobody are not', () => {
    expect(isStaffRole(UserRole.ADMIN)).toBe(true);
    expect(isStaffRole(UserRole.STAFF)).toBe(true);
    expect(isStaffRole(UserRole.CUSTOMER)).toBe(false);
    expect(isStaffRole(undefined)).toBe(false);
    expect(canUseOps('STAFF')).toBe(true);
    expect(canUseOps('CUSTOMER')).toBe(false);
  });

  it('admin holds every permission, staff only what was granted, customers none', () => {
    const staff = { role: UserRole.STAFF, staffPermissions: [StaffPermission.OPS_VIEW] };
    expect(hasStaffPermission(staff, StaffPermission.OPS_VIEW)).toBe(true);
    expect(hasStaffPermission(staff, StaffPermission.PARTNER_VETTING)).toBe(false);
    expect(hasStaffPermission({ role: UserRole.ADMIN, staffPermissions: [] }, StaffPermission.PARTNER_VETTING)).toBe(true);
    // Leftover permissions on a customer row grant nothing.
    const customer = { role: UserRole.CUSTOMER, staffPermissions: STAFF_PERMISSIONS };
    expect(hasStaffPermission(customer, StaffPermission.OPS_VIEW)).toBe(false);
    expect(hasStaffPermission(null, StaffPermission.OPS_VIEW)).toBe(false);
  });

  it('requires 2FA for staff only (admin 2FA stays warn-only)', () => {
    expect(staffNeedsTwoFactor({ role: UserRole.STAFF, twoFactorEnabled: false })).toBe(true);
    expect(staffNeedsTwoFactor({ role: UserRole.STAFF, twoFactorEnabled: true })).toBe(false);
    expect(staffNeedsTwoFactor({ role: UserRole.ADMIN, twoFactorEnabled: false })).toBe(false);
  });

  it('compares permission sets ignoring order and duplicates', () => {
    const a = [StaffPermission.PARTNER_RATING, StaffPermission.OPS_VIEW, StaffPermission.OPS_VIEW];
    expect(normaliseStaffPermissions(a)).toEqual([StaffPermission.OPS_VIEW, StaffPermission.PARTNER_RATING]);
    expect(sameStaffPermissions(a, [StaffPermission.OPS_VIEW, StaffPermission.PARTNER_RATING])).toBe(true);
    expect(sameStaffPermissions(a, [StaffPermission.OPS_VIEW])).toBe(false);
  });

  it('ships a Country Brand Manager preset with every phase-1 permission', () => {
    const preset = STAFF_PRESETS.find((p) => p.key === 'COUNTRY_BRAND_MANAGER');
    expect(preset?.title).toBe('Country Brand Manager');
    expect([...preset!.permissions].sort()).toEqual([...STAFF_PERMISSIONS].sort());
  });
});

describe('access schema', () => {
  it('staff needs a title and at least one permission', () => {
    expect(updateUserAccessSchema.safeParse({ role: 'STAFF', permissions: [], title: 'Brand' }).success).toBe(false);
    expect(updateUserAccessSchema.safeParse({ role: 'STAFF', permissions: ['OPS_VIEW'] }).success).toBe(false);
    expect(
      updateUserAccessSchema.safeParse({ role: 'STAFF', permissions: ['OPS_VIEW'], title: 'Country Brand Manager' }).success,
    ).toBe(true);
  });

  it('rejects unknown permissions and roles', () => {
    expect(updateUserAccessSchema.safeParse({ role: 'STAFF', permissions: ['REFUND'], title: 'x y' }).success).toBe(false);
    expect(updateUserAccessSchema.safeParse({ role: 'OWNER' }).success).toBe(false);
  });

  it('strips permissions sent with a customer or admin role', () => {
    const parsed = updateUserAccessSchema.parse({ role: 'ADMIN', permissions: ['OPS_VIEW'] });
    expect(parsed).toEqual({ role: 'ADMIN' });
  });
});

describe('ops notes', () => {
  it('defaults to a plain note and trims the body', () => {
    const parsed = createOpsNoteSchema.parse({ targetType: 'ORDER', targetId: 'ckz0000000000000000000000', body: '  Called the partner  ' });
    expect(parsed.isFlag).toBe(false);
    expect(parsed.body).toBe('Called the partner');
  });

  it('parses query booleans', () => {
    expect(opsNoteListSchema.parse({ flagsOnly: 'true' }).flagsOnly).toBe(true);
    expect(opsNoteListSchema.parse({ flagsOnly: 'false' }).flagsOnly).toBe(false);
    expect(opsNoteListSchema.safeParse({ flagsOnly: 'yes' }).success).toBe(false);
  });
});

describe('delivery due date', () => {
  const placedAt = '2026-11-01T10:00:00.000Z';

  it('runs lead + window days from placement, to the end of that day', () => {
    const due = deliveryDueBy({ placedAt, leadDays: 7, windowDays: 5 });
    expect(due?.toISOString()).toBe('2026-11-13T23:59:59.999Z');
  });

  it('uses the buyer’s chosen date instead of the window', () => {
    const due = deliveryDueBy({ placedAt, preferredDeliveryDate: '2026-11-05T00:00:00.000Z', leadDays: 7, windowDays: 5 });
    expect(due?.toISOString()).toBe('2026-11-05T23:59:59.999Z');
  });

  it('is not overdue on the due day itself, only after it', () => {
    const due = deliveryDueBy({ placedAt, leadDays: 0, windowDays: 0 });
    expect(isDeliveryOverdue(due, new Date('2026-11-01T23:00:00.000Z'))).toBe(false);
    expect(isDeliveryOverdue(due, new Date('2026-11-02T00:00:01.000Z'))).toBe(true);
    expect(isDeliveryOverdue(null)).toBe(false);
  });

  it('gives null for an unreadable date', () => {
    expect(deliveryDueBy({ placedAt: 'not a date', leadDays: 1, windowDays: 1 })).toBeNull();
  });
});
