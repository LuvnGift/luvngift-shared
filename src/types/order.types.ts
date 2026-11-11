import type { QuoteStatus } from './custom-order.types';
import { Currency, OrderStatus } from './common.types';

export interface OrderItem {
  id: string;
  orderId: string;
  customItemId?: string;
  name: string;
  price: number;
  quantity: number;
}

export interface OrderPayment {
  id: string;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED';
  stripePaymentIntentId: string;
  amount: number;
  currency: string;
}

/**
 * An order as the API returns it. A customer's reads go through
 * PUBLIC_ORDER_SELECT in the API, so the admin-only fields below are absent
 * from them; admin reads include them.
 */
export interface Order {
  id: string;
  userId: string;
  bundleId?: string;
  addressId?: string | null;
  /** Set when a subscription delivery made this order. */
  subscriptionId?: string | null;
  /** Admin reads only. */
  vendorId?: string;
  status: OrderStatus;
  /** A custom gift request's negotiation stage; null on every other order. */
  quoteStatus?: QuoteStatus | null;
  recipientName: string;
  recipientPhone: string;
  deliveryStreet: string;
  deliveryCity: string;
  deliveryState: string;
  deliveryCountry: string;
  personalMessage?: string;
  specialInstructions?: string;
  preferredDeliveryDate?: Date;
  subtotal: number;
  tax: number;
  total: number;
  currency: Currency;
  /** Exchange rate to CAD at the time the order was created (1.0 for CAD orders) */
  cadExchangeRate?: number;
  /** Admin reads only. */
  adminNotes?: string;
  /** Admin reads only. */
  isFlagged?: boolean;
  pointsRedeemed?: number;
  pointsDiscount?: number;
  /** Proof of delivery: the photo, when it was taken, and the vendor's note. */
  deliveryProofUrl?: string | null;
  deliveryProofAt?: string | null;
  deliveryProofNote?: string | null;
  /** When the recipient confirmed with the delivery code. */
  recipientConfirmedAt?: string | null;
  invoiceUrl?: string;
  items: OrderItem[];
  payment?: OrderPayment;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  orderId: string;
  invoiceNumber: string;
  pdfUrl?: string;
  emailedAt?: Date;
  createdAt: Date;
}
