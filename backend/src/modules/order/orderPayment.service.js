import mongoose from 'mongoose';
import { ApiError } from '../../utils/ApiError.js';
import { orderRepository } from './order.repository.js';
import { orderPaymentRepository } from './orderPayment.repository.js';
import { orderAudit } from './order.audit.js';
import { orderNotifications } from './order.notifications.js';
import { razorpayService } from './razorpay.service.js';
import { accountingEvents } from '../accounting/accountingEvents.service.js';
import { PAYMENT_STATUSES, ORDER_TIMELINE_EVENTS } from './order.constants.js';

// Recomputes Order.paymentStatus from the sum of its 'paid' OrderPayment
// rows vs grandTotal - the single place this rollup is derived, so every
// payment path (manual, Razorpay webhook, Razorpay verify-callback) stays
// consistent with each other by construction.
async function recomputeOrderPaymentStatus(orderId, session) {
  const order = await orderRepository.findRawById(orderId, session);
  const totalPaid = await orderPaymentRepository.sumPaidByOrder(orderId, session);

  if (totalPaid <= 0) order.paymentStatus = PAYMENT_STATUSES.PENDING;
  else if (totalPaid < order.grandTotal) order.paymentStatus = PAYMENT_STATUSES.PARTIALLY_PAID;
  else order.paymentStatus = PAYMENT_STATUSES.PAID;

  await order.save({ session: session ?? undefined });
  return order;
}

export const orderPaymentService = {
  listForOrder(orderId) {
    return orderPaymentRepository.findByOrder(orderId);
  },

  // Cash/UPI/Card/Bank Transfer/Wallet/COD - an admin/POS operator is
  // physically confirming money already received, so the row is recorded
  // as paid immediately (no separate "authorized" step for manual methods).
  async recordManualPayment(orderId, { method, amount, transactionReference }, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const order = await orderRepository.findRawById(orderId, session);
      if (!order) throw new ApiError(404, 'Order not found');

      const payment = await orderPaymentRepository.create(
        {
          order: orderId,
          method,
          amount,
          status: PAYMENT_STATUSES.PAID,
          transactionReference: transactionReference || '',
          paidAt: new Date(),
          recordedBy: userId,
        },
        session
      );

      await recomputeOrderPaymentStatus(orderId, session);
      order.paymentMethod = method;
      await order.save({ session });

      await accountingEvents.recordSalePayment(
        { orderId, customerId: order.customer, orderNumber: order.orderNumber, method, amount, performedBy: userId },
        session
      );

      await orderAudit.record(
        {
          orderId,
          event: ORDER_TIMELINE_EVENTS.PAID,
          action: 'order.payment_recorded',
          newValue: { method, amount },
          performedBy: userId,
          entityName: order.orderNumber,
        },
        session
      );

      await session.commitTransaction();

      const fullOrder = await orderRepository.findById(orderId);
      await orderNotifications.notify('paid', fullOrder, fullOrder.customer);
      return payment;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },

  // Creates a Razorpay order for the still-unpaid balance and a matching
  // 'pending' OrderPayment row (holding gatewayOrderId) - the frontend uses
  // the returned razorpayOrderId to open Razorpay Checkout. The payment is
  // only ever marked paid by the webhook or the verify-callback below, never
  // here (creating a gateway order is not proof anything was actually paid).
  async initiateRazorpayPayment(orderId, userId) {
    if (!razorpayService.isConfigured()) throw new ApiError(503, 'Razorpay is not configured on this server');

    const order = await orderRepository.findRawById(orderId);
    if (!order) throw new ApiError(404, 'Order not found');

    const totalPaid = await orderPaymentRepository.sumPaidByOrder(orderId);
    const balanceDue = Math.max(order.grandTotal - totalPaid, 0);
    if (balanceDue <= 0) throw new ApiError(400, 'This order has no outstanding balance');

    const razorpayOrder = await razorpayService.createOrder({
      amount: balanceDue,
      currency: order.currency,
      receipt: order.orderNumber,
    });

    const payment = await orderPaymentRepository.create({
      order: orderId,
      method: 'razorpay',
      amount: balanceDue,
      status: PAYMENT_STATUSES.PENDING,
      gatewayOrderId: razorpayOrder.id,
      recordedBy: userId,
    });

    return { paymentId: payment._id, razorpayOrderId: razorpayOrder.id, amount: balanceDue, currency: order.currency };
  },

  // Frontend Razorpay Checkout success-callback path - verified against the
  // API key secret, then routed through the SAME idempotent finalize step
  // the webhook uses, so whichever arrives first "wins" and the second is a
  // no-op rather than a double-count.
  async verifyRazorpayPayment({ razorpayOrderId, razorpayPaymentId, razorpaySignature }, userId) {
    const isValid = razorpayService.verifyPaymentSignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });
    if (!isValid) throw new ApiError(400, 'Payment signature verification failed');

    return this.finalizeRazorpayPayment({ razorpayOrderId, razorpayPaymentId, razorpaySignature }, userId);
  },

  // The Razorpay webhook handler - signature already verified by the
  // controller (needs the raw body, which only the controller has access
  // to via req.rawBody) before this is ever called.
  async handleWebhookEvent(payload, userId = null) {
    if (payload.event !== 'payment.captured' && payload.event !== 'payment.authorized') return;

    const paymentEntity = payload.payload?.payment?.entity;
    if (!paymentEntity) return;

    await this.finalizeRazorpayPayment(
      {
        razorpayOrderId: paymentEntity.order_id,
        razorpayPaymentId: paymentEntity.id,
        razorpaySignature: null,
      },
      userId
    );
  },

  // THE idempotent core both payment-confirmation paths funnel through -
  // "prevent double payment processing" (Security section) is satisfied
  // here by checking gatewayPaymentId first, before ever writing anything.
  async finalizeRazorpayPayment({ razorpayOrderId, razorpayPaymentId, razorpaySignature }, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const alreadyProcessed = await orderPaymentRepository.findByGatewayPaymentId(razorpayPaymentId, session);
      if (alreadyProcessed) {
        await session.commitTransaction();
        return alreadyProcessed;
      }

      const payment = await orderPaymentRepository.findByGatewayOrderId(razorpayOrderId, session);
      if (!payment) throw new ApiError(404, `No payment record found for Razorpay order ${razorpayOrderId}`);

      payment.status = PAYMENT_STATUSES.PAID;
      payment.gatewayPaymentId = razorpayPaymentId;
      payment.gatewaySignature = razorpaySignature;
      payment.paidAt = new Date();
      await payment.save({ session });

      const order = await recomputeOrderPaymentStatus(payment.order, session);
      order.paymentMethod = 'razorpay';
      await order.save({ session });

      await accountingEvents.recordSalePayment(
        { orderId: payment.order, customerId: order.customer, orderNumber: order.orderNumber, method: 'razorpay', amount: payment.amount, performedBy: userId },
        session
      );

      await orderAudit.record(
        {
          orderId: payment.order,
          event: ORDER_TIMELINE_EVENTS.PAID,
          action: 'order.payment_confirmed',
          newValue: { method: 'razorpay', amount: payment.amount, gatewayPaymentId: razorpayPaymentId },
          performedBy: userId,
          entityName: order.orderNumber,
        },
        session
      );

      await session.commitTransaction();

      const fullOrder = await orderRepository.findById(payment.order);
      await orderNotifications.notify('paid', fullOrder, fullOrder.customer);
      return payment;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },
};
