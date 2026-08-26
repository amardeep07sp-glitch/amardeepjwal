import { jest } from '@jest/globals';

const mockMetalRate = { findOne: jest.fn(), create: jest.fn() };
jest.unstable_mockModule('../src/modules/metalRate/metalRate.model.js', () => ({
  MetalRate: mockMetalRate,
  METAL_FIELDS: ['gold24k', 'gold22k', 'gold18k', 'silver'],
}));

const { metalRateRepository } = await import('../src/modules/metalRate/metalRate.repository.js');

const buildDoc = (overrides = {}) => ({
  gold24k: 6000,
  gold22k: 5500,
  gold18k: 4500,
  silver: 80,
  previousGold24k: 0,
  previousGold22k: 0,
  previousGold18k: 0,
  previousSilver: 0,
  save: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

beforeEach(() => {
  mockMetalRate.findOne.mockReset();
  mockMetalRate.create.mockReset();
});

describe('metalRateRepository.updateSingleton', () => {
  it('snapshots the old value as previous when a field actually changes', async () => {
    const doc = buildDoc();
    mockMetalRate.findOne.mockResolvedValue(doc);

    const result = await metalRateRepository.updateSingleton({ gold24k: 6200 });

    expect(result.previousGold24k).toBe(6000);
    expect(result.gold24k).toBe(6200);
    expect(doc.save).toHaveBeenCalledTimes(1);
  });

  it('leaves previous untouched when the new value equals the current one', async () => {
    const doc = buildDoc({ previousGold24k: 5900 });
    mockMetalRate.findOne.mockResolvedValue(doc);

    const result = await metalRateRepository.updateSingleton({ gold24k: 6000 });

    expect(result.previousGold24k).toBe(5900);
  });

  it('only snapshots fields present in the update payload', async () => {
    const doc = buildDoc();
    mockMetalRate.findOne.mockResolvedValue(doc);

    const result = await metalRateRepository.updateSingleton({ gold24k: 6200 });

    expect(result.previousSilver).toBe(0);
  });

  it('creates a singleton on first update when none exists yet', async () => {
    const created = buildDoc({ gold24k: 0 });
    mockMetalRate.findOne.mockResolvedValue(null);
    mockMetalRate.create.mockResolvedValue(created);

    await metalRateRepository.updateSingleton({ gold24k: 6200 });

    expect(mockMetalRate.create).toHaveBeenCalledWith({});
    expect(created.gold24k).toBe(6200);
  });
});
