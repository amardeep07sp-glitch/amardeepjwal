import { ApiError } from '../../utils/ApiError.js';
import { attributeRepository } from './attribute.repository.js';
import { attributeValueRepository } from '../attributeValue/attributeValue.repository.js';
import { serializeAttribute, serializeAttributeList } from './attribute.serializer.js';

const buildPaginationMeta = (page, limit, totalItems) => ({
  page,
  limit,
  totalItems,
  totalPages: Math.max(1, Math.ceil(totalItems / limit)),
});

export const attributeService = {
  async listAttributes(query) {
    const { page, limit, ...filters } = query;
    const { items, total } = await attributeRepository.findPaginated({ page, limit, ...filters });
    return { items: serializeAttributeList(items), meta: buildPaginationMeta(page, limit, total) };
  },

  async listAllActiveAttributes(filters = {}) {
    const attributes = await attributeRepository.findAll(filters);
    return serializeAttributeList(attributes);
  },

  async getAttributeById(id) {
    const attribute = await attributeRepository.findById(id);
    if (!attribute) throw new ApiError(404, 'Attribute not found');
    return serializeAttribute(attribute);
  },

  async createAttribute(data) {
    const attribute = await attributeRepository.create(data);
    return serializeAttribute(attribute);
  },

  async updateAttribute(id, data) {
    const attribute = await attributeRepository.updateById(id, data);
    if (!attribute) throw new ApiError(404, 'Attribute not found');
    return serializeAttribute(attribute);
  },

  async deleteAttribute(id) {
    const valueCount = await attributeValueRepository.countByAttribute(id);
    if (valueCount > 0) {
      throw new ApiError(409, 'Cannot delete an attribute that still has values attached to it');
    }
    const attribute = await attributeRepository.deleteById(id);
    if (!attribute) throw new ApiError(404, 'Attribute not found');
    return attribute;
  },
};
