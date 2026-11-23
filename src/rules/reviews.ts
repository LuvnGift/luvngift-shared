/**
 * Customer reviews: who a review is shown as, and how a rating is rounded.
 * The API builds the public view with these and the apps preview the same
 * wording ("you will appear as Adaeze O., Toronto") before a review is sent.
 */

export const REVIEW_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

/**
 * The only grounds for not publishing a review. There is deliberately no
 * "negative" or "low rating" reason: Terms § 14 promises we do not remove
 * reviews for being negative, and the FTC's 2024 review rule and Canada's
 * Competition Act treat suppressing them as deceptive.
 */
export const REVIEW_REJECTION_REASONS = [
  'ABUSIVE',
  'UNLAWFUL',
  'PRIVATE_INFORMATION',
  'NOT_ABOUT_ORDER',
  'SPAM',
] as const;
export type ReviewRejectionReason = (typeof REVIEW_REJECTION_REASONS)[number];

export const REVIEW_REJECTION_LABELS: Record<ReviewRejectionReason, string> = {
  ABUSIVE: 'Abusive or offensive language',
  UNLAWFUL: 'Unlawful content',
  PRIVATE_INFORMATION: "Contains someone's private information",
  NOT_ABOUT_ORDER: 'Not about this order',
  SPAM: 'Spam or advertising',
};

export const REVIEW_RATING_MIN = 1;
export const REVIEW_RATING_MAX = 5;
export const REVIEW_COMMENT_MAX = 1000;
export const REVIEW_REPLY_MAX = 1000;
export const REVIEW_REJECTION_NOTE_MAX = 500;

/** Shown when a reviewer gave no first name. */
export const ANONYMOUS_REVIEWER = 'A Luvngift customer';

export interface ReviewerNameParts {
  firstName?: string | null;
  lastName?: string | null;
  city?: string | null;
}

const clean = (value?: string | null): string => (value ?? '').trim().replace(/\s+/g, ' ');

const capitalise = (word: string): string =>
  word ? word.charAt(0).toUpperCase() + word.slice(1) : word;

/**
 * How a reviewer appears in public: first name, last initial, city
 * ("Adaeze O., Toronto"). Never the username or email: usernames are often
 * built from an email address, and a full surname plus city identifies a
 * person. Privacy Policy describes exactly this.
 */
export function publicReviewerName(parts: ReviewerNameParts): string {
  const first = capitalise(clean(parts.firstName));
  if (!first) return ANONYMOUS_REVIEWER;
  const initial = clean(parts.lastName).charAt(0).toUpperCase();
  const name = initial ? `${first} ${initial}.` : first;
  const city = clean(parts.city);
  return city ? `${name}, ${city}` : name;
}

export interface ReviewRatingSummary {
  /** Mean of approved ratings, to one decimal place. */
  average: number;
  /** Number of approved reviews. */
  count: number;
}

/**
 * The rating summary for a bundle or the whole site, or null when nothing is
 * approved yet. A null is rendered as nothing at all: never placeholder stars
 * or an invented count.
 */
export function summariseRatings(average: number | null, count: number): ReviewRatingSummary | null {
  if (!count || average === null || !Number.isFinite(average)) return null;
  const bounded = Math.min(Math.max(average, REVIEW_RATING_MIN), REVIEW_RATING_MAX);
  return { average: Math.round(bounded * 10) / 10, count };
}
