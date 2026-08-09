import { TaxRate } from './taxRate.model.js';

export const taxRateRepository = {
  findAll(filter = {}) {
    return TaxRate.find(filter).sort({ rate: 1 });
  },

  findById(id) {
    return TaxRate.findById(id);
  },

  findDefault() {
    return TaxRate.findOne({ isDefault: true, active: true });
  },

  create(data) {
    return TaxRate.create(data);
  },

  async updateById(id, data) {
    const existing = await TaxRate.findById(id);
    if (!existing) return null;
    Object.assign(existing, data);
    return existing.save();
  },

  deleteById(id) {
    return TaxRate.findByIdAndDelete(id);
  },

  // Only one TaxRate may be the default at a time - unsets every other
  // one's flag before the caller sets the new one, single-transaction-free
  // since this only ever runs from an admin action, not a hot financial path.
  unsetAllDefaults() {
    return TaxRate.updateMany({ isDefault: true }, { $set: { isDefault: false } });
  },
};
