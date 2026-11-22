import { StaffPermission, UserRole } from '../types/common.types';

/**
 * Staff access: who counts as staff, what a permission set allows, and the
 * presets admin grants from. The API enforces these; the web uses the same
 * functions to decide what to show.
 *
 * The future partner portal gives PARTNERS their own kind of login scoped to
 * one partner. They are never STAFF, so no staff permission can reach them.
 */

export const STAFF_PERMISSIONS = Object.values(StaffPermission) as StaffPermission[];

export const STAFF_PERMISSION_LABELS: Record<StaffPermission, string> = {
  [StaffPermission.OPS_VIEW]: 'See the order queue, partners and coverage',
  [StaffPermission.OPS_NOTES]: 'Write notes and raise flags to head office',
  [StaffPermission.PARTNER_VETTING]: 'Record partner vetting checks',
  [StaffPermission.PARTNER_RATING]: 'Rate partners on delivered orders',
  [StaffPermission.RECIPIENT_CONFIRM]: 'Confirm a delivery on the recipient’s word',
  [StaffPermission.VENDOR_LINK_RESEND]: 'Re-send a partner’s order link',
};

export interface StaffPreset {
  key: string;
  title: string;
  permissions: readonly StaffPermission[];
}

/** Ready-made permission sets. A preset is a starting point; admin can untick any switch. */
export const STAFF_PRESETS: readonly StaffPreset[] = [
  {
    key: 'COUNTRY_BRAND_MANAGER',
    title: 'Country Brand Manager',
    permissions: STAFF_PERMISSIONS,
  },
];

export const STAFF_TITLE_MAX = 80;

/** Anyone who works for Luvngift rather than buys from it. Neither kind can shop. */
export function isStaffRole(role: UserRole | string | null | undefined): boolean {
  return role === UserRole.ADMIN || role === UserRole.STAFF;
}

/** Who may open the ops dashboard at all (each endpoint still checks its permission). */
export function canUseOps(role: UserRole | string | null | undefined): boolean {
  return isStaffRole(role);
}

export interface StaffAccess {
  role: UserRole | string;
  staffPermissions?: readonly (StaffPermission | string)[] | null;
}

/** ADMIN holds every permission; STAFF only those granted; everyone else none. */
export function hasStaffPermission(user: StaffAccess | null | undefined, permission: StaffPermission): boolean {
  if (!user) return false;
  if (user.role === UserRole.ADMIN) return true;
  if (user.role !== UserRole.STAFF) return false;
  return (user.staffPermissions ?? []).includes(permission);
}

/** A STAFF account must have 2FA on before ops will answer. Admin 2FA stays warn-only. */
export function staffNeedsTwoFactor(user: { role: UserRole | string; twoFactorEnabled: boolean }): boolean {
  return user.role === UserRole.STAFF && !user.twoFactorEnabled;
}

/** The permissions in their canonical order, without duplicates, so two sets compare equal. */
export function normaliseStaffPermissions(perms: readonly (StaffPermission | string)[]): StaffPermission[] {
  const set = new Set(perms);
  return STAFF_PERMISSIONS.filter((p) => set.has(p));
}

export function sameStaffPermissions(
  a: readonly (StaffPermission | string)[],
  b: readonly (StaffPermission | string)[],
): boolean {
  return normaliseStaffPermissions(a).join() === normaliseStaffPermissions(b).join();
}
