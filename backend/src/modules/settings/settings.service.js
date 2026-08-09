import { settingsRepository } from './settings.repository.js';

export const settingsService = {
  getSettings() {
    return settingsRepository.findSingleton();
  },

  updateSettings(data) {
    return settingsRepository.updateSingleton(data);
  },
};
