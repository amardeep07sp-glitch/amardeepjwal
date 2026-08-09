import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { customerReferralService } from './customerReferral.service.js';
import { serializeReferral, serializeReferralList } from './customerReferral.serializer.js';

export const listReferrals = asyncHandler(async (req, res) => {
  const result = await customerReferralService.listReferrals(req.query);
  res.status(200).json(
    new ApiResponse(200, { items: serializeReferralList(result.items), meta: result.meta }, 'Referrals fetched successfully')
  );
});

export const listReferralsForReferrer = asyncHandler(async (req, res) => {
  const referrals = await customerReferralService.listForReferrer(req.params.referrerId);
  res.status(200).json(new ApiResponse(200, serializeReferralList(referrals), 'Referrals fetched successfully'));
});

export const completeReferral = asyncHandler(async (req, res) => {
  const referral = await customerReferralService.completeReferral(req.params.id);
  res.status(200).json(new ApiResponse(200, serializeReferral(referral), 'Referral marked completed'));
});

export const rewardReferral = asyncHandler(async (req, res) => {
  const referral = await customerReferralService.rewardReferral(req.params.id, req.body, req.user._id);
  res.status(200).json(new ApiResponse(200, serializeReferral(referral), 'Referral rewarded successfully'));
});
