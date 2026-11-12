import { NIGERIAN_STATES } from '../constants';

/**
 * The fulfilment fee a partner is paid depends on the recipient's state band
 * (decided 2026-11-11): admin sets one naira fee per band and puts each state
 * in a band (Admin → Settings → Fulfilment).
 *
 *  - A state admin has not placed is HIGH, so an order is never paid below
 *    the dearest fee by omission.
 *  - Published prices are fixed and shown before the recipient's address is
 *    known, so they are built on the PRICING band (HIGH). A lower band leaves
 *    more for the platform; it never changes what the buyer pays.
 *  - The order's line snapshots the fee for the recipient's ACTUAL band.
 */

export const FULFILMENT_BANDS = ['HIGH', 'MEDIUM', 'LOW'] as const;
export type FulfilmentBand = (typeof FULFILMENT_BANDS)[number];

/** The band every published price is built on: the dearest. */
export const PRICING_BAND: FulfilmentBand = 'HIGH';

/** A state not placed in a band. */
export const DEFAULT_BAND: FulfilmentBand = 'HIGH';

export const BAND_LABELS: Record<FulfilmentBand, string> = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
};

export interface BandRules {
  /** Fee per order in each band, in kobo. */
  bandFeesNgn: Record<FulfilmentBand, number>;
  /** State (as in NIGERIAN_STATES) → band. Missing = DEFAULT_BAND. */
  stateBands: Partial<Record<string, FulfilmentBand>>;
}

const normalise = (state: string) => state.trim().toLowerCase();

/** The band a recipient's state is in. An unknown or unplaced state is DEFAULT_BAND. */
export function bandForState(state: string | null | undefined, stateBands: BandRules['stateBands']): FulfilmentBand {
  if (!state) return DEFAULT_BAND;
  const key = normalise(state);
  const match = Object.entries(stateBands).find(([s]) => normalise(s) === key);
  return match?.[1] ?? DEFAULT_BAND;
}

/** The fulfilment fee for an order to `state`, in kobo. */
export function feeForState(state: string | null | undefined, rules: BandRules): number {
  return rules.bandFeesNgn[bandForState(state, rules.stateBands)];
}

/** The fee every published price is built on, in kobo. */
export function pricingFeeNgn(rules: Pick<BandRules, 'bandFeesNgn'>): number {
  return rules.bandFeesNgn[PRICING_BAND];
}

/** States admin has not placed in a band (they count as HIGH). */
export function unplacedStates(stateBands: BandRules['stateBands']): string[] {
  return NIGERIAN_STATES.filter((s) => !stateBands[s]);
}

/**
 * Bands must not undercut the pricing band: every price is built on HIGH, so a
 * MEDIUM or LOW fee above it would pay a partner more than the price covers.
 */
export function bandFeeProblem(bandFeesNgn: Record<FulfilmentBand, number>): string | null {
  const high = bandFeesNgn.HIGH;
  if (bandFeesNgn.MEDIUM > high || bandFeesNgn.LOW > high) {
    return 'The Medium and Low fees cannot be more than the High fee: every price is built on High.';
  }
  return null;
}
