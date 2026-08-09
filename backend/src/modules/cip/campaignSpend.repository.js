import { CampaignSpend } from './campaignSpend.model.js';

export const campaignSpendRepository = {
  findAll(filter = {}) {
    return CampaignSpend.find(filter).sort({ dateFrom: -1 });
  },

  findById(id) {
    return CampaignSpend.findById(id);
  },

  create(data) {
    return CampaignSpend.create(data);
  },

  deleteById(id) {
    return CampaignSpend.findByIdAndDelete(id);
  },

  async sumSpendForCampaign(utmCampaign, dateFrom, dateTo) {
    const filter = { utmCampaign };
    if (dateFrom || dateTo) {
      filter.dateFrom = {};
      if (dateTo) filter.dateFrom.$lte = new Date(dateTo);
    }
    const rows = await CampaignSpend.find(filter);
    return rows.reduce((sum, r) => sum + r.spend, 0);
  },
};
