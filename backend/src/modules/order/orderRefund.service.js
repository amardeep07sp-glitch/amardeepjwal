import mongoose from 'mongoose';
import { ApiError } from '../../utils/ApiError.js';
import { orderRepository } from './order.repository.js';
import { orderRefundRepository } from './orderRefund.repository.js';
import { orderPaymentRepository } from './orderPayment.repository.js';
import { orderAudit } from './order.audit.js';
import { orderNotifications } from './order.notifications.js';
import { accountingEvents } from '../accounting/accountingEvents.service.js';
import { razorpayService } from './razorpay.service.js';
import { logger } from '../../config/logger.js';
import { PAYMENT_STATUSES, REFUND_STATUSES, ORDER_TIMELINE_EVENTS } from './order.constants.js';

// Real gateway refund, not just a status flip - only when the order was
// actually paid through Razorpay (a real gatewayPaymentId on file) AND the
// gateway is configured. Returns null (never throws) for a COD/manual
// order, which stays exactly the "admin-attested" flow it already was -
// there's no gateway transaction to reverse for those. Throwing here (a
// configured gateway that REJECTS the refund call) is deliberate: the
// caller must never mark a refund COMPLETED when the money didn't
// actually move.
async function attemptGatewayRefund(order, refund) {
  const payments = await orderPaymentRepository.findByOrder(order._id);
  const gatewayPayment = payments.find((p) => p.status === 'paid' && p.gatewayPaymentId);
  if (!gatewayPayment) return null;

  if (!razorpayService.isConfigured()) {
    logger.warn(
      { orderId: order._id, orderNumber: order.orderNumber, refundId: refund._id },
      'Refund is against a Razorpay-paid order but Razorpay is not configured (see apikey.todo) - falling back to a manual/status-only refund. The admin must issue this refund directly in the Razorpay dashboard.'
    );
    return null;
  }

  const result = await razorpayService.refundPayment({
    paymentId: gatewayPayment.gatewayPaymentId,
    amount: refund.amount,
    notes: { orderNumber: order.orderNumber, refundId: refund._id.toString() },
  });
  return result.id;
}

const buildPaginationMeta = (page, limit, totalItems) => ({
  page,
  limit,
  totalItems,
  totalPages: Math.max(1, Math.ceil(totalItems / limit)),
});

export const orderRefundService = {
  async listRefunds(query) {
    const { page, limit, ...filters } = query;
    const { items, total } = await orderRefundRepository.findPaginated({ page, limit, ...filters });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  },

  listForOrder(orderId) {
    return orderRefundRepository.findByOrder(orderId);
  },

  // Only creates the record - money doesn't actually move until
  // processRefund marks it completed (mirrors how Order Payment separates
  // "gateway order created" from "payment confirmed").
  async createRefund(orderId, { type, amount, method, returnId }, userId) {
    const order = await orderRepository.findRawById(orderId);
    if (!order) throw new ApiError(404, 'Order not found');

    const totalPaid = await orderPaymentRepository.sumPaidByOrder(orderId);
    const alreadyRefunded = await orderRefundRepository.sumCompletedByOrder(orderId);
    const maxRefundable = totalPaid - alreadyRefunded;
    if (amount > maxRefundable) {
      throw new ApiError(400, `Refund amount exceeds refundable balance (${maxRefundable})`);
    }

    return orderRefundRepository.create({
      order: orderId,
      return: returnId || null,
      type,
      amount,
      method: method || '',
      status: REFUND_STATUSES.PENDING,
      processedBy: userId,
    });
  },

  // Marks the refund completed and rolls Order.paymentStatus up to
  // 'refunded' (fully) or 'partially_refunded' - transactional since it
  // touches both OrderRefund and Order together. The real Razorpay refund
  // call (if any) happens BEFORE the transaction starts, deliberately - an
  // external HTTP call has no business holding a DB transaction open, and
  // if it throws, nothing has been written yet to roll back.
  async processRefund(refundId, { refundReference }, userId) {
    const preCheckRefund = await orderRefundRepository.findById(refundId);
    if (!preCheckRefund) throw new ApiError(404, 'Refund not found');
    if (preCheckRefund.status !== REFUND_STATUSES.PENDING) {
      throw new ApiError(400, `Refund is already ${preCheckRefund.status}`);
    }
    const preCheckOrder = await orderRepository.findRawById(preCheckRefund.order);
    const gatewayRefundId = await attemptGatewayRefund(preCheckOrder, preCheckRefund);
    // A real gateway refund ID always wins over whatever an admin typed in
    // the "reference" field - that field only exists for the manual/COD
    // path, where there's no gateway to ask.
    const resolvedReference = gatewayRefundId ?? refundReference ?? '';

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const refund = await orderRefundRepository.findById(refundId, session);
      if (!refund) throw new ApiError(404, 'Refund not found');
      if (refund.status !== REFUND_STATUSES.PENDING) {
        throw new ApiError(400, `Refund is already ${refund.status}`);
      }

      refund.status = REFUND_STATUSES.COMPLETED;
      refund.refundReference = resolvedReference;
      refund.processedBy = userId;
      await refund.save({ session });

      const order = await orderRepository.findRawById(refund.order, session);
      const totalPaid = await orderPaymentRepository.sumPaidByOrder(refund.order, session);
      const totalRefunded = await orderRefundRepository.sumCompletedByOrder(refund.order, session);

      order.paymentStatus = totalRefunded >= totalPaid ? PAYMENT_STATUSES.REFUNDED : PAYMENT_STATUSES.PARTIALLY_REFUNDED;
      await order.save({ session });

      await accountingEvents.recordSaleRefund(
        { orderId: refund.order, customerId: order.customer, orderNumber: order.orderNumber, method: refund.method, amount: refund.amount, performedBy: userId },
        session
      );

      await orderAudit.record(
        {
          orderId: refund.order,
          event: ORDER_TIMELINE_EVENTS.REFUNDED,
          action: 'order_refund.processed',
          newValue: { amount: refund.amount, method: refund.method },
          performedBy: userId,
          entityName: order.orderNumber,
        },
        session
      );

      await session.commitTransaction();

      const fullOrder = await orderRepository.findById(refund.order);
      await orderNotifications.notify('refunded', fullOrder, fullOrder.customer);
      return refund;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },

  async failRefund(refundId, userId, reason) {
    const refund = await orderRefundRepository.updateById(refundId, { status: REFUND_STATUSES.FAILED });
    if (!refund) throw new ApiError(404, 'Refund not found');

    await orderAudit.record({
      orderId: refund.order,
      action: 'order_refund.failed',
      reason,
      performedBy: userId,
    });

    return refund;
  },
};
