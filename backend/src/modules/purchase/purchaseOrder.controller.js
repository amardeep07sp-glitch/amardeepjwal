import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { purchaseOrderService } from './purchaseOrder.service.js';
import { serializePurchaseOrder, serializePurchaseOrderList } from './purchaseOrder.serializer.js';
import { serializePurchaseItemList } from './purchaseItem.serializer.js';

export const listPurchaseOrders = asyncHandler(async (req, res) => {
  const result = await purchaseOrderService.listPurchaseOrders(req.query);
  res.status(200).json(
    new ApiResponse(200, { items: serializePurchaseOrderList(result.items), meta: result.meta }, 'Purchase orders fetched successfully')
  );
});

export const getPurchaseOrderById = asyncHandler(async (req, res) => {
  const { purchaseOrder, items } = await purchaseOrderService.getPurchaseOrderById(req.params.id);
  res.status(200).json(
    new ApiResponse(
      200,
      { purchaseOrder: serializePurchaseOrder(purchaseOrder), items: serializePurchaseItemList(items) },
      'Purchase order fetched successfully'
    )
  );
});

export const createPurchaseOrder = asyncHandler(async (req, res) => {
  const purchaseOrder = await purchaseOrderService.createPurchaseOrder(req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, serializePurchaseOrder(purchaseOrder), 'Purchase order created successfully'));
});

export const submitForApproval = asyncHandler(async (req, res) => {
  const purchaseOrder = await purchaseOrderService.submitForApproval(req.params.id, req.user._id);
  res.status(200).json(new ApiResponse(200, serializePurchaseOrder(purchaseOrder), 'Purchase order submitted for approval'));
});

export const approvePurchaseOrder = asyncHandler(async (req, res) => {
  const purchaseOrder = await purchaseOrderService.approvePurchaseOrder(req.params.id, req.user._id);
  res.status(200).json(new ApiResponse(200, serializePurchaseOrder(purchaseOrder), 'Purchase order approved successfully'));
});

export const markOrdered = asyncHandler(async (req, res) => {
  const purchaseOrder = await purchaseOrderService.markOrdered(req.params.id, req.user._id);
  res.status(200).json(new ApiResponse(200, serializePurchaseOrder(purchaseOrder), 'Purchase order marked as ordered'));
});

export const cancelPurchaseOrder = asyncHandler(async (req, res) => {
  const purchaseOrder = await purchaseOrderService.cancelPurchaseOrder(req.params.id, { userId: req.user._id, reason: req.body.reason });
  res.status(200).json(new ApiResponse(200, serializePurchaseOrder(purchaseOrder), 'Purchase order cancelled successfully'));
});

export const getDashboardTotals = asyncHandler(async (req, res) => {
  const totals = await purchaseOrderService.getDashboardTotals();
  res.status(200).json(new ApiResponse(200, totals, 'Dashboard totals fetched successfully'));
});

export const getPurchaseTrend = asyncHandler(async (req, res) => {
  const trend = await purchaseOrderService.getPurchaseTrend(Number(req.query.days) || 14);
  res.status(200).json(new ApiResponse(200, trend, 'Purchase trend fetched successfully'));
});

export const getSupplierPerformance = asyncHandler(async (req, res) => {
  const performance = await purchaseOrderService.getSupplierPerformance();
  res.status(200).json(new ApiResponse(200, performance, 'Supplier performance fetched successfully'));
});
