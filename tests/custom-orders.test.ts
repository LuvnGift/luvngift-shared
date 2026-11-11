import { buildTimeline, isPayable, openQuote, type OrderConversation } from '../src';

// Pure helpers only — kept free of React Native so this runs without a device.

const quote = (round: number, response: string, extra: Record<string, unknown> = {}) => ({
  id: `q${round}`, round, subtotal: 4000, tax: 0, total: 4000, currency: 'CAD',
  scope: 'Cake', note: null, isFinal: false, response, customerComment: null,
  respondedAt: null, createdAt: `2026-10-0${round}T00:00:00.000Z`, ...extra,
}) as OrderConversation['quotes'][number];

const order = (extra: Record<string, unknown>) =>
  ({ status: 'PENDING', bundleId: null, payment: null, ...extra }) as any;

describe('isPayable', () => {
  it('pays an unpaid bundle order', () => {
    expect(isPayable(order({ bundleId: 'b1' }))).toBe(true);
  });

  it('pays a custom order only once its quote is accepted', () => {
    expect(isPayable(order({ quoteStatus: 'QUOTED' }))).toBe(false);
    expect(isPayable(order({ quoteStatus: 'ACCEPTED' }))).toBe(true);
  });

  it('never offers payment twice', () => {
    expect(isPayable(order({ quoteStatus: 'ACCEPTED', payment: { status: 'SUCCEEDED' } }))).toBe(false);
  });
});

describe('openQuote', () => {
  it('is the latest round while it awaits an answer', () => {
    const c = { quoteStatus: 'QUOTED', messages: [], quotes: [quote(1, 'SUPERSEDED'), quote(2, 'PENDING')] };
    expect(openQuote(c as OrderConversation)?.round).toBe(2);
  });

  it('is nothing once the customer has asked for changes', () => {
    const c = { quoteStatus: 'CHANGES_REQUESTED', messages: [], quotes: [quote(1, 'CHANGES_REQUESTED')] };
    expect(openQuote(c as OrderConversation)).toBeNull();
  });
});

it('buildTimeline interleaves messages and quote events in time order', () => {
  const c = {
    quoteStatus: 'QUOTED',
    quotes: [quote(1, 'CHANGES_REQUESTED', { respondedAt: '2026-10-03T00:00:00.000Z' })],
    messages: [{ id: 'm1', author: 'ADMIN', body: 'Hi', createdAt: '2026-10-02T00:00:00.000Z' }],
  } as OrderConversation;
  expect(buildTimeline(c).map((e) => e.kind)).toEqual(['quote', 'message', 'response']);
});
