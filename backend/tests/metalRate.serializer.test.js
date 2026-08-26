import { serializeMetalRate } from '../src/modules/metalRate/metalRate.serializer.js';

const buildRate = (overrides = {}) => ({
  gold24k: 6000,
  gold22k: 5500,
  gold18k: 4500,
  silver: 80,
  previousGold24k: 0,
  previousGold22k: 0,
  previousGold18k: 0,
  previousSilver: 0,
  unit: 'per gram',
  updatedAt: new Date('2026-08-09T10:00:00Z'),
  ...overrides,
});

describe('serializeMetalRate trend', () => {
  it('reports "up" when the current rate is higher than the previous one', () => {
    const result = serializeMetalRate(buildRate({ gold24k: 6200, previousGold24k: 6000 }));
    expect(result.trend.gold24k).toBe('up');
  });

  it('reports "down" when the current rate is lower than the previous one', () => {
    const result = serializeMetalRate(buildRate({ gold24k: 5900, previousGold24k: 6000 }));
    expect(result.trend.gold24k).toBe('down');
  });

  it('reports "same" when the rate is unchanged but a previous value exists', () => {
    const result = serializeMetalRate(buildRate({ gold24k: 6000, previousGold24k: 6000 }));
    expect(result.trend.gold24k).toBe('same');
  });

  it('reports null when there is no previous value yet (never changed)', () => {
    const result = serializeMetalRate(buildRate({ gold24k: 6000, previousGold24k: 0 }));
    expect(result.trend.gold24k).toBeNull();
  });

  it('computes an independent trend per metal', () => {
    const result = serializeMetalRate(
      buildRate({ gold24k: 6200, previousGold24k: 6000, silver: 78, previousSilver: 80 })
    );
    expect(result.trend).toEqual({ gold24k: 'up', gold22k: null, gold18k: null, silver: 'down' });
  });

  it('still returns the plain rate fields alongside trend', () => {
    const result = serializeMetalRate(buildRate());
    expect(result).toMatchObject({ gold24k: 6000, gold22k: 5500, gold18k: 4500, silver: 80, unit: 'per gram' });
  });
});
