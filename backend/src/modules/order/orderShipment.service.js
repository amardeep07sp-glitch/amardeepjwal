import { ApiError } from '../../utils/ApiError.js';
import { orderRepository } from './order.repository.js';
import { orderItemRepository } from './orderItem.repository.js';
import { orderShipmentRepository } from './orderShipment.repository.js';
import { orderAudit } from './order.audit.js';
import { orderNotifications } from './order.notifications.js';
import { orderNumbering } from './order.numbering.js';
import { orderService } from './order.service.js';
import { canTransition } from './order.statusTransition.js';
import { ORDER_STATUSES, ORDER_ITEM_STATUSES, ORDER_TIMELINE_EVENTS } from './order.constants.js';

const buildPaginationMeta = (page, limit, totalItems) => ({
  page,
  limit,
  totalItems,
  totalPages: Math.max(1, Math.ceil(totalItems / limit)),
});

export const orderShipmentService = {
  async listShipments(query) {
    const { page, limit, ...filters } = query;
    const { items, total } = await orderShipmentRepository.findPaginated({ page, limit, ...filters });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  },

  listForOrder(orderId) {
    return orderShipmentRepository.findByOrder(orderId);
  },

  // Dispatches immediately on creation (v1 simplification - no separate
  // "pending" staging step for a shipment once it's created). Marks the
  // covered items 'shipped' and rolls the order-level status up to
  // 'shipped' (every non-cancelled item now shipped) or 'partially_shipped'.
  async createShipment(orderId, { itemIds, courier, trackingNumber, trackingUrl, estimatedDelivery }, userId) {
    const order = await orderRepository.findRawById(orderId);
    if (!order) throw new ApiError(404, 'Order not found');
    if (![ORDER_STATUSES.PACKED, ORDER_STATUSES.READY_TO_SHIP, ORDER_STATUSES.PARTIALLY_SHIPPED].includes(order.orderStatus)) {
      throw new ApiError(400, `Cannot ship an order in status "${order.orderStatus}"`);
    }

    const allItems = await orderItemRepository.findByOrder(orderId);
    const targetItems = itemIds?.length ? allItems.filter((i) => itemIds.includes(i._id.toString())) : allItems;
    if (targetItems.length === 0) throw new ApiError(400, 'No items to ship');

    const shipmentNumber = await orderNumbering.getNextShipmentNumber();
    const shipment = await orderShipmentRepository.create({
      order: orderId,
      shipmentNumber,
      items: targetItems.map((i) => i._id),
      courier: courier || '',
      trackingNumber: trackingNumber || '',
      trackingUrl: trackingUrl || '',
      status: 'dispatched',
      estimatedDelivery: estimatedDelivery || null,
    });

    await orderItemRepository.updateManyStatus(
      targetItems.map((i) => i._id),
      ORDER_ITEM_STATUSES.SHIPPED
    );

    const refreshedItems = await orderItemRepository.findByOrder(orderId);
    const allShipped = refreshedItems.every((i) =>
      [ORDER_ITEM_STATUSES.SHIPPED, ORDER_ITEM_STATUSES.DELIVERED, ORDER_ITEM_STATUSES.CANCELLED].includes(i.status)
    );
    const newOrderStatus = allShipped ? ORDER_STATUSES.SHIPPED : ORDER_STATUSES.PARTIALLY_SHIPPED;

    // A mismatch here means the transition table (order.constants.js) and
    // this service's allowed source statuses have drifted apart - fail
    // loudly rather than silently leaving the order status stale while the
    // shipment and item statuses have already moved forward.
    if (order.orderStatus !== newOrderStatus) {
      if (!canTransition(order.orderStatus, newOrderStatus)) {
        throw new ApiError(500, `Order status transition "${order.orderStatus}" -> "${newOrderStatus}" is not defined`);
      }
      order.orderStatus = newOrderStatus;
      order.updatedBy = userId;
      await order.save();
    }

    await orderAudit.record({
      orderId,
      event: ORDER_TIMELINE_EVENTS.SHIPPED,
      action: 'order.shipment_created',
      newValue: { shipmentNumber, courier, trackingNumber, itemCount: targetItems.length },
      performedBy: userId,
      entityName: order.orderNumber,
    });

    const fullOrder = await orderRepository.findById(orderId);
    await orderNotifications.notify('shipped', fullOrder, fullOrder.customer);
    return shipment;
  },

  async updateTracking(shipmentId, data, userId) {
    const shipment = await orderShipmentRepository.updateById(shipmentId, data);
    if (!shipment) throw new ApiError(404, 'Shipment not found');

    await orderAudit.record({
      orderId: shipment.order,
      action: 'order.shipment_updated',
      newValue: data,
      performedBy: userId,
    });

    return shipment;
  },

  // Marking a shipment delivered is what actually converts each of its
  // items' reservations into a permanent sale - delegates to
  // order.service.js#markDelivered (scoped to this shipment's items) rather
  // than duplicating the Inventory conversion logic here.
  async markShipmentDelivered(shipmentId, userId) {
    const shipment = await orderShipmentRepository.findById(shipmentId);
    if (!shipment) throw new ApiError(404, 'Shipment not found');

    shipment.status = 'delivered';
    shipment.deliveredAt = new Date();
    await shipment.save();

    return orderService.markDelivered(shipment.order, {
      userId,
      itemIds: shipment.items.map((id) => id.toString()),
    });
  },
};
