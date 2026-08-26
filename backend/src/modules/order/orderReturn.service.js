import mongoose from 'mongoose';
import { ApiError } from '../../utils/ApiError.js';
import { orderRepository } from './order.repository.js';
import { orderItemRepository } from './orderItem.repository.js';
import { orderReturnRepository } from './orderReturn.repository.js';
import { orderAudit } from './order.audit.js';
import { inventoryRepository } from '../inventory/inventory.repository.js';
import { inventoryService } from '../inventory/inventory.service.js';
import { inventoryLedgerService } from '../inventory/inventoryLedger.service.js';
import { couponService } from '../coupon/coupon.service.js';
import { RETURN_STATUSES, RETURN_STATUS_TRANSITIONS, ORDER_ITEM_STATUSES, ORDER_TIMELINE_EVENTS } from './order.constants.js';

const buildPaginationMeta = (page, limit, totalItems) => ({
  page,
  limit,
  totalItems,
  totalPages: Math.max(1, Math.ceil(totalItems / limit)),
});

const canTransitionReturn = (from, to) => (RETURN_STATUS_TRANSITIONS[from] ?? []).includes(to);

async function guardedTransition(returnId, toStatus, patch, userId) {
  const orderReturn = await orderReturnRepository.findById(returnId);
  if (!orderReturn) throw new ApiError(404, 'Return not found');
  if (!canTransitionReturn(orderReturn.status, toStatus)) {
    throw new ApiError(400, `Cannot move a return from "${orderReturn.status}" to "${toStatus}"`);
  }

  const updated = await orderReturnRepository.updateById(returnId, { status: toStatus, ...patch });

  await orderAudit.record({
    orderId: orderReturn.order,
    action: `order_return.${toStatus}`,
    oldValue: { status: orderReturn.status },
    newValue: { status: toStatus },
    performedBy: userId,
  });

  return updated;
}

export const orderReturnService = {
  async listReturns(query) {
    const { page, limit, ...filters } = query;
    const { items, total } = await orderReturnRepository.findPaginated({ page, limit, ...filters });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  },

  listForOrder(orderId) {
    return orderReturnRepository.findByOrder(orderId);
  },

  // Returnable once at least one item has actually left the warehouse -
  // requesting a return before then makes no sense (use Cancel instead).
  async requestReturn(orderId, { items, reason }, userId) {
    const order = await orderRepository.findRawById(orderId);
    if (!order) throw new ApiError(404, 'Order not found');

    const orderReturn = await orderReturnRepository.create({
      order: orderId,
      items,
      reason: reason || '',
      status: RETURN_STATUSES.REQUESTED,
      requestedBy: userId,
    });

    await orderAudit.record({
      orderId,
      event: ORDER_TIMELINE_EVENTS.RETURNED,
      action: 'order_return.requested',
      newValue: { itemCount: items.length, reason },
      performedBy: userId,
      entityName: order.orderNumber,
    });

    return orderReturn;
  },

  approveReturn: (id, userId) => guardedTransition(id, RETURN_STATUSES.APPROVED, { approvedBy: userId }, userId),
  rejectReturn: (id, userId) => guardedTransition(id, RETURN_STATUSES.REJECTED, { approvedBy: userId }, userId),
  schedulePickup: (id, userId) => guardedTransition(id, RETURN_STATUSES.PICKUP_SCHEDULED, {}, userId),
  markReceived: (id, userId) => guardedTransition(id, RETURN_STATUSES.RECEIVED, {}, userId),
  markInspected: (id, userId) => guardedTransition(id, RETURN_STATUSES.INSPECTED, {}, userId),
  acceptReturn: (id, userId) => guardedTransition(id, RETURN_STATUSES.ACCEPTED, {}, userId),

  // The one step that actually touches Inventory - credits returnedQuantity
  // via inventoryService.recordReturn (never the repository directly), one
  // movement per line item, all inside a single transaction so a failure
  // partway through restocks nothing rather than restocking some items
  // twice on retry.
  async restockReturn(returnId, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const orderReturn = await orderReturnRepository.findById(returnId, session);
      if (!orderReturn) throw new ApiError(404, 'Return not found');
      if (!canTransitionReturn(orderReturn.status, RETURN_STATUSES.RESTOCKED)) {
        throw new ApiError(400, `Cannot restock a return in status "${orderReturn.status}"`);
      }

      const order = await orderRepository.findRawById(orderReturn.order, session);
      const touchedInventoryIds = [];

      for (const line of orderReturn.items) {
        // eslint-disable-next-line no-await-in-loop
        const orderItem = await orderItemRepository.findById(line.orderItem, session);
        if (!orderItem) continue; // eslint-disable-line no-continue

        // eslint-disable-next-line no-await-in-loop
        const inventory = await inventoryRepository.findOneByScope(orderItem.product, orderItem.variant, order.warehouse, session);
        if (inventory) {
          // eslint-disable-next-line no-await-in-loop
          await inventoryService.recordReturn(inventory._id, line.returnQuantity, {
            referenceType: 'order_return',
            referenceId: returnId,
            performedBy: userId,
            session,
          });
          touchedInventoryIds.push(inventory._id);
        }

        // eslint-disable-next-line no-await-in-loop
        await orderItemRepository.updateStatus(orderItem._id, ORDER_ITEM_STATUSES.RETURNED, session);
      }

      orderReturn.status = RETURN_STATUSES.RESTOCKED;
      await orderReturn.save({ session });

      await orderAudit.record(
        {
          orderId: orderReturn.order,
          event: ORDER_TIMELINE_EVENTS.RETURNED,
          action: 'order_return.restocked',
          newValue: { itemCount: orderReturn.items.length },
          performedBy: userId,
          entityName: order.orderNumber,
        },
        session
      );

      await session.commitTransaction();

      await Promise.all(touchedInventoryIds.map((id) => inventoryLedgerService.evaluateAlertsAfterCommit(id)));

      // Restock is the return flow's real completion point (items
      // physically back, order financially settled) - the coupon's own
      // cancellationPolicy runs here, same as order.service.js#cancelOrder,
      // with refund:true so the ledger row records this as a refund-driven
      // release rather than a plain cancellation.
      if (order.couponCode) {
        await couponService.releaseRedemptionForOrder(orderReturn.order, { refund: true });
      }

      return orderReturn;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },
};
