import { ApiError } from '../../utils/ApiError.js';
import { savedFilterRepository } from './savedFilter.repository.js';

export const savedFilterService = {
  listForReport(userId, reportKey) {
    return savedFilterRepository.findByUserAndReport(userId, reportKey);
  },

  createSavedFilter(data, userId) {
    return savedFilterRepository.create({ ...data, createdBy: userId });
  },

  async deleteSavedFilter(id, userId) {
    const existing = await savedFilterRepository.findById(id);
    if (!existing) throw new ApiError(404, 'Saved filter not found');
    if (String(existing.createdBy) !== String(userId)) throw new ApiError(403, 'Cannot delete another user\'s saved filter');
    await savedFilterRepository.deleteById(id);
  },
};
