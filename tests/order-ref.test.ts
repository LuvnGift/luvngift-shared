import { shortId } from '../src';

/**
 * The order reference in outbound email MUST match the admin dashboard.
 *
 * Emails used the first eight characters lower-cased while
 * `app/admin/orders/page.tsx` renders the last eight upper-cased, so a vendor
 * or customer quoting the reference from their email was quoting a string that
 * appeared nowhere in admin. This pins the one true format.
 */
describe('shortId', () => {
  it('matches the admin dashboard format: # + last 8, uppercase', () => {
    expect(shortId('cme4k2p0x0001m8ciaqz')).toBe('#1M8CIAQZ');
  });

  it('is the LAST eight characters, not the first', () => {
    const id = 'aaaaaaaabbbbbbbb';
    expect(shortId(id)).toBe('#BBBBBBBB');
  });

  it('does not pad or truncate a short id', () => {
    expect(shortId('abc')).toBe('#ABC');
  });
});
