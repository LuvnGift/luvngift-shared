import { OFFERED_INTERVALS, type OfferedInterval, type SubscriptionInterval } from '../types/subscription.types';

/**
 * How a cadence is worded, everywhere: emails, the site and the app. BIWEEKLY
 * is no longer sold but subscribers on it keep billing, so it keeps wording.
 * Accepts any string so a value from an older or newer API never crashes a
 * page; an unknown one reads as monthly.
 */

const WORDS: Record<SubscriptionInterval, { cycle: string; label: string; title: string }> = {
  MONTHLY: { cycle: 'month', label: 'monthly', title: 'Every month' },
  BIMONTHLY: { cycle: '2 months', label: 'every 2 months', title: 'Every 2 months' },
  QUARTERLY: { cycle: '3 months', label: 'quarterly', title: 'Every 3 months' },
  BIWEEKLY: { cycle: '2 weeks', label: 'every 2 weeks', title: 'Every 2 weeks' },
};

const known = (i: string): SubscriptionInterval => (i in WORDS ? (i as SubscriptionInterval) : 'MONTHLY');

/** Still on sale to new subscribers. */
export const isOffered = (i: string): i is OfferedInterval => (OFFERED_INTERVALS as readonly string[]).includes(i);

/** For "every ___" and "/ ___": month, 2 months, 3 months, 2 weeks. */
export const cycleWord = (i: string) => WORDS[known(i)].cycle;
/** In a sentence: monthly, every 2 months, quarterly, every 2 weeks. */
export const cadenceLabel = (i: string) => WORDS[known(i)].label;
/** As a button or heading: Every month, Every 2 months, Every 3 months. */
export const cadenceTitle = (i: string) => WORDS[known(i)].title;
