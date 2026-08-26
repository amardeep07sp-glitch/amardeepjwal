import { computeEffectiveStatus } from './campaign.service.js';

export const serializeCampaign = (campaign) => {
  const plain = typeof campaign.toObject === 'function' ? campaign.toObject() : campaign;

  return {
    id: plain._id,
    name: plain.name,
    slug: plain.slug,
    description: plain.description,
    campaignType: plain.campaignType,
    status: plain.status,
    effectiveStatus: computeEffectiveStatus(plain),
    startAt: plain.startAt,
    endAt: plain.endAt,
    priority: plain.priority,
    budget: plain.budget,
    spentBudget: plain.spentBudget,
    budgetRemaining: plain.budget != null ? Math.max(0, plain.budget - plain.spentBudget) : null,
    tags: plain.tags ?? [],
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const serializeCampaignList = (campaigns) => campaigns.map(serializeCampaign);
