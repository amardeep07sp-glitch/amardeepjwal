import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { orderShipmentService } from './orderShipment.service.js';
import { serializeOrderShipment, serializeOrderShipmentList } from './orderShipment.serializer.js';
import { serializeOrder } from './order.serializer.js';

export const listShipments = asyncHandler(async (req, res) => {
  const result = await orderShipmentService.listShipments(req.query);
  res.status(200).json(
    new ApiResponse(200, { items: serializeOrderShipmentList(result.items), meta: result.meta }, 'Shipments fetched successfully')
  );
});

export const listShipmentsForOrder = asyncHandler(async (req, res) => {
  const shipments = await orderShipmentService.listForOrder(req.params.orderId);
  res.status(200).json(new ApiResponse(200, serializeOrderShipmentList(shipments), 'Shipments fetched successfully'));
});

export const createShipment = asyncHandler(async (req, res) => {
  const shipment = await orderShipmentService.createShipment(req.params.orderId, req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, serializeOrderShipment(shipment), 'Shipment created successfully'));
});

export const updateTracking = asyncHandler(async (req, res) => {
  const shipment = await orderShipmentService.updateTracking(req.params.id, req.body, req.user._id);
  res.status(200).json(new ApiResponse(200, serializeOrderShipment(shipment), 'Shipment updated successfully'));
});

export const markShipmentDelivered = asyncHandler(async (req, res) => {
  const order = await orderShipmentService.markShipmentDelivered(req.params.id, req.user._id);
  res.status(200).json(new ApiResponse(200, serializeOrder(order), 'Shipment marked delivered'));
});
