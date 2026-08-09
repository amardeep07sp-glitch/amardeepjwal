import { customerPreferenceRepository } from './customerPreference.repository.js';

export const customerPreferenceService = {
  async getForCustomer(customerId) {
    const preference = await customerPreferenceRepository.findByCustomer(customerId);
    // Never 404s - a customer with no preferences saved yet just gets an
    // upsert-on-write default record when the UI first saves one.
    return preference ?? { customer: customerId, preferredCategories: [], preferredBrands: [], communicationPreference: {} };
  },

  updatePreference(customerId, data) {
    return customerPreferenceRepository.upsert(customerId, data);
  },
};
