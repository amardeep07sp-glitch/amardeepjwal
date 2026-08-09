import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { orderRefundService } from './orderRefund.service.js';
import { serializeOrderRefund, serializeOrderRefundList } from './orderRefund.serializer.js';

export const listRefunds = asyncHandler(async (req, res) => {
  const result = await orderRefundService.listRefunds(req.query);
  res.status(200).json(
    new ApiResponse(200, { items: serializeOrderRefundList(result.items), meta: result.meta }, 'Refunds fetched successfully')
  );
});

export const listRefundsForOrder = asyncHandler(async (req, res) => {
  const refunds = await orderRefundService.listForOrder(req.params.orderId);
  res.status(200).json(new ApiResponse(200, serializeOrderRefundList(refunds), 'Refunds fetched successfully'));
});

export const createRefund = asyncHandler(async (req, res) => {
  const refund = await orderRefundService.createRefund(req.params.orderId, req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, serializeOrderRefund(refund), 'Refund created successfully'));
});

export const processRefund = asyncHandler(async (req, res) => {
  const refund = await orderRefundService.processRefund(req.params.id, req.body, req.user._id);
  res.status(200).json(new ApiResponse(200, serializeOrderRefund(refund), 'Refund processed successfully'));
});

export const failRefund = asyncHandler(async (req, res) => {
  const refund = await orderRefundService.failRefund(req.params.id, req.user._id, req.body.reason);
  res.status(200).json(new ApiResponse(200, serializeOrderRefund(refund), 'Refund marked failed'));
});
