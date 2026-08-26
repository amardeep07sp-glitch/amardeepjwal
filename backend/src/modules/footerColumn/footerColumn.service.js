import { ApiError } from '../../utils/ApiError.js';
import { footerColumnRepository } from './footerColumn.repository.js';

export const footerColumnService = {
  listColumns() {
    return footerColumnRepository.findAll();
  },

  listPublicColumns() {
    return footerColumnRepository.findActive();
  },

  createColumn(data) {
    return footerColumnRepository.create(data);
  },

  async updateColumn(id, data) {
    const column = await footerColumnRepository.updateById(id, data);
    if (!column) throw new ApiError(404, 'Footer column not found');
    return column;
  },

  async deleteColumn(id) {
    const column = await footerColumnRepository.deleteById(id);
    if (!column) throw new ApiError(404, 'Footer column not found');
    return column;
  },
};
