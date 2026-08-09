import { describe, it, expect } from '@jest/globals';
import { computeAging } from '../src/modules/accounting/aging.util.js';

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

describe('aging.util.computeAging', () => {
  it('buckets a single fully-open invoice by its age', () => {
    const lines = [{ date: daysAgo(45), amount: 1000 }];
    const result = computeAging(lines, new Date());
    expect(result.buckets.days31To60).toBe(1000);
    expect(result.buckets.current).toBe(0);
    expect(result.total).toBe(1000);
  });

  it('FIFO-matches a payment against the oldest open invoice first', () => {
    const lines = [
      { date: daysAgo(70), amount: 500 },
      { date: daysAgo(10), amount: 300 },
      { date: daysAgo(5), amount: -500 },
    ];
    const result = computeAging(lines, new Date());
    // The 70-day-old invoice is fully consumed by the payment; only the
    // 10-day-old (current) invoice remains open.
    expect(result.buckets.days61To90).toBe(0);
    expect(result.buckets.current).toBe(300);
    expect(result.total).toBe(300);
  });

  it('partially consumes an older invoice, leaving the remainder open in its own bucket', () => {
    const lines = [
      { date: daysAgo(95), amount: 1000 },
      { date: daysAgo(20), amount: 400 },
      { date: daysAgo(2), amount: -600 },
    ];
    const result = computeAging(lines, new Date());
    // 600 consumed from the 95-day-old invoice (1000 -> 400 remaining).
    expect(result.buckets.days90Plus).toBe(400);
    expect(result.buckets.current).toBe(400);
    expect(result.total).toBe(800);
  });

  it('returns zero total once every invoice has been fully paid', () => {
    const lines = [
      { date: daysAgo(15), amount: 200 },
      { date: daysAgo(1), amount: -200 },
    ];
    const result = computeAging(lines, new Date());
    expect(result.total).toBe(0);
    expect(result.openItems).toHaveLength(0);
  });

  it('never lets a payment go negative-open (overpayment is simply dropped, not a negative bucket)', () => {
    const lines = [
      { date: daysAgo(10), amount: 100 },
      { date: daysAgo(1), amount: -150 },
    ];
    const result = computeAging(lines, new Date());
    expect(result.total).toBe(0);
  });
});
