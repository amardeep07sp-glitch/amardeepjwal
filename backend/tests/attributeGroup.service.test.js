import { jest } from '@jest/globals';

const mockGroupRepo = {
  findPaginated: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  updateById: jest.fn(),
  deleteById: jest.fn(),
};

const mockAttributeRepo = {
  countByGroup: jest.fn(),
};

jest.unstable_mockModule('../src/modules/attributeGroup/attributeGroup.repository.js', () => ({
  attributeGroupRepository: mockGroupRepo,
}));

jest.unstable_mockModule('../src/modules/attribute/attribute.repository.js', () => ({
  attributeRepository: mockAttributeRepo,
}));

const { attributeGroupService } = await import('../src/modules/attributeGroup/attributeGroup.service.js');

beforeEach(() => {
  Object.values(mockGroupRepo).forEach((fn) => fn.mockReset());
  Object.values(mockAttributeRepo).forEach((fn) => fn.mockReset());
});

describe('attributeGroupService.deleteGroup', () => {
  it('blocks deletion when attributes are still attached', async () => {
    mockAttributeRepo.countByGroup.mockResolvedValue(3);

    await expect(attributeGroupService.deleteGroup('g1')).rejects.toThrow(
      'Cannot delete a group that still has attributes attached to it'
    );
    expect(mockGroupRepo.deleteById).not.toHaveBeenCalled();
  });

  it('deletes when no attributes are attached', async () => {
    mockAttributeRepo.countByGroup.mockResolvedValue(0);
    mockGroupRepo.deleteById.mockResolvedValue({ _id: 'g1' });

    await attributeGroupService.deleteGroup('g1');

    expect(mockGroupRepo.deleteById).toHaveBeenCalledWith('g1');
  });

  it('throws 404 when the group does not exist on delete', async () => {
    mockAttributeRepo.countByGroup.mockResolvedValue(0);
    mockGroupRepo.deleteById.mockResolvedValue(null);

    await expect(attributeGroupService.deleteGroup('missing')).rejects.toThrow('Attribute group not found');
  });
});
