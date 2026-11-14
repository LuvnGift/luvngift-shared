/**
 * A partner's email and phone are where their bank-details links and payout
 * notices go. Changing them is therefore a route to redirecting money (change
 * the contact, then have a link sent there), so a change needs a fresh 2FA
 * code, the OLD contacts are told, and no bank-details link can be sent for
 * CONTACT_CHANGE_HOLD_HOURS afterwards, giving the real partner time to object.
 */

export const CONTACT_CHANGE_HOLD_HOURS = 48;

export type PartnerContactField = 'email' | 'phone';

const normEmail = (v: string) => v.trim().toLowerCase();

/**
 * Phones are stored as typed, so compare the last 10 digits: 0801 234 5678
 * and +234 801 234 5678 are the same number.
 */
const normPhone = (v: string) => v.replace(/\D/g, '').slice(-10);

/**
 * Which contact fields an edit actually changes. A field left out of the edit,
 * or sent unchanged (the admin form always sends both), is not a change.
 */
export function partnerContactChanges(
  current: { email: string; phone: string },
  next: { email?: string; phone?: string },
): PartnerContactField[] {
  const changed: PartnerContactField[] = [];
  if (next.email !== undefined && normEmail(next.email) !== normEmail(current.email)) changed.push('email');
  if (next.phone !== undefined && normPhone(next.phone) !== normPhone(current.phone)) changed.push('phone');
  return changed;
}

/** When a bank-details link may be sent again after a contact change, or null if it may now. */
export function bankLinkHoldUntil(contactChangedAt: Date | string | null, now: Date = new Date()): Date | null {
  if (!contactChangedAt) return null;
  const until = new Date(new Date(contactChangedAt).getTime() + CONTACT_CHANGE_HOLD_HOURS * 60 * 60 * 1000);
  return until.getTime() > now.getTime() ? until : null;
}
