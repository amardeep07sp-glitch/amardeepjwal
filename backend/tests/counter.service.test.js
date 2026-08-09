import { jest } from '@jest/globals';

const mockCounterRepo = {
  incrementAndGet: jest.fn(),
};

jest.unstable_mockModule('../src/modules/shared/counter.repository.js', () => ({
  counterRepository: mockCounterRepo,
}));

const { counterService } = await import('../src/modules/shared/counter.service.js');

beforeEach(() => {
  Object.values(mockCounterRepo).forEach((fn) => fn.mockReset());
});

describe('counterService.getNextSequence', () => {
  it('returns the raw sequence number when no prefix is given', async () => {
    mockCounterRepo.incrementAndGet.mockResolvedValue(7);

    const result = await counterService.getNextSequence('orderNumber');

    expect(result).toBe(7);
    expect(mockCounterRepo.incrementAndGet).toHaveBeenCalledWith('orderNumber');
  });

  it('formats with a prefix and zero-padded sequence', async () => {
    mockCounterRepo.incrementAndGet.mockResolvedValue(42);

    const result = await counterService.getNextSequence('orderNumber', { prefix: 'ORD', padLength: 6 });

    expect(result).toBe('ORD-000042');
  });

  it('respects a custom pad length', async () => {
    mockCounterRepo.incrementAndGet.mockResolvedValue(3);

    const result = await counterService.getNextSequence('invoiceNumber', { prefix: 'INV', padLength: 3 });

    expect(result).toBe('INV-003');
  });
});
