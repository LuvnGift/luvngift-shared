/**
 * Values every app must agree on exactly.
 */

/**
 * Nigerian states + FCT, used for recipient addresses, partner coverage and
 * catalogue availability. Stored verbatim in `Address.state` and
 * `CustomItem.availableStates`, so every form must offer exactly these.
 */
export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo',
  'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
  'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
  'Yobe', 'Zamfara',
] as const;
export type NigerianState = (typeof NIGERIAN_STATES)[number];

/**
 * The legal identity of the seller: the footer, contact and legal pages, and
 * the identity footer on every email (Canada's CASL requires a name, mailing
 * address and a way to make contact; Ontario's Consumer Protection Act and the
 * UK's E-Commerce Regulations ask for name, address, phone and email).
 */
export const BUSINESS = {
  tradingName: 'Luvngift',
  legalName: 'DOCH FX INC',
  address: {
    street: '3354 Woodroffe Avenue',
    city: 'Nepean',
    region: 'Ontario',
    postalCode: 'K2J 0A8',
    country: 'Canada',
  },
  email: 'info@luvngift.com',
  /**
   * Customer-facing phone number in international format, e.g. '+1 613 555 0123'.
   * Empty until a real number exists: every surface hides the phone line when
   * this is blank rather than showing a placeholder.
   */
  phone: '' as string,
} as const;

/** One-line postal address, e.g. "3354 Woodroffe Avenue, Nepean, Ontario K2J 0A8, Canada". */
export function businessAddressLine(): string {
  const a = BUSINESS.address;
  return `${a.street}, ${a.city}, ${a.region} ${a.postalCode}, ${a.country}`;
}

/** `tel:` href for the phone number — digits and a leading + only. */
export function businessPhoneHref(): string {
  return `tel:${BUSINESS.phone.replace(/[^\d+]/g, '')}`;
}

/**
 * Cache tag names: the web's fetches tag with these and the API purges them
 * after an admin edit. If the two disagree, a purge silently does nothing and
 * the page goes stale until the time fallback.
 */
export const CACHE_TAGS = {
  bundles: 'bundles',
  bundle: (slug: string) => `bundle:${slug}`,
  occasions: 'occasions',
  occasion: (slug: string) => `occasion:${slug}`,
  jobs: 'jobs',
  job: (slug: string) => `job:${slug}`,
  roadmap: 'roadmap',
  subscriptionPlans: 'subscription-plans',
} as const;

/**
 * Time-based fallback for tagged fetches, in seconds. Tags do the real work;
 * this only catches anything a purge misses.
 */
export const CACHE_FALLBACK_SECONDS = 3600;
