import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { supplierPaymentService } from './supplierPayment.service.js';
import { serializeSupplierPayment, serializeSupplierPaymentList } from './supplierPayment.serializer.js';

export const listPaymentsForSupplier = asyncHandler(async (req, res) => {
  const payments = await supplierPaymentService.listForSupplier(req.params.supplierId);
  res.status(200).json(new ApiResponse(200, serializeSupplierPaymentList(payments), 'Payments fetched successfully'));
});

export const listPaymentsForPurchaseOrder = asyncHandler(async (req, res) => {
  const payments = await supplierPaymentService.listForPurchaseOrder(req.params.purchaseOrderId);
  res.status(200).json(new ApiResponse(200, serializeSupplierPaymentList(payments), 'Payments fetched successfully'));
});

export const recordPayment = asyncHandler(async (req, res) => {
  const payment = await supplierPaymentService.recordPayment(req.params.supplierId, req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, serializeSupplierPayment(payment), 'Payment recorded successfully'));
});

export const refundPayment = asyncHandler(async (req, res) => {
  const payment = await supplierPaymentService.refundPayment(req.params.id, req.user._id);
  res.status(200).json(new ApiResponse(200, serializeSupplierPayment(payment), 'Payment refunded successfully'));
});
