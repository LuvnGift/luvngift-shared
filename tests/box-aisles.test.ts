import { describe, it, expect } from 'vitest';
import { toAisles, aisleSummary, searchItems, aisleIcon } from '../src';

const items = [
  { id: 'rice', name: 'Rice (5kg)', category: 'Grains & flour', share: 12.5, description: 'Long grain' },
  { id: 'garri', name: 'Garri', category: 'Grains & flour', share: 6 },
  { id: 'oil', name: 'Palm oil', category: 'Oils, spices & seasoning', share: 8 },
  { id: 'milo', name: 'Milo', category: 'Drinks & beverages', share: null },
];

describe('toAisles', () => {
  it('groups by category and keeps the API order', () => {
    const aisles = toAisles(items);
    expect(aisles.map((a) => a.category)).toEqual(['Grains & flour', 'Oils, spices & seasoning', 'Drinks & beverages']);
    expect(aisles[0].items.map((i) => i.id)).toEqual(['rice', 'garri']);
  });
});

describe('aisleSummary', () => {
  it('counts distinct items and adds share × quantity', () => {
    expect(aisleSummary(items, { rice: 2, garri: 1 })).toEqual({ count: 2, percent: 31 });
  });

  it('counts an item with no share without adding to the fill', () => {
    expect(aisleSummary(items, { milo: 3 })).toEqual({ count: 1, percent: 0 });
  });
});

describe('searchItems', () => {
  it('matches every word across name, description and category', () => {
    expect(searchItems(items, 'long rice').map((i) => i.id)).toEqual(['rice']);
    expect(searchItems(items, 'GRAINS').map((i) => i.id)).toEqual(['rice', 'garri']);
    expect(searchItems(items, '  ')).toHaveLength(4);
  });
});

describe('aisleIcon', () => {
  it('picks an icon by keyword and falls back to other', () => {
    expect(aisleIcon('Grains & flour')).toBe('grains');
    expect(aisleIcon('Drinks & beverages')).toBe('drinks');
    expect(aisleIcon('Toiletries & household')).toBe('household');
    expect(aisleIcon('Breakfast & snacks')).toBe('snacks');
    expect(aisleIcon('Gift cards')).toBe('other');
  });

  it("prefers the admin's chosen icon, ignoring an unknown key", () => {
    expect(aisleIcon('Gift cards', 'snacks')).toBe('snacks');
    expect(aisleIcon('Grains & flour', 'rocket')).toBe('grains');
  });
});
