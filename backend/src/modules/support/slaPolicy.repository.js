import { SlaPolicy } from './slaPolicy.model.js';
import { SLA_POLICY_DEFAULTS } from './support.constants.js';

const defaultTiers = () => Object.entries(SLA_POLICY_DEFAULTS).map(([priority, v]) => ({ priority, ...v }));

export const slaPolicyRepository = {
  async getOrCreate() {
    const existing = await SlaPolicy.findOne();
    if (existing) return existing;
    return SlaPolicy.create({ tiers: defaultTiers() });
  },

  async update(tiers, userId) {
    const existing = await SlaPolicy.findOne();
    if (existing) {
      existing.tiers = tiers;
      existing.updatedBy = userId;
      return existing.save();
    }
    return SlaPolicy.create({ tiers, updatedBy: userId });
  },
};
