import { ApiError } from '../../utils/ApiError.js';
import { campaignSpendRepository } from './campaignSpend.repository.js';

export const campaignSpendService = {
  listSpend(filter) {
    return campaignSpendRepository.findAll(filter);
  },

  createSpend(data, userId) {
    return campaignSpendRepository.create({ ...data, createdBy: userId });
  },

  async deleteSpend(id) {
    const deleted = await campaignSpendRepository.deleteById(id);
    if (!deleted) throw new ApiError(404, 'Campaign spend record not found');
  },
};
