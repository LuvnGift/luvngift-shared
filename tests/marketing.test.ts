import { describe, expect, it } from 'vitest';
import {
  adminMarketingIssueSchema,
  isMarketingOptedIn,
  isMarketingWeekOf,
  marketingPreferenceSchema,
  marketingWeekOf,
  registerSchema,
} from '../src';

describe('isMarketingOptedIn', () => {
  it('is false with no consent', () => {
    expect(isMarketingOptedIn({ marketingConsentAt: null, marketingUnsubscribedAt: null })).toBe(false);
  });
  it('is true with consent and no withdrawal', () => {
    expect(isMarketingOptedIn({ marketingConsentAt: new Date(), marketingUnsubscribedAt: null })).toBe(true);
  });
  it('follows whichever came last', () => {
    const earlier = '2026-11-01T00:00:00Z';
    const later = '2026-11-02T00:00:00Z';
    expect(isMarketingOptedIn({ marketingConsentAt: earlier, marketingUnsubscribedAt: later })).toBe(false);
    expect(isMarketingOptedIn({ marketingConsentAt: later, marketingUnsubscribedAt: earlier })).toBe(true);
  });
});

describe('marketingWeekOf', () => {
  it('returns the Monday on or before the date, in UTC', () => {
    expect(marketingWeekOf(new Date('2026-11-26T16:00:00Z'))).toBe('2026-11-23'); // Thursday
    expect(marketingWeekOf(new Date('2026-11-23T00:00:00Z'))).toBe('2026-11-23'); // Monday
    expect(marketingWeekOf(new Date('2026-11-29T23:59:59Z'))).toBe('2026-11-23'); // Sunday
  });
  it('validates a week key', () => {
    expect(isMarketingWeekOf('2026-11-23')).toBe(true);
    expect(isMarketingWeekOf('2026-11-24')).toBe(false);
    expect(isMarketingWeekOf('2026-02-30')).toBe(false);
    expect(isMarketingWeekOf('nope')).toBe(false);
  });
});

describe('marketing schemas', () => {
  it('needs a known consent source', () => {
    expect(marketingPreferenceSchema.safeParse({ optIn: true, source: 'account_web' }).success).toBe(true);
    expect(marketingPreferenceSchema.safeParse({ optIn: true, source: 'email' }).success).toBe(false);
  });

  it('takes one to four distinct bundles and drops blank copy', () => {
    expect(adminMarketingIssueSchema.safeParse({ bundleIds: [] }).success).toBe(false);
    expect(adminMarketingIssueSchema.safeParse({ bundleIds: ['a', 'b', 'c', 'd', 'e'] }).success).toBe(false);
    expect(adminMarketingIssueSchema.safeParse({ bundleIds: ['a', 'a'] }).success).toBe(false);
    const parsed = adminMarketingIssueSchema.parse({ bundleIds: ['a'], headline: '   ' });
    expect(parsed.headline).toBeUndefined();
  });

  it('leaves marketing consent off when signup does not mention it', () => {
    const parsed = registerSchema.parse({
      firstName: 'Ada',
      lastName: 'Obi',
      username: 'adaobi',
      email: 'ada@example.com',
      password: 'Passw0rdX',
      dateOfBirth: '1990-01-01',
    });
    expect(parsed.marketingOptIn).toBeUndefined();
  });
});
