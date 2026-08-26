import { MetalRate, METAL_FIELDS } from './metalRate.model.js';

const previousFieldName = (field) => `previous${field[0].toUpperCase()}${field.slice(1)}`;

export const metalRateRepository = {
  async findSingleton() {
    const existing = await MetalRate.findOne();
    if (existing) return existing;
    return MetalRate.create({});
  },

  async updateSingleton(data) {
    const rate = await MetalRate.findOne().then((doc) => doc || MetalRate.create({}));

    // Snapshot the old value as "previous" only for fields that are
    // actually changing - so a save that doesn't touch a metal's rate
    // doesn't wipe out its existing trend.
    for (const field of METAL_FIELDS) {
      if (data[field] !== undefined && data[field] !== rate[field]) {
        rate[previousFieldName(field)] = rate[field];
      }
    }

    Object.assign(rate, data);
    await rate.save();
    return rate;
  },
};
