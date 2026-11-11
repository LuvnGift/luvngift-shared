import { describe, expect, it } from 'vitest';
import { isVendorAssignable, vendorAssignmentBlock } from '../src';

// The rule the API enforces and the admin dashboard previews.
describe('vendorAssignmentBlock', () => {
  const paid = { status: 'PENDING', subscriptionId: null, paymentStatus: 'SUCCEEDED' };

  it('allows a paid order, open or already being fulfilled', () => {
    expect(vendorAssignmentBlock(paid)).toBeNull();
    expect(vendorAssignmentBlock({ ...paid, status: 'PROCESSING' })).toBeNull();
  });

  it('allows a subscription cycle, which has no payment row', () => {
    expect(vendorAssignmentBlock({ status: 'PENDING', subscriptionId: 'sub_1', paymentStatus: null })).toBeNull();
  });

  it.each(['CANCELLED', 'REFUNDED', 'SHIPPED', 'DELIVERED'])('blocks a %s order', (status) => {
    expect(vendorAssignmentBlock({ ...paid, status })).not.toBeNull();
  });

  it('blocks an unpaid one-off order', () => {
    expect(vendorAssignmentBlock({ ...paid, paymentStatus: 'PENDING' })).toMatch(/not been paid/i);
    expect(vendorAssignmentBlock({ ...paid, paymentStatus: null })).toMatch(/not been paid/i);
  });
});

describe('isVendorAssignable', () => {
  it('offers only approved, active vendors', () => {
    expect(isVendorAssignable({ isActive: true, status: 'APPROVED' })).toBe(true);
    expect(isVendorAssignable({ isActive: false, status: 'APPROVED' })).toBe(false);
    expect(isVendorAssignable({ isActive: true, status: 'PENDING' })).toBe(false);
    expect(isVendorAssignable({ isActive: true, status: 'REJECTED' })).toBe(false);
  });
});
