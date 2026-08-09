import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { orderReturnService } from './orderReturn.service.js';
import { serializeOrderReturn, serializeOrderReturnList } from './orderReturn.serializer.js';

export const listReturns = asyncHandler(async (req, res) => {
  const result = await orderReturnService.listReturns(req.query);
  res.status(200).json(
    new ApiResponse(200, { items: serializeOrderReturnList(result.items), meta: result.meta }, 'Returns fetched successfully')
  );
});

export const listReturnsForOrder = asyncHandler(async (req, res) => {
  const returns = await orderReturnService.listForOrder(req.params.orderId);
  res.status(200).json(new ApiResponse(200, serializeOrderReturnList(returns), 'Returns fetched successfully'));
});

export const requestReturn = asyncHandler(async (req, res) => {
  const orderReturn = await orderReturnService.requestReturn(req.params.orderId, req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, serializeOrderReturn(orderReturn), 'Return requested successfully'));
});

const makeTransitionHandler = (serviceMethod, message) =>
  asyncHandler(async (req, res) => {
    const orderReturn = await orderReturnService[serviceMethod](req.params.id, req.user._id);
    res.status(200).json(new ApiResponse(200, serializeOrderReturn(orderReturn), message));
  });

export const approveReturn = makeTransitionHandler('approveReturn', 'Return approved');
export const rejectReturn = makeTransitionHandler('rejectReturn', 'Return rejected');
export const schedulePickup = makeTransitionHandler('schedulePickup', 'Pickup scheduled');
export const markReceived = makeTransitionHandler('markReceived', 'Return marked received');
export const markInspected = makeTransitionHandler('markInspected', 'Return marked inspected');
export const acceptReturn = makeTransitionHandler('acceptReturn', 'Return accepted');
export const restockReturn = makeTransitionHandler('restockReturn', 'Return restocked');
