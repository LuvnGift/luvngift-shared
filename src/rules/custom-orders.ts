import type { CustomOrderQuote, OrderConversation, QuoteStatus, TimelineEntry } from '../types/custom-order.types';

/** The quote round the customer can act on, if any. */
export function openQuote(conversation: OrderConversation): CustomOrderQuote | null {
  if (conversation.quoteStatus !== 'QUOTED') return null;
  const latest = conversation.quotes[conversation.quotes.length - 1];
  return latest?.response === 'PENDING' ? latest : null;
}

/** The accepted quote, if the price has been agreed. */
export function acceptedQuote(conversation: OrderConversation): CustomOrderQuote | null {
  return conversation.quotes.find((q) => q.response === 'ACCEPTED') ?? null;
}

/** Messages and quote events as one stream, oldest first. */
export function buildTimeline(conversation: OrderConversation): TimelineEntry[] {
  const entries: TimelineEntry[] = conversation.messages.map((message) => ({
    kind: 'message',
    at: message.createdAt,
    message,
  }));
  for (const quote of conversation.quotes) {
    entries.push({ kind: 'quote', at: quote.createdAt, quote });
    if (quote.respondedAt) entries.push({ kind: 'response', at: quote.respondedAt, quote });
  }
  return entries.sort((a, b) => a.at.localeCompare(b.at));
}

/** Tax on a quote, rounded as the API's `calculateTax` rounds it. */
export function taxOn(subtotal: number, rate: number): number {
  return Math.round(subtotal * rate);
}

/**
 * Payable by the customer: an unpaid bundle checkout, or a custom request
 * whose quote was accepted (a custom request has no bundle).
 */
export function isPayable(order: {
  status: string;
  bundleId?: string | null;
  quoteStatus?: QuoteStatus | null;
  payment?: { status: string } | null;
}): boolean {
  if (order.status !== 'PENDING' || order.payment?.status === 'SUCCEEDED') return false;
  if (order.quoteStatus) return order.quoteStatus === 'ACCEPTED';
  return !!order.bundleId;
}

/**
 * Why a custom request cannot go to a vendor yet, or null when it can (or is
 * not a custom request). A vendor spends money the moment they are briefed, so
 * a price the customer has not agreed, or agreed but not paid, leaves the
 * business holding the cost. The API refuses on this; admin greys the button.
 */
export function customOrderVendorBlock(order: { quoteStatus?: QuoteStatus | null; paymentStatus?: string | null }): string | null {
  if (!order.quoteStatus) return null;
  if (order.quoteStatus !== 'ACCEPTED') {
    return 'The customer has not accepted a quote yet, so this order cannot go to a vendor.';
  }
  if (order.paymentStatus !== 'SUCCEEDED') {
    return 'The customer accepted the quote but has not paid yet, so this order cannot go to a vendor.';
  }
  return null;
}

/** Statuses that mean a custom gift is being fulfilled: a vendor is working on it. */
const FULFILMENT_STATUSES = new Set(['PROCESSING', 'SHIPPED', 'DELIVERED']);

/**
 * Why a custom request cannot be moved to `nextStatus`, or null when it can.
 * Admin may cancel or reopen at any stage, but no fulfilment status before the
 * quote is accepted and paid, and no refund of a request never paid.
 */
export function customOrderStatusBlock(
  order: { quoteStatus?: QuoteStatus | null; paymentStatus?: string | null },
  nextStatus: string,
): string | null {
  if (!order.quoteStatus) return null;
  if (FULFILMENT_STATUSES.has(nextStatus)) return customOrderVendorBlock(order);
  if (nextStatus === 'REFUNDED' && !['SUCCEEDED', 'REFUNDED'].includes(order.paymentStatus ?? '')) {
    return 'This order was never paid, so it cannot be refunded.';
  }
  return null;
}
