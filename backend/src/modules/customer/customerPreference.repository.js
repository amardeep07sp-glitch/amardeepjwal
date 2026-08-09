import { CustomerPreference } from './customerPreference.model.js';

const POPULATE_FIELDS = [
  { path: 'preferredCategories', select: 'name slug' },
  { path: 'preferredBrands', select: 'name slug' },
];

export const customerPreferenceRepository = {
  findByCustomer(customerId) {
    return CustomerPreference.findOne({ customer: customerId }).populate(POPULATE_FIELDS);
  },

  upsert(customerId, data) {
    return CustomerPreference.findOneAndUpdate(
      { customer: customerId },
      { $set: { ...data, customer: customerId } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate(POPULATE_FIELDS);
  },
};
