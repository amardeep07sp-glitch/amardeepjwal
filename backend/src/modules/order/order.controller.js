import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { orderService } from './order.service.js';
import { serializeOrder, serializeOrderList } from './order.serializer.js';
import { serializeOrderItemList } from './orderItem.serializer.js';
import { serializeTimelineList } from './orderTimeline.serializer.js';
import { serializeActivityList } from './orderActivity.serializer.js';

const requestContext = (req) => ({
  userId: req.user._id,
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'] || '',
});

export const listOrders = asyncHandler(async (req, res) => {
  const result = await orderService.listOrders(req.query);
  res.status(200).json(
    new ApiResponse(200, { items: serializeOrderList(result.items), meta: result.meta }, 'Orders fetched successfully')
  );
});

export const getOrderById = asyncHandler(async (req, res) => {
  const { order, items } = await orderService.getOrderById(req.params.id);
  res.status(200).json(
    new ApiResponse(200, { order: serializeOrder(order), items: serializeOrderItemList(items) }, 'Order fetched successfully')
  );
});

export const getOrderTimeline = asyncHandler(async (req, res) => {
  const timeline = await orderService.getTimeline(req.params.id);
  res.status(200).json(new ApiResponse(200, serializeTimelineList(timeline), 'Order timeline fetched successfully'));
});

export const getOrderActivity = asyncHandler(async (req, res) => {
  const activity = await orderService.getActivity(req.params.id);
  res.status(200).json(new ApiResponse(200, serializeActivityList(activity), 'Order activity fetched successfully'));
});

export const lookupByBarcode = asyncHandler(async (req, res) => {
  const result = await orderService.lookupByBarcode(req.params.value);
  res.status(200).json(new ApiResponse(200, result, 'Barcode resolved successfully'));
});

export const createOrder = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, serializeOrder(order), 'Order created successfully'));
});

export const submitOrder = asyncHandler(async (req, res) => {
  const order = await orderService.submitOrder(req.params.id, req.user._id);
  res.status(200).json(new ApiResponse(200, serializeOrder(order), 'Order submitted successfully'));
});

export const confirmOrder = asyncHandler(async (req, res) => {
  const order = await orderService.confirmOrder(req.params.id, requestContext(req));
  res.status(200).json(new ApiResponse(200, serializeOrder(order), 'Order confirmed successfully'));
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const { order } = await orderService.cancelOrder(req.params.id, { ...requestContext(req), reason: req.body.reason });
  res.status(200).json(new ApiResponse(200, serializeOrder(order), 'Order cancelled successfully'));
});

export const packOrder = asyncHandler(async (req, res) => {
  const order = await orderService.packOrder(req.params.id, { userId: req.user._id, itemIds: req.body.itemIds });
  res.status(200).json(new ApiResponse(200, serializeOrder(order), 'Order packed successfully'));
});

export const markReadyToShip = asyncHandler(async (req, res) => {
  const order = await orderService.markReadyToShip(req.params.id, req.user._id);
  res.status(200).json(new ApiResponse(200, serializeOrder(order), 'Order marked ready to ship'));
});

export const markDelivered = asyncHandler(async (req, res) => {
  const order = await orderService.markDelivered(req.params.id, { userId: req.user._id, itemIds: req.body.itemIds });
  res.status(200).json(new ApiResponse(200, serializeOrder(order), 'Order marked delivered'));
});

export const completeOrder = asyncHandler(async (req, res) => {
  const order = await orderService.completeOrder(req.params.id, req.user._id);
  res.status(200).json(new ApiResponse(200, serializeOrder(order), 'Order completed successfully'));
});

export const getDashboardTotals = asyncHandler(async (req, res) => {
  const totals = await orderService.getDashboardTotals();
  res.status(200).json(new ApiResponse(200, totals, 'Dashboard totals fetched successfully'));
});

export const getSalesTrend = asyncHandler(async (req, res) => {
  const trend = await orderService.getSalesTrend(Number(req.query.days) || 14);
  res.status(200).json(new ApiResponse(200, trend, 'Sales trend fetched successfully'));
});

export const getStatusDistribution = asyncHandler(async (req, res) => {
  const distribution = await orderService.getStatusDistribution();
  res.status(200).json(new ApiResponse(200, distribution, 'Status distribution fetched successfully'));
});

export const getPaymentBreakdown = asyncHandler(async (req, res) => {
  const breakdown = await orderService.getPaymentBreakdown();
  res.status(200).json(new ApiResponse(200, breakdown, 'Payment breakdown fetched successfully'));
});

export const exportOrders = asyncHandler(async (req, res) => {
  const { format = 'csv', ...filter } = req.query;

  if (format === 'excel') {
    const buffer = await orderService.exportOrdersExcel(filter);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="orders-export-${Date.now()}.xlsx"`);
    res.send(buffer);
    return;
  }

  const csv = await orderService.exportOrdersCsv(filter);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="orders-export-${Date.now()}.csv"`);
  res.send(csv);
});
