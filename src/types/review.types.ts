import type { ReviewRejectionReason, ReviewStatus } from '../rules/reviews';

/** What kind of order a review is about, for the label on the public list. */
export type ReviewOrderKind = 'BUNDLE' | 'SUBSCRIPTION' | 'CUSTOM';

/**
 * A review as anyone may see it. Built by the API from an approved review;
 * never carries the reviewer's username, email or order details.
 */
export interface PublicReview {
  id: string;
  rating: number;
  comment: string | null;
  /** "Adaeze O., Toronto" — see `publicReviewerName`. */
  reviewerName: string;
  kind: ReviewOrderKind;
  bundle: { name: string; slug: string } | null;
  /** Our public reply, if any. */
  reply: string | null;
  repliedAt: string | null;
  createdAt: string;
}

/**
 * The customer's own review, on their order page. It says whether the review
 * is published, never why one was not (user decision 2026-11-22): the
 * rejection reason and note are for admin only.
 */
export interface OwnReview {
  id: string;
  rating: number;
  comment: string | null;
  status: ReviewStatus;
  reply: string | null;
  createdAt: string;
}

/** The admin moderation view. */
export interface AdminReview extends OwnReview {
  /** Set when status is REJECTED. Admin only. */
  rejectionReason: ReviewRejectionReason | null;
  /** An internal note on the rejection. Admin only. */
  rejectionNote: string | null;
  orderId: string;
  kind: ReviewOrderKind;
  reviewerName: string;
  isFeatured: boolean;
  moderatedAt: string | null;
  moderatedById: string | null;
  customer: { email: string; firstName: string | null; lastName: string | null };
  bundle: { name: string; slug: string } | null;
}
