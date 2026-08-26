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

  // Broadcast's own bulk-read (broadcast.service.js#processBroadcast) - one
  // query for every customer's opt-in flags rather than a per-customer
  // lookup. A customer with no CustomerPreference doc yet is treated as
  // opted-in-by-default by the caller, matching the schema's own defaults.
  findAllCommunicationPrefs() {
    return CustomerPreference.find({}).select('customer communicationPreference').lean();
  },
};
