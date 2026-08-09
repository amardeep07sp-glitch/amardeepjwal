import { describe, it, expect } from '@jest/globals';
import { canTransition, getAllowedNextStatuses, canTransitionReturn } from '../src/modules/purchase/purchase.statusTransition.js';
import { PO_STATUSES, PURCHASE_RETURN_STATUSES } from '../src/modules/purchase/purchase.constants.js';

describe('purchase.statusTransition - Purchase Order', () => {
  it('allows the documented forward transitions', () => {
    expect(canTransition(PO_STATUSES.DRAFT, PO_STATUSES.PENDING)).toBe(true);
    expect(canTransition(PO_STATUSES.PENDING, PO_STATUSES.APPROVED)).toBe(true);
    expect(canTransition(PO_STATUSES.APPROVED, PO_STATUSES.ORDERED)).toBe(true);
    expect(canTransition(PO_STATUSES.ORDERED, PO_STATUSES.PARTIALLY_RECEIVED)).toBe(true);
    expect(canTransition(PO_STATUSES.ORDERED, PO_STATUSES.RECEIVED)).toBe(true);
    expect(canTransition(PO_STATUSES.PARTIALLY_RECEIVED, PO_STATUSES.RECEIVED)).toBe(true);
  });

  it('never allows a backward transition', () => {
    expect(canTransition(PO_STATUSES.APPROVED, PO_STATUSES.PENDING)).toBe(false);
    expect(canTransition(PO_STATUSES.ORDERED, PO_STATUSES.APPROVED)).toBe(false);
    expect(canTransition(PO_STATUSES.RECEIVED, PO_STATUSES.ORDERED)).toBe(false);
  });

  it('never allows a transition out of a terminal status', () => {
    expect(canTransition(PO_STATUSES.RECEIVED, PO_STATUSES.CANCELLED)).toBe(false);
    expect(canTransition(PO_STATUSES.CANCELLED, PO_STATUSES.DRAFT)).toBe(false);
  });

  it('allows cancellation from every pre-received status', () => {
    expect(canTransition(PO_STATUSES.DRAFT, PO_STATUSES.CANCELLED)).toBe(true);
    expect(canTransition(PO_STATUSES.APPROVED, PO_STATUSES.CANCELLED)).toBe(true);
    expect(canTransition(PO_STATUSES.ORDERED, PO_STATUSES.CANCELLED)).toBe(true);
    expect(canTransition(PO_STATUSES.PARTIALLY_RECEIVED, PO_STATUSES.CANCELLED)).toBe(true);
  });

  it('does not allow cancellation once fully received', () => {
    expect(canTransition(PO_STATUSES.RECEIVED, PO_STATUSES.CANCELLED)).toBe(false);
  });

  it('rejects an unknown status entirely', () => {
    expect(canTransition('not_a_real_status', PO_STATUSES.PENDING)).toBe(false);
  });

  it('getAllowedNextStatuses returns the exact row for a status', () => {
    expect(getAllowedNextStatuses(PO_STATUSES.DRAFT)).toEqual([PO_STATUSES.PENDING, PO_STATUSES.CANCELLED]);
    expect(getAllowedNextStatuses(PO_STATUSES.RECEIVED)).toEqual([]);
    expect(getAllowedNextStatuses('unknown')).toEqual([]);
  });
});

describe('purchase.statusTransition - Purchase Return', () => {
  it('allows requested -> approved -> completed', () => {
    expect(canTransitionReturn(PURCHASE_RETURN_STATUSES.REQUESTED, PURCHASE_RETURN_STATUSES.APPROVED)).toBe(true);
    expect(canTransitionReturn(PURCHASE_RETURN_STATUSES.APPROVED, PURCHASE_RETURN_STATUSES.COMPLETED)).toBe(true);
  });

  it('allows requested -> rejected but nothing after', () => {
    expect(canTransitionReturn(PURCHASE_RETURN_STATUSES.REQUESTED, PURCHASE_RETURN_STATUSES.REJECTED)).toBe(true);
    expect(canTransitionReturn(PURCHASE_RETURN_STATUSES.REJECTED, PURCHASE_RETURN_STATUSES.APPROVED)).toBe(false);
  });

  it('never allows skipping straight from requested to completed', () => {
    expect(canTransitionReturn(PURCHASE_RETURN_STATUSES.REQUESTED, PURCHASE_RETURN_STATUSES.COMPLETED)).toBe(false);
  });
});
