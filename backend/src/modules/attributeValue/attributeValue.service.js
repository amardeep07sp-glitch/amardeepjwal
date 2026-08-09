import { ApiError } from '../../utils/ApiError.js';
import { attributeValueRepository } from './attributeValue.repository.js';
import { serializeAttributeValue, serializeAttributeValueList } from './attributeValue.serializer.js';

const buildPaginationMeta = (page, limit, totalItems) => ({
  page,
  limit,
  totalItems,
  totalPages: Math.max(1, Math.ceil(totalItems / limit)),
});

export const attributeValueService = {
  async listValues(query) {
    const { page, limit, ...filters } = query;
    const { items, total } = await attributeValueRepository.findPaginated({ page, limit, ...filters });
    return { items: serializeAttributeValueList(items), meta: buildPaginationMeta(page, limit, total) };
  },

  async listValuesByAttribute(attributeId) {
    const values = await attributeValueRepository.findAllByAttribute(attributeId);
    return serializeAttributeValueList(values);
  },

  async getValueById(id) {
    const value = await attributeValueRepository.findById(id);
    if (!value) throw new ApiError(404, 'Attribute value not found');
    return serializeAttributeValue(value);
  },

  async createValue(data) {
    const value = await attributeValueRepository.create(data);
    return serializeAttributeValue(value);
  },

  async updateValue(id, data) {
    const value = await attributeValueRepository.updateById(id, data);
    if (!value) throw new ApiError(404, 'Attribute value not found');
    return serializeAttributeValue(value);
  },

  async deleteValue(id) {
    const value = await attributeValueRepository.deleteById(id);
    if (!value) throw new ApiError(404, 'Attribute value not found');
    return value;
  },
};
