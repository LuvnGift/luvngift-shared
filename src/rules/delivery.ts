/**
 * Delivery promises are always a range, never a single day. A bundle's
 * `estimatedDeliveryDays` is the lead time; `deliveryWindowDays` widens it.
 * The site and the app word the same promise the same way from here.
 *
 * `deliveryWindowDays` arrives EMBEDDED in the bundle/occasion payload: never
 * fetch it separately from a page (catalogue routes are prerendered).
 */

/** Relative form for catalogue pages: "7–12 days". */
export function formatDeliveryRange(leadDays: number, windowDays = 0): string {
  if (!Number.isFinite(leadDays) || leadDays <= 0) return 'Delivery time varies';
  const end = leadDays + Math.max(0, windowDays);
  return end > leadDays ? `${leadDays}–${end} days` : `${leadDays} days`;
}

/** Absolute form for a placed order: "12–17 August". */
export function formatDeliveryDates(from: string | Date, windowDays: number): string {
  const start = new Date(from);
  if (Number.isNaN(start.getTime())) return '';
  const end = new Date(start);
  end.setDate(end.getDate() + Math.max(0, windowDays));

  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  const endLabel = end.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
  const startLabel = start.toLocaleDateString('en-GB', sameMonth ? { day: 'numeric' } : { day: 'numeric', month: 'long' });
  return `${startLabel}–${endLabel}`;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export interface DeliveryDueInput {
  /** When the order was paid or created (the promise runs from here). */
  placedAt: string | Date;
  /** The buyer's chosen date, when there is one. It replaces the window. */
  preferredDeliveryDate?: string | Date | null;
  leadDays: number;
  windowDays: number;
}

/**
 * The last day a delivery was promised for: the buyer's chosen date, else the
 * end of the window (placed + lead + window). End of that day, so an order
 * due "today" is not overdue until tomorrow.
 */
export function deliveryDueBy(input: DeliveryDueInput): Date | null {
  const chosen = input.preferredDeliveryDate ? new Date(input.preferredDeliveryDate) : null;
  const base = chosen && !Number.isNaN(chosen.getTime()) ? chosen : null;
  let due: Date;
  if (base) {
    due = new Date(base);
  } else {
    const placed = new Date(input.placedAt);
    if (Number.isNaN(placed.getTime())) return null;
    const days = Math.max(0, input.leadDays) + Math.max(0, input.windowDays);
    due = new Date(placed.getTime() + days * DAY_MS);
  }
  due.setUTCHours(23, 59, 59, 999);
  return due;
}

export function isDeliveryOverdue(dueBy: Date | null, now: Date = new Date()): boolean {
  return dueBy !== null && now.getTime() > dueBy.getTime();
}
