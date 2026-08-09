import { describe, it, expect } from '@jest/globals';
import { canTransition, getAllowedNextStatuses } from '../src/modules/order/order.statusTransition.js';
import { ORDER_STATUSES } from '../src/modules/order/order.constants.js';

describe('order.statusTransition', () => {
  it('allows the documented forward transitions', () => {
    expect(canTransition(ORDER_STATUSES.DRAFT, ORDER_STATUSES.PENDING)).toBe(true);
    expect(canTransition(ORDER_STATUSES.PENDING, ORDER_STATUSES.CONFIRMED)).toBe(true);
    expect(canTransition(ORDER_STATUSES.CONFIRMED, ORDER_STATUSES.PACKED)).toBe(true);
    expect(canTransition(ORDER_STATUSES.DELIVERED, ORDER_STATUSES.COMPLETED)).toBe(true);
  });

  it('never allows a backward transition (status can never roll back)', () => {
    expect(canTransition(ORDER_STATUSES.CONFIRMED, ORDER_STATUSES.PENDING)).toBe(false);
    expect(canTransition(ORDER_STATUSES.SHIPPED, ORDER_STATUSES.CONFIRMED)).toBe(false);
    expect(canTransition(ORDER_STATUSES.DELIVERED, ORDER_STATUSES.DRAFT)).toBe(false);
  });

  it('never allows a transition out of a terminal status', () => {
    expect(canTransition(ORDER_STATUSES.CANCELLED, ORDER_STATUSES.PENDING)).toBe(false);
    expect(canTransition(ORDER_STATUSES.REFUNDED, ORDER_STATUSES.DELIVERED)).toBe(false);
  });

  it('allows cancellation from every pre-shipment status', () => {
    expect(canTransition(ORDER_STATUSES.DRAFT, ORDER_STATUSES.CANCELLED)).toBe(true);
    expect(canTransition(ORDER_STATUSES.PENDING, ORDER_STATUSES.CANCELLED)).toBe(true);
    expect(canTransition(ORDER_STATUSES.CONFIRMED, ORDER_STATUSES.CANCELLED)).toBe(true);
    expect(canTransition(ORDER_STATUSES.PACKED, ORDER_STATUSES.CANCELLED)).toBe(true);
  });

  it('does not allow cancellation once shipped', () => {
    expect(canTransition(ORDER_STATUSES.SHIPPED, ORDER_STATUSES.CANCELLED)).toBe(false);
  });

  it('rejects an unknown status entirely', () => {
    expect(canTransition('not_a_real_status', ORDER_STATUSES.PENDING)).toBe(false);
  });

  it('getAllowedNextStatuses returns the exact row for a status', () => {
    expect(getAllowedNextStatuses(ORDER_STATUSES.DRAFT)).toEqual([ORDER_STATUSES.PENDING, ORDER_STATUSES.CANCELLED]);
    expect(getAllowedNextStatuses(ORDER_STATUSES.CANCELLED)).toEqual([]);
    expect(getAllowedNextStatuses('unknown')).toEqual([]);
  });
});
