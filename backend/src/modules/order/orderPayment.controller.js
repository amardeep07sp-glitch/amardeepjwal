import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { orderPaymentService } from './orderPayment.service.js';
import { razorpayService } from './razorpay.service.js';
import { serializeOrderPayment, serializeOrderPaymentList } from './orderPayment.serializer.js';

export const listPaymentsForOrder = asyncHandler(async (req, res) => {
  const payments = await orderPaymentService.listForOrder(req.params.orderId);
  res.status(200).json(new ApiResponse(200, serializeOrderPaymentList(payments), 'Payments fetched successfully'));
});

export const recordManualPayment = asyncHandler(async (req, res) => {
  const payment = await orderPaymentService.recordManualPayment(req.params.orderId, req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, serializeOrderPayment(payment), 'Payment recorded successfully'));
});

export const initiateRazorpayPayment = asyncHandler(async (req, res) => {
  const result = await orderPaymentService.initiateRazorpayPayment(req.params.orderId, req.user._id);
  res.status(201).json(new ApiResponse(201, result, 'Razorpay order created successfully'));
});

export const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const payment = await orderPaymentService.verifyRazorpayPayment(req.body, req.user._id);
  res.status(200).json(new ApiResponse(200, serializeOrderPayment(payment), 'Payment verified successfully'));
});

// No `protect` middleware - Razorpay itself calls this, authenticated only
// by its HMAC signature over the raw request body (see app.js's
// express.json({ verify }) for where req.rawBody comes from).
export const razorpayWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const isValid = razorpayService.verifyWebhookSignature(req.rawBody, signature);
  if (!isValid) throw new ApiError(400, 'Invalid webhook signature');

  await orderPaymentService.handleWebhookEvent(req.body);
  res.status(200).json(new ApiResponse(200, null, 'Webhook processed'));
});
