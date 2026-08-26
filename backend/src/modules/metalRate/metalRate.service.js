import { metalRateRepository } from './metalRate.repository.js';

export const metalRateService = {
  getRates() {
    return metalRateRepository.findSingleton();
  },

  updateRates(data, userId) {
    return metalRateRepository.updateSingleton({ ...data, updatedBy: userId });
  },
};
