/**
 * Who may brief a vendor, and when. The API enforces it; the admin dashboard
 * uses the same rule to grey out the button and say why.
 *
 * A vendor spends real money sourcing a gift the moment they are briefed, so
 * only a paid, open order may reach one, and only an approved, active vendor
 * may take it. A subscription cycle created by Stripe Billing was paid before
 * the order existed, so a cycle order counts as paid.
 */

/** The statuses an order can be (re)assigned from. Anything else is finished or closed. */
export const VENDOR_ASSIGNABLE_STATUSES = ['PENDING', 'PROCESSING'] as const;

/** Why an order cannot go to a vendor right now, or null when it can. */
export function vendorAssignmentBlock(order: {
  status: string;
  subscriptionId?: string | null;
  paymentStatus?: string | null;
}): string | null {
  switch (order.status) {
    case 'CANCELLED':
      return 'This order is cancelled, so it cannot go to a vendor.';
    case 'REFUNDED':
      return 'This order was refunded, so it cannot go to a vendor.';
    case 'SHIPPED':
      return 'This order is already on its way; reassigning it would brief a second vendor.';
    case 'DELIVERED':
      return 'This order has been delivered.';
  }
  if (!order.subscriptionId && order.paymentStatus !== 'SUCCEEDED') {
    return 'This order has not been paid, so it cannot go to a vendor.';
  }
  return null;
}

/** Only an approved, active vendor may be assigned. */
export function isVendorAssignable(vendor: { isActive?: boolean; status?: string } | null | undefined): boolean {
  return Boolean(vendor && vendor.isActive && vendor.status === 'APPROVED');
}
