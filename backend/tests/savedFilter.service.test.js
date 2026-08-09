import { jest } from '@jest/globals';

const mockSavedFilterRepo = { findByUserAndReport: jest.fn(), create: jest.fn(), findById: jest.fn(), deleteById: jest.fn() };

jest.unstable_mockModule('../src/modules/reports/savedFilter.repository.js', () => ({ savedFilterRepository: mockSavedFilterRepo }));

const { savedFilterService } = await import('../src/modules/reports/savedFilter.service.js');

beforeEach(() => {
  Object.values(mockSavedFilterRepo).forEach((fn) => fn.mockReset());
});

describe('savedFilterService.deleteSavedFilter', () => {
  it('rejects deleting a saved filter that belongs to a different user', async () => {
    mockSavedFilterRepo.findById.mockResolvedValue({ _id: 'f1', createdBy: 'u1' });

    await expect(savedFilterService.deleteSavedFilter('f1', 'u2')).rejects.toThrow('another user');
    expect(mockSavedFilterRepo.deleteById).not.toHaveBeenCalled();
  });

  it('deletes a saved filter owned by the requesting user', async () => {
    mockSavedFilterRepo.findById.mockResolvedValue({ _id: 'f1', createdBy: 'u1' });

    await savedFilterService.deleteSavedFilter('f1', 'u1');

    expect(mockSavedFilterRepo.deleteById).toHaveBeenCalledWith('f1');
  });

  it('throws 404 for a saved filter that does not exist', async () => {
    mockSavedFilterRepo.findById.mockResolvedValue(null);

    await expect(savedFilterService.deleteSavedFilter('missing', 'u1')).rejects.toThrow('not found');
  });
});
