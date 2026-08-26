import { ApiError } from '../../utils/ApiError.js';
import { campaignRepository } from './campaign.repository.js';
import { CAMPAIGN_STATUSES } from './campaign.constants.js';

const buildPaginationMeta = (page, limit, totalItems) => ({
  page,
  limit,
  totalItems,
  totalPages: Math.max(1, Math.ceil(totalItems / limit)),
});

// Manual states (someone explicitly set them) always win. Everything else
// is derived fresh from real dates/budget every time this is called -
// never trusted as a stored fact, so a campaign can't silently keep
// showing ACTIVE after its endAt has passed just because nobody updated
// a field.
export function computeEffectiveStatus(campaign) {
  if ([CAMPAIGN_STATUSES.DRAFT, CAMPAIGN_STATUSES.PAUSED, CAMPAIGN_STATUSES.CANCELLED, CAMPAIGN_STATUSES.ARCHIVED].includes(campaign.status)) {
    return campaign.status;
  }
  if (campaign.budget != null && campaign.spentBudget >= campaign.budget) return CAMPAIGN_STATUSES.EXHAUSTED;
  const now = new Date();
  if (now < campaign.startAt) return CAMPAIGN_STATUSES.SCHEDULED;
  if (now > campaign.endAt) return CAMPAIGN_STATUSES.EXPIRED;
  return CAMPAIGN_STATUSES.ACTIVE;
}

export const campaignService = {
  computeEffectiveStatus,

  async listCampaigns(query) {
    const { page, limit, ...filters } = query;
    const { items, total } = await campaignRepository.findPaginated({ page, limit, ...filters });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  },

  async getCampaignById(id) {
    const campaign = await campaignRepository.findById(id);
    if (!campaign) throw new ApiError(404, 'Campaign not found');
    return campaign;
  },

  async createCampaign(data, userId) {
    if (data.startAt >= data.endAt) throw new ApiError(400, 'End date must be after start date');
    return campaignRepository.create({ ...data, createdBy: userId, updatedBy: userId });
  },

  async updateCampaign(id, data, userId) {
    const existing = await campaignRepository.findById(id);
    if (!existing) throw new ApiError(404, 'Campaign not found');
    const startAt = data.startAt ?? existing.startAt;
    const endAt = data.endAt ?? existing.endAt;
    if (startAt >= endAt) throw new ApiError(400, 'End date must be after start date');

    const campaign = await campaignRepository.updateById(id, { ...data, updatedBy: userId });
    if (!campaign) throw new ApiError(404, 'Campaign not found');
    return campaign;
  },

  async deleteCampaign(id) {
    const deleted = await campaignRepository.deleteById(id);
    if (!deleted) throw new ApiError(404, 'Campaign not found');
  },

  async setStatus(id, status, userId) {
    const campaign = await campaignRepository.updateById(id, { status, updatedBy: userId });
    if (!campaign) throw new ApiError(404, 'Campaign not found');
    return campaign;
  },
};
