import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { purchaseReturnService } from './purchaseReturn.service.js';
import { serializePurchaseReturn, serializePurchaseReturnList } from './purchaseReturn.serializer.js';

export const listReturns = asyncHandler(async (req, res) => {
  const result = await purchaseReturnService.listReturns(req.query);
  res.status(200).json(
    new ApiResponse(200, { items: serializePurchaseReturnList(result.items), meta: result.meta }, 'Purchase returns fetched successfully')
  );
});

export const listReturnsForPurchaseOrder = asyncHandler(async (req, res) => {
  const returns = await purchaseReturnService.listForPurchaseOrder(req.params.purchaseOrderId);
  res.status(200).json(new ApiResponse(200, serializePurchaseReturnList(returns), 'Purchase returns fetched successfully'));
});

export const requestReturn = asyncHandler(async (req, res) => {
  const purchaseReturn = await purchaseReturnService.requestReturn(req.params.purchaseOrderId, req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, serializePurchaseReturn(purchaseReturn), 'Purchase return requested successfully'));
});

export const approveReturn = asyncHandler(async (req, res) => {
  const purchaseReturn = await purchaseReturnService.approveReturn(req.params.id, req.user._id);
  res.status(200).json(new ApiResponse(200, serializePurchaseReturn(purchaseReturn), 'Purchase return approved successfully'));
});

export const rejectReturn = asyncHandler(async (req, res) => {
  const purchaseReturn = await purchaseReturnService.rejectReturn(req.params.id, req.user._id);
  res.status(200).json(new ApiResponse(200, serializePurchaseReturn(purchaseReturn), 'Purchase return rejected'));
});

export const completeReturn = asyncHandler(async (req, res) => {
  const purchaseReturn = await purchaseReturnService.completeReturn(req.params.id, req.user._id);
  res.status(200).json(new ApiResponse(200, serializePurchaseReturn(purchaseReturn), 'Purchase return completed successfully'));
});
