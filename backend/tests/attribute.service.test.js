import { jest } from '@jest/globals';

const mockAttributeRepo = {
  findPaginated: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  updateById: jest.fn(),
  deleteById: jest.fn(),
  countByGroup: jest.fn(),
};

const mockValueRepo = {
  countByAttribute: jest.fn(),
};

jest.unstable_mockModule('../src/modules/attribute/attribute.repository.js', () => ({
  attributeRepository: mockAttributeRepo,
}));

jest.unstable_mockModule('../src/modules/attributeValue/attributeValue.repository.js', () => ({
  attributeValueRepository: mockValueRepo,
}));

const { attributeService } = await import('../src/modules/attribute/attribute.service.js');

beforeEach(() => {
  Object.values(mockAttributeRepo).forEach((fn) => fn.mockReset());
  Object.values(mockValueRepo).forEach((fn) => fn.mockReset());
});

describe('attributeService.deleteAttribute', () => {
  it('blocks deletion when values are still attached', async () => {
    mockValueRepo.countByAttribute.mockResolvedValue(2);

    await expect(attributeService.deleteAttribute('a1')).rejects.toThrow(
      'Cannot delete an attribute that still has values attached to it'
    );
    expect(mockAttributeRepo.deleteById).not.toHaveBeenCalled();
  });

  it('deletes when no values are attached', async () => {
    mockValueRepo.countByAttribute.mockResolvedValue(0);
    mockAttributeRepo.deleteById.mockResolvedValue({ _id: 'a1' });

    await attributeService.deleteAttribute('a1');

    expect(mockAttributeRepo.deleteById).toHaveBeenCalledWith('a1');
  });

  it('throws 404 when the attribute does not exist on delete', async () => {
    mockValueRepo.countByAttribute.mockResolvedValue(0);
    mockAttributeRepo.deleteById.mockResolvedValue(null);

    await expect(attributeService.deleteAttribute('missing')).rejects.toThrow('Attribute not found');
  });
});
