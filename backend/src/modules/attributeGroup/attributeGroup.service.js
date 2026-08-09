import { ApiError } from '../../utils/ApiError.js';
import { attributeGroupRepository } from './attributeGroup.repository.js';
import { attributeRepository } from '../attribute/attribute.repository.js';
import { serializeAttributeGroup, serializeAttributeGroupList } from './attributeGroup.serializer.js';

const buildPaginationMeta = (page, limit, totalItems) => ({
  page,
  limit,
  totalItems,
  totalPages: Math.max(1, Math.ceil(totalItems / limit)),
});

export const attributeGroupService = {
  async listGroups(query) {
    const { page, limit, ...filters } = query;
    const { items, total } = await attributeGroupRepository.findPaginated({ page, limit, ...filters });
    return { items: serializeAttributeGroupList(items), meta: buildPaginationMeta(page, limit, total) };
  },

  async listAllActiveGroups() {
    const groups = await attributeGroupRepository.findAll();
    return serializeAttributeGroupList(groups);
  },

  async getGroupById(id) {
    const group = await attributeGroupRepository.findById(id);
    if (!group) throw new ApiError(404, 'Attribute group not found');
    return serializeAttributeGroup(group);
  },

  async createGroup(data) {
    const group = await attributeGroupRepository.create(data);
    return serializeAttributeGroup(group);
  },

  async updateGroup(id, data) {
    const group = await attributeGroupRepository.updateById(id, data);
    if (!group) throw new ApiError(404, 'Attribute group not found');
    return serializeAttributeGroup(group);
  },

  async deleteGroup(id) {
    const attributeCount = await attributeRepository.countByGroup(id);
    if (attributeCount > 0) {
      throw new ApiError(409, 'Cannot delete a group that still has attributes attached to it');
    }
    const group = await attributeGroupRepository.deleteById(id);
    if (!group) throw new ApiError(404, 'Attribute group not found');
    return group;
  },
};
