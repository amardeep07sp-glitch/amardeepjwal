import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { loyaltyService } from './loyalty.service.js';
import { serializeLoyalty, serializeLoyaltyLedgerEntry, serializeLoyaltyLedgerList } from './loyalty.serializer.js';

export const getLoyalty = asyncHandler(async (req, res) => {
  const loyalty = await loyaltyService.getLoyalty(req.params.customerId);
  res.status(200).json(new ApiResponse(200, serializeLoyalty(loyalty), 'Loyalty fetched successfully'));
});

export const getLoyaltyLedger = asyncHandler(async (req, res) => {
  const result = await loyaltyService.getLedger(req.params.customerId, req.query);
  res.status(200).json(
    new ApiResponse(200, { items: serializeLoyaltyLedgerList(result.items), meta: result.meta }, 'Loyalty ledger fetched successfully')
  );
});

export const recordLoyaltyTransaction = asyncHandler(async (req, res) => {
  const entry = await loyaltyService.recordTransaction({
    customerId: req.params.customerId,
    ...req.body,
    performedBy: req.user._id,
  });
  res.status(201).json(new ApiResponse(201, serializeLoyaltyLedgerEntry(entry), 'Loyalty transaction recorded successfully'));
});
