import { pointsForFill } from './points';

/**
 * How full a subscription box is, for the pickers' meter, and the words that
 * say what to do next. Each catalogue item comes with `share`: the percentage
 * of the plan's box (or a basket's maximum) one unit uses. The API decides in
 * kobo and is the authority, so this is a guide that can differ from it by a
 * rounding hair at the edges, and the server's message is shown if it does.
 */

export type BoxFillStatus = 'EMPTY' | 'UNDER' | 'OK' | 'OVER';

export interface BoxFill {
  percent: number;
  status: BoxFillStatus;
}

export function boxFill(
  picked: Record<string, number>,
  items: { id: string; share?: number | null }[],
  minFillPercent: number,
): BoxFill {
  const shares = new Map(items.map((i) => [i.id, i.share ?? 0]));
  const entries = Object.entries(picked);
  if (entries.length === 0) return { percent: 0, status: 'EMPTY' };

  const raw = entries.reduce((sum, [id, qty]) => sum + (shares.get(id) ?? 0) * qty, 0);
  const percent = Math.round(raw * 10) / 10;
  if (percent > 100) return { percent, status: 'OVER' };
  if (percent < minFillPercent) return { percent, status: 'UNDER' };
  return { percent, status: 'OK' };
}

/**
 * What to do next, in words: colour alone does not say whether to add or
 * remove. `whose` is "your" for the subscriber and "the" for admin, who earns
 * no points, so admin sees no points hint.
 */
export function boxFillMessage(fill: BoxFill, minFillPercent: number, whose: 'your' | 'the' = 'your'): string {
  const Box = whose === 'your' ? 'Your box' : 'The box';
  switch (fill.status) {
    case 'EMPTY':
      return `${Box} is empty. Add items until it is at least ${minFillPercent}% full.`;
    case 'UNDER':
      return `${Box} is ${fill.percent}% full. Add a little more to reach ${minFillPercent}%.`;
    case 'OVER':
      return `${Box} is ${fill.percent}% full. Remove or reduce something to bring it to 100%.`;
    default:
      return whose === 'your' && pointsForFill(fill.percent) > 0
        ? `${Box} is ${fill.percent}% full. Ready to go, and it earns ${pointsForFill(fill.percent)} points each delivery.`
        : `${Box} is ${fill.percent}% full. Ready to go.`;
  }
}

/** A basket has no minimum and earns no points: the meter is only the ceiling. */
export function basketFillMessage(fill: BoxFill, whose: 'your' | 'the' = 'your'): string {
  const Basket = whose === 'your' ? 'Your basket' : 'The basket';
  if (fill.status === 'EMPTY') return `${Basket} is empty. Add what they need.`;
  const base = `${Basket} is ${fill.percent}% of the most one delivery can hold.`;
  return fill.status === 'OVER' ? `${base} Remove or reduce something.` : base;
}
