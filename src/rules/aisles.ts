/**
 * The box picker shows the catalogue as "aisles": one collapsible row per
 * category that summarises itself when closed (what is picked, how much of the
 * box it fills), so a long catalogue never renders as one wall of items.
 */

/**
 * The icon keys a catalogue category may have. The API validates against this
 * list, and each app maps every key to its own glyph (a Record over
 * `ItemCategoryIcon`, so a new key fails to compile until it has one).
 */
export const ITEM_CATEGORY_ICONS = [
  'grains',
  'produce',
  'oils',
  'protein',
  'drinks',
  'snacks',
  'household',
  'baby',
  'other',
] as const;
export type ItemCategoryIcon = (typeof ITEM_CATEGORY_ICONS)[number];

export interface AisleItem {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  share?: number | null;
}

export interface Aisle<T extends AisleItem> {
  category: string;
  items: T[];
}

/** Items grouped by category, in the order the API sent them (category, then name). */
export function toAisles<T extends AisleItem>(items: T[]): Aisle<T>[] {
  const aisles: Aisle<T>[] = [];
  const index = new Map<string, Aisle<T>>();
  for (const item of items) {
    let aisle = index.get(item.category);
    if (!aisle) {
      aisle = { category: item.category, items: [] };
      index.set(item.category, aisle);
      aisles.push(aisle);
    }
    aisle.items.push(item);
  }
  return aisles;
}

/** What one aisle contributes to the box: distinct items picked and % of the box filled. */
export function aisleSummary(items: AisleItem[], picked: Record<string, number>) {
  let count = 0;
  let percent = 0;
  for (const item of items) {
    const qty = picked[item.id];
    if (!qty) continue;
    count += 1;
    if (item.share != null) percent += item.share * qty;
  }
  return { count, percent: Math.round(percent * 10) / 10 };
}

/** Items whose name, description or category contains every word of the query. */
export function searchItems<T extends AisleItem>(items: T[], query: string): T[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return items;
  return items.filter((item) => {
    const text = `${item.name} ${item.description ?? ''} ${item.category}`.toLowerCase();
    return words.every((w) => text.includes(w));
  });
}

/** A search box is worth its space only once the catalogue is long. */
export const SEARCH_FROM_ITEMS = 12;

/**
 * Fallback icon by keyword, for a response without `categoryIcon` (an older
 * API). Order matters: the first match wins.
 */
const ICON_KEYWORDS: [ItemCategoryIcon, RegExp][] = [
  ['baby', /baby|kid|infant|child/],
  ['household', /toilet|household|clean|soap|detergent|personal care/],
  ['drinks', /drink|beverage|tea|milk|juice|water|cocoa/],
  ['snacks', /snack|breakfast|biscuit|cereal|sweet|treat/],
  ['protein', /protein|meat|chicken|fish|egg|crayfish|beef|goat/],
  ['oils', /oil|spice|season|condiment|sauce/],
  ['produce', /tuber|produce|yam|plantain|vegetable|fruit|fresh|pepper|tomato/],
  ['grains', /grain|flour|rice|beans|garri|semo|pasta|staple|cereal/],
];

const ICON_KEYS = new Set<string>(ITEM_CATEGORY_ICONS);

/** The admin-chosen icon when the API sent a known one, else a guess from the name. */
export function aisleIcon(category: string, chosen?: string | null): ItemCategoryIcon {
  if (chosen && ICON_KEYS.has(chosen)) return chosen as ItemCategoryIcon;
  const c = category.toLowerCase();
  for (const [icon, re] of ICON_KEYWORDS) if (re.test(c)) return icon;
  return 'other';
}
