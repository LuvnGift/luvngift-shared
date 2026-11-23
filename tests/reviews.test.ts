import {
  ANONYMOUS_REVIEWER,
  CACHE_TAGS,
  REVIEW_COMMENT_MAX,
  REVIEW_REJECTION_LABELS,
  REVIEW_REJECTION_REASONS,
  adminReviewListQuerySchema,
  adminReviewReplySchema,
  adminReviewStatusSchema,
  createReviewSchema,
  publicReviewListQuerySchema,
  publicReviewerName,
  summariseRatings,
} from '../src';

const ORDER_ID = 'cme4k2p0x0001m8ciaqz1234';

describe('publicReviewerName', () => {
  it('is first name, last initial and city', () => {
    expect(publicReviewerName({ firstName: 'Adaeze', lastName: 'Okafor', city: 'Toronto' })).toBe(
      'Adaeze O., Toronto',
    );
  });

  it('drops the parts that are missing', () => {
    expect(publicReviewerName({ firstName: 'Adaeze', lastName: 'Okafor' })).toBe('Adaeze O.');
    expect(publicReviewerName({ firstName: 'Adaeze', city: 'Leeds' })).toBe('Adaeze, Leeds');
    expect(publicReviewerName({ firstName: 'Adaeze' })).toBe('Adaeze');
  });

  it('never shows the surname in full', () => {
    expect(publicReviewerName({ firstName: 'tunde', lastName: 'bakare' })).toBe('Tunde B.');
  });

  it('falls back to a neutral label with no first name, never a username', () => {
    expect(publicReviewerName({ firstName: '  ', lastName: 'Okafor', city: 'Toronto' })).toBe(
      ANONYMOUS_REVIEWER,
    );
    expect(publicReviewerName({})).toBe(ANONYMOUS_REVIEWER);
  });

  it('tidies stray whitespace', () => {
    expect(publicReviewerName({ firstName: ' Ada  Grace ', lastName: ' o ', city: ' London ' })).toBe(
      'Ada Grace O., London',
    );
  });
});

describe('summariseRatings', () => {
  it('is null when nothing is approved, so nothing is rendered', () => {
    expect(summariseRatings(null, 0)).toBeNull();
    expect(summariseRatings(4.5, 0)).toBeNull();
  });

  it('rounds to one decimal place', () => {
    expect(summariseRatings(4.666666, 3)).toEqual({ average: 4.7, count: 3 });
    expect(summariseRatings(5, 1)).toEqual({ average: 5, count: 1 });
  });
});

describe('review rejection reasons', () => {
  it('never include a reason that amounts to "it was negative"', () => {
    for (const reason of REVIEW_REJECTION_REASONS) {
      expect(reason).not.toMatch(/NEGATIVE|LOW|RATING|UNFAIR|INACCURATE/);
    }
  });

  it('every reason has a label', () => {
    for (const reason of REVIEW_REJECTION_REASONS) expect(REVIEW_REJECTION_LABELS[reason]).toBeTruthy();
  });
});

describe('createReviewSchema', () => {
  it('accepts a rating with no comment, and treats a blank comment as none', () => {
    expect(createReviewSchema.parse({ orderId: ORDER_ID, rating: 4 }).comment).toBeUndefined();
    expect(createReviewSchema.parse({ orderId: ORDER_ID, rating: 4, comment: '   ' }).comment).toBeUndefined();
  });

  it('trims the comment', () => {
    expect(createReviewSchema.parse({ orderId: ORDER_ID, rating: 5, comment: ' Lovely ' }).comment).toBe(
      'Lovely',
    );
  });

  it.each([0, 6, 3.5])('refuses a rating of %s', (rating) => {
    expect(createReviewSchema.safeParse({ orderId: ORDER_ID, rating }).success).toBe(false);
  });

  it('refuses an over-long comment', () => {
    const comment = 'a'.repeat(REVIEW_COMMENT_MAX + 1);
    expect(createReviewSchema.safeParse({ orderId: ORDER_ID, rating: 5, comment }).success).toBe(false);
  });
});

describe('admin review schemas', () => {
  it('rejecting needs a permitted reason', () => {
    expect(adminReviewStatusSchema.safeParse({ status: 'REJECTED' }).success).toBe(false);
    expect(adminReviewStatusSchema.safeParse({ status: 'REJECTED', reason: 'NEGATIVE' }).success).toBe(false);
    expect(adminReviewStatusSchema.safeParse({ status: 'REJECTED', reason: 'SPAM' }).success).toBe(true);
  });

  it('approving needs nothing else, and PENDING cannot be set', () => {
    expect(adminReviewStatusSchema.safeParse({ status: 'APPROVED' }).success).toBe(true);
    expect(adminReviewStatusSchema.safeParse({ status: 'PENDING' }).success).toBe(false);
  });

  it('a blank reply removes it', () => {
    expect(adminReviewReplySchema.parse({ reply: '  ' }).reply).toBeNull();
    expect(adminReviewReplySchema.parse({ reply: null }).reply).toBeNull();
    expect(adminReviewReplySchema.parse({ reply: ' Thank you ' }).reply).toBe('Thank you');
  });

  it('the admin list defaults to the pending queue', () => {
    expect(adminReviewListQuerySchema.parse({}).status).toBe('PENDING');
  });
});

describe('publicReviewListQuerySchema', () => {
  it('reads featured from the query string', () => {
    expect(publicReviewListQuerySchema.parse({ featured: 'true' }).featured).toBe(true);
    expect(publicReviewListQuerySchema.parse({}).featured).toBe(false);
  });
});

it('has a cache tag for the review lists', () => {
  expect(CACHE_TAGS.reviews).toBe('reviews');
});
