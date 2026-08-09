import mongoose from 'mongoose';
import { ApiError } from '../../utils/ApiError.js';
import { orderRepository } from './order.repository.js';
import { orderRefundRepository } from './orderRefund.repository.js';
import { orderPaymentRepository } from './orderPayment.repository.js';
import { orderAudit } from './order.audit.js';
import { orderNotifications } from './order.notifications.js';
import { accountingEvents } from '../accounting/accountingEvents.service.js';
import { PAYMENT_STATUSES, REFUND_STATUSES, ORDER_TIMELINE_EVENTS } from './order.constants.js';

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
  // touches both OrderRefund and Order together.
  async processRefund(refundId, { refundReference }, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const refund = await orderRefundRepository.findById(refundId, session);
      if (!refund) throw new ApiError(404, 'Refund not found');
      if (refund.status !== REFUND_STATUSES.PENDING) {
        throw new ApiError(400, `Refund is already ${refund.status}`);
      }

      refund.status = REFUND_STATUSES.COMPLETED;
      refund.refundReference = refundReference || '';
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
