import type { Currency } from './common.types';

/**
 * The custom gift request conversation (request → quote → accept → pay), as
 * the API sends it to the customer (web and mobile) and to admin.
 */

export const QUOTE_STATUSES = ['AWAITING_QUOTE', 'QUOTED', 'CHANGES_REQUESTED', 'ACCEPTED', 'DECLINED'] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const QUOTE_RESPONSES = ['PENDING', 'ACCEPTED', 'CHANGES_REQUESTED', 'DECLINED', 'SUPERSEDED'] as const;
export type QuoteResponse = (typeof QUOTE_RESPONSES)[number];

export type QuoteAction = 'ACCEPT' | 'REQUEST_CHANGES' | 'DECLINE';

/**
 * Where an admin may send a (new) quote from. DECLINED is included: a decline
 * keeps the request open so a new quote can win the customer back; cancelling
 * is a separate admin action.
 */
export const QUOTABLE_STATUSES: readonly QuoteStatus[] = ['AWAITING_QUOTE', 'QUOTED', 'CHANGES_REQUESTED', 'DECLINED'];

export interface CustomOrderQuote {
  id: string;
  round: number;
  subtotal: number;
  tax: number;
  total: number;
  currency: Currency;
  scope: string;
  note: string | null;
  isFinal: boolean;
  response: QuoteResponse;
  customerComment: string | null;
  respondedAt: string | null;
  createdAt: string;
}

export interface OrderMessage {
  id: string;
  author: 'CUSTOMER' | 'ADMIN';
  body: string;
  createdAt: string;
}

export interface OrderConversation {
  quoteStatus: QuoteStatus;
  quotes: CustomOrderQuote[];
  messages: OrderMessage[];
  /** Admin view only: the buyer's tax rate, so a quote can be previewed. */
  tax?: { rate: number; label: string };
}

/** One stream of messages and quote events, oldest first. */
export type TimelineEntry =
  | { kind: 'message'; at: string; message: OrderMessage }
  | { kind: 'quote'; at: string; quote: CustomOrderQuote }
  | { kind: 'response'; at: string; quote: CustomOrderQuote };
