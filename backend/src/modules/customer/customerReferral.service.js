import { ApiError } from '../../utils/ApiError.js';
import { customerReferralRepository } from './customerReferral.repository.js';
import { loyaltyService } from './loyalty.service.js';
import { REFERRAL_STATUSES, LOYALTY_TXN_TYPES } from './customer.constants.js';

const buildPaginationMeta = (page, limit, totalItems) => ({
  page,
  limit,
  totalItems,
  totalPages: Math.max(1, Math.ceil(totalItems / limit)),
});

export const customerReferralService = {
  async listReferrals(query) {
    const { page, limit, ...filters } = query;
    const { items, total } = await customerReferralRepository.findPaginated({ page, limit, ...filters });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  },

  listForReferrer(referrerId) {
    return customerReferralRepository.findByReferrer(referrerId);
  },

  // Called from customer.service.js#createCustomer when a new customer was
  // referred by an existing one (via referral code entered at signup).
  createReferral(referrerId, referredCustomerId) {
    return customerReferralRepository.create({ referrer: referrerId, referredCustomer: referredCustomerId });
  },

  async completeReferral(id) {
    const referral = await customerReferralRepository.updateById(id, { status: REFERRAL_STATUSES.COMPLETED });
    if (!referral) throw new ApiError(404, 'Referral not found');
    return referral;
  },

  // The one step that actually touches Loyalty - credits the referrer via
  // loyaltyService.recordTransaction (never the ledger/model directly),
  // same discipline as every other Loyalty-touching caller.
  async rewardReferral(id, { rewardPoints }, userId) {
    const referral = await customerReferralRepository.findById(id);
    if (!referral) throw new ApiError(404, 'Referral not found');
    if (referral.status !== REFERRAL_STATUSES.COMPLETED) {
      throw new ApiError(400, 'Only a completed referral can be rewarded');
    }

    await loyaltyService.recordTransaction({
      customerId: referral.referrer,
      type: LOYALTY_TXN_TYPES.EARN,
      points: rewardPoints,
      reason: 'Referral reward',
      referenceType: 'customer_referral',
      referenceId: referral._id,
      performedBy: userId,
    });

    referral.status = REFERRAL_STATUSES.REWARDED;
    referral.rewardPoints = rewardPoints;
    referral.rewardedAt = new Date();
    await referral.save();

    return referral;
  },
};
