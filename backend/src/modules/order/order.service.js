import mongoose from 'mongoose';
import { ApiError } from '../../utils/ApiError.js';
import { productRepository } from '../product/product.repository.js';
import { variantRepository } from '../product/variant/variant.repository.js';
import { calculatePricePreview, round2 } from '../product/pricing/priceCalculator.js';
import { mediaRepository } from '../media/media.repository.js';
import { MEDIA_ENTITY_TYPES, MEDIA_STATUSES } from '../media/media.constants.js';
import { warehouseRepository } from '../inventory/warehouse.repository.js';
import { inventoryRepository } from '../inventory/inventory.repository.js';
import { inventoryService } from '../inventory/inventory.service.js';
import { inventoryLedgerService } from '../inventory/inventoryLedger.service.js';
import { barcodeRepository } from '../inventory/barcode.repository.js';
import { addressRepository } from '../address/address.repository.js';
import { customerRepository } from '../customer/customer.repository.js';
import { accountingEvents } from '../accounting/accountingEvents.service.js';
import { orderRepository } from './order.repository.js';
import { orderItemRepository } from './orderItem.repository.js';
import { orderTimelineRepository } from './orderTimeline.repository.js';
import { orderActivityRepository } from './orderActivity.repository.js';
import { orderAudit } from './order.audit.js';
import { orderNumbering } from './order.numbering.js';
import { orderNotifications } from './order.notifications.js';
import { canTransition } from './order.statusTransition.js';
import { buildOrdersCsv, buildOrdersExcel } from './order.csv.js';
import { serializeOrderList } from './order.serializer.js';
import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  FULFILLMENT_STATUSES,
  ORDER_ITEM_STATUSES,
  ORDER_TIMELINE_EVENTS,
} from './order.constants.js';

const buildPaginationMeta = (page, limit, totalItems) => ({
  page,
  limit,
  totalItems,
  totalPages: Math.max(1, Math.ceil(totalItems / limit)),
});

// Resolves one requested line item (product/variant/quantity) into a fully
// priced, snapshotted OrderItem payload. Reuses the product's already
// -computed pricing.finalPrice (via the existing pure calculatePricePreview,
// not reimplemented) rather than inventing a second pricing pipeline.
async function buildOrderItemPayload({ product: productId, variant: variantId, quantity }) {
  const product = await productRepository.findRawById(productId);
  if (!product) throw new ApiError(404, `Product ${productId} not found`);

  let variant = null;
  if (variantId) {
    variant = await variantRepository.findById(variantId);
    if (!variant) throw new ApiError(404, `Variant ${variantId} not found`);
  }

  const preview = calculatePricePreview(product.pricing);
  const unitPrice = variant?.priceOverride ?? preview.finalPrice;

  const { items: mediaItems } = await mediaRepository.findPaginatedByEntity(MEDIA_ENTITY_TYPES.PRODUCT, product._id, {
    variantId: null,
    status: MEDIA_STATUSES.ACTIVE,
    page: 1,
    limit: 1,
    sortBy: 'isFeatured',
    sortOrder: 'desc',
  });
  const image = mediaItems[0]?.cloudinary?.secureUrl ?? '';

  const barcode = await barcodeRepository.findActiveForEntity(product._id, variant?._id ?? null);

  return {
    product: product._id,
    variant: variant?._id ?? null,
    sku: variant?.sku ?? product.sku,
    barcode: barcode?._id ?? null,
    // slug lets the storefront's "Buy Again" re-resolve this item to a
    // live product (re-add to cart, re-check current stock/price) without
    // a second lookup - everything else in productSnapshot is display-only.
    productSnapshot: { name: product.name, image, slug: product.slug },
    variantSnapshot: {
      attributes: (variant?.attributes ?? []).map((a) => ({
        name: a.attribute?.name ?? '',
        value: a.value?.value ?? '',
      })),
    },
    quantity,
    unitPrice,
    discount: round2(preview.discountAmount * quantity),
    tax: round2(preview.taxAmount * quantity),
    subtotal: round2(unitPrice * quantity),
    total: round2(unitPrice * quantity),
  };
}

const sumField = (items, field) => round2(items.reduce((sum, item) => sum + item[field], 0));

const buildAddressSnapshot = (address) => ({
  label: address.label ?? '',
  line1: address.line1 ?? '',
  line2: address.line2 ?? '',
  city: address.city ?? '',
  state: address.state ?? '',
  postalCode: address.postalCode ?? '',
  country: address.country ?? '',
  phone: address.phone ?? '',
});

// Recomputes and persists the Order's rollup totals from its current
// OrderItems - called any time items change (create, add, remove) while
// still in draft.
async function recalculateOrderTotals(orderId, session) {
  const resolvedItems = await orderItemRepository.findByOrder(orderId, session);
  const order = await orderRepository.findRawById(orderId, session);

  const subtotal = sumField(resolvedItems, 'subtotal');
  const discount = sumField(resolvedItems, 'discount');
  const tax = sumField(resolvedItems, 'tax');
  const grandTotal = round2(subtotal - order.couponDiscount + order.shippingCharge + order.handlingCharge);

  order.subtotal = subtotal;
  order.discount = discount;
  order.tax = tax;
  order.grandTotal = grandTotal;
  await order.save({ session: session ?? undefined });
  return order;
}

export const orderService = {
  async listOrders(query) {
    const { page, limit, ...filters } = query;
    const { items, total } = await orderRepository.findPaginated({ page, limit, ...filters });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  },

  async getOrderById(id) {
    const order = await orderRepository.findById(id);
    if (!order) throw new ApiError(404, 'Order not found');
    const items = await orderItemRepository.findByOrder(id);
    return { order, items };
  },

  // Backs both "scan to add line item" in the order builder and "scan to
  // verify" during packing - reuses barcodeRepository.findByValue (Phase 6),
  // no new barcode-lookup logic.
  async lookupByBarcode(barcodeValue) {
    const barcode = await barcodeRepository.findByValue(barcodeValue);
    if (!barcode || barcode.status !== 'active') throw new ApiError(404, 'No active barcode matches this value');

    const product = await productRepository.findRawById(barcode.product);
    if (!product) throw new ApiError(404, 'Product for this barcode no longer exists');

    let variant = null;
    if (barcode.variant) {
      variant = await variantRepository.findRawById(barcode.variant);
    }

    return {
      product: product._id,
      variant: variant?._id ?? null,
      sku: variant?.sku ?? product.sku,
      name: product.name,
    };
  },

  // Creates the Order + all OrderItems in one transaction - a half-written
  // order (Order row with no items, or vice versa) must never be possible.
  async createOrder(data, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const warehouseId = data.warehouse ?? (await warehouseRepository.findDefault())?._id;
      if (!warehouseId) throw new ApiError(500, 'No warehouse configured');

      const orderNumber = await orderNumbering.getNextOrderNumber();

      const order = await orderRepository.create(
        {
          orderNumber,
          customer: data.customer,
          billingAddress: data.billingAddress ?? null,
          shippingAddress: data.shippingAddress ?? null,
          warehouse: warehouseId,
          currency: data.currency ?? 'INR',
          shippingCharge: data.shippingCharge ?? 0,
          handlingCharge: data.handlingCharge ?? 0,
          couponDiscount: data.couponDiscount ?? 0,
          notes: data.notes ?? '',
          internalNotes: data.internalNotes ?? '',
          source: data.source ?? 'admin',
          orderStatus: ORDER_STATUSES.DRAFT,
          paymentStatus: PAYMENT_STATUSES.PENDING,
          createdBy: userId,
          updatedBy: userId,
        },
        session
      );

      const itemPayloads = await Promise.all(
        data.items.map((item) => buildOrderItemPayload(item).then((payload) => ({ ...payload, order: order._id })))
      );
      await orderItemRepository.insertMany(itemPayloads, session);

      await recalculateOrderTotals(order._id, session);

      await orderAudit.record(
        {
          orderId: order._id,
          event: ORDER_TIMELINE_EVENTS.CREATED,
          action: 'order.created',
          newValue: { orderStatus: ORDER_STATUSES.DRAFT, itemCount: itemPayloads.length },
          performedBy: userId,
          entityName: orderNumber,
        },
        session
      );

      await session.commitTransaction();
      return orderRepository.findById(order._id);
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },

  // Sets a validated coupon's discount onto a still-draft order and
  // re-runs the same rollup used at creation - called from
  // storefront.service.js#checkout between createOrder and submitOrder,
  // once couponService.validateForCustomer has confirmed the code against
  // this order's own real (server-computed) subtotal.
  async applyCoupon(orderId, { couponCode, couponDiscount }, userId) {
    const order = await orderRepository.findRawById(orderId);
    if (!order) throw new ApiError(404, 'Order not found');
    order.couponCode = couponCode;
    order.couponDiscount = couponDiscount;
    order.updatedBy = userId;
    await order.save();
    return recalculateOrderTotals(orderId);
  },

  // draft -> pending ("submitted for confirmation") - not one of the
  // spec's named timeline events, so this only writes an OrderActivity
  // entry (via transitionStatus -> orderAudit), no customer-facing
  // OrderTimeline row.
  async submitOrder(orderId, userId) {
    return this.transitionStatus(orderId, ORDER_STATUSES.PENDING, { userId });
  },

  // pending -> confirmed. Reserves inventory for every item from the
  // order's chosen warehouse - the ONLY door into Inventory this module
  // ever uses (inventoryService.reserveStock, never the repository
  // directly). All-or-nothing in one transaction.
  async confirmOrder(orderId, { userId, ipAddress, userAgent } = {}) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const order = await orderRepository.findRawById(orderId, session);
      if (!order) throw new ApiError(404, 'Order not found');
      if (!canTransition(order.orderStatus, ORDER_STATUSES.CONFIRMED)) {
        throw new ApiError(400, `Cannot confirm an order in status "${order.orderStatus}"`);
      }
      if (!order.warehouse) throw new ApiError(400, 'Order has no warehouse assigned');

      // Resolve the chosen Address(es) into an immutable embedded snapshot,
      // once, at confirm-time - editing or deleting the live Address later
      // can never alter this already-placed order (see address.model.js).
      if (order.billingAddress && !order.billingAddressSnapshot) {
        const billing = await addressRepository.findById(order.billingAddress);
        if (billing) order.billingAddressSnapshot = buildAddressSnapshot(billing);
      }
      if (order.shippingAddress && !order.shippingAddressSnapshot) {
        const shipping = await addressRepository.findById(order.shippingAddress);
        if (shipping) order.shippingAddressSnapshot = buildAddressSnapshot(shipping);
      }

      // Same snapshot discipline for the customer's own name/phone/email -
      // Phase 8's architecture lock: CRM (Customer) stays the live source of
      // truth, this order keeps a point-in-time copy so a later profile
      // edit (e.g. the customer's phone number changing) can never alter
      // what this already-confirmed order shows.
      if (!order.customerSnapshot) {
        const customer = await customerRepository.findRawById(order.customer, session);
        if (customer) {
          order.customerSnapshot = { name: customer.displayName, phone: customer.phone ?? '', email: customer.email ?? '' };
        }
      }

      const items = await orderItemRepository.findByOrder(orderId, session);
      const touchedInventoryIds = [];
      for (const item of items) {
        // eslint-disable-next-line no-await-in-loop
        const inventory = await inventoryRepository.findOneByScope(item.product, item.variant, order.warehouse, session);
        if (!inventory) {
          throw new ApiError(409, `No inventory record for SKU ${item.sku} in the selected warehouse`);
        }
        // eslint-disable-next-line no-await-in-loop
        await inventoryService.reserveStock(inventory._id, item.quantity, {
          referenceType: 'order',
          referenceId: order._id,
          performedBy: userId,
          session,
        });
        touchedInventoryIds.push(inventory._id);
      }

      order.orderStatus = ORDER_STATUSES.CONFIRMED;
      order.updatedBy = userId;
      await order.save({ session });

      // Sales Accounting event - a confirmed order is the point a sale
      // becomes a real, committed receivable. Accounting alone decides the
      // Dr/Cr accounts; this call only reports what happened (see
      // accountingEvents.service.js's header comment - "No accounting
      // logic inside Orders").
      await accountingEvents.recordSaleInvoice(
        {
          orderId: order._id,
          customerId: order.customer,
          orderNumber: order.orderNumber,
          subtotal: order.subtotal,
          couponDiscount: order.couponDiscount,
          shippingCharge: order.shippingCharge,
          handlingCharge: order.handlingCharge,
          grandTotal: order.grandTotal,
          performedBy: userId,
        },
        session
      );

      await orderAudit.record(
        {
          orderId,
          event: ORDER_TIMELINE_EVENTS.CONFIRMED,
          action: 'order.confirmed',
          oldValue: { orderStatus: 'pending' },
          newValue: { orderStatus: 'confirmed' },
          ipAddress,
          userAgent,
          performedBy: userId,
          entityName: order.orderNumber,
        },
        session
      );

      await session.commitTransaction();

      // Each reserveStock call above ran under our externalSession, so none
      // of them evaluated alerts themselves (see inventory.service.js /
      // inventoryLedger.service.js) - now that our own transaction is
      // genuinely committed, do it for every inventory record touched.
      await Promise.all(touchedInventoryIds.map((id) => inventoryLedgerService.evaluateAlertsAfterCommit(id)));

      const fullOrder = await orderRepository.findById(orderId);
      await orderNotifications.notify('confirmed', fullOrder, fullOrder.customer);
      return fullOrder;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },

  // Cancellable from any pre-shipment status. Releases every non-terminal
  // item's reservation (never touches Inventory directly) and, if money has
  // already changed hands, hands off to orderRefund.service.js by creating
  // a pending refund record (not processed here - Refund is its own engine).
  async cancelOrder(orderId, { userId, reason, ipAddress, userAgent } = {}) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const order = await orderRepository.findRawById(orderId, session);
      if (!order) throw new ApiError(404, 'Order not found');
      if (!canTransition(order.orderStatus, ORDER_STATUSES.CANCELLED)) {
        throw new ApiError(400, `Cannot cancel an order in status "${order.orderStatus}"`);
      }

      const wasConfirmedOrLater = [
        ORDER_STATUSES.CONFIRMED,
        ORDER_STATUSES.PACKED,
        ORDER_STATUSES.READY_TO_SHIP,
      ].includes(order.orderStatus);

      const touchedInventoryIds = [];
      if (wasConfirmedOrLater) {
        const items = await orderItemRepository.findByOrder(orderId, session);
        for (const item of items) {
          if (item.status === ORDER_ITEM_STATUSES.CANCELLED) continue; // eslint-disable-line no-continue
          // eslint-disable-next-line no-await-in-loop
          const inventory = await inventoryRepository.findOneByScope(item.product, item.variant, order.warehouse, session);
          if (inventory) {
            // eslint-disable-next-line no-await-in-loop
            await inventoryService.releaseReservation(inventory._id, item.quantity, {
              referenceType: 'order',
              referenceId: order._id,
              performedBy: userId,
              session,
            });
            touchedInventoryIds.push(inventory._id);
          }
        }
      }

      await orderItemRepository.updateManyStatus(
        (await orderItemRepository.findByOrder(orderId, session)).map((i) => i._id),
        ORDER_ITEM_STATUSES.CANCELLED,
        session
      );

      const oldStatus = order.orderStatus;
      order.orderStatus = ORDER_STATUSES.CANCELLED;
      order.updatedBy = userId;
      await order.save({ session });

      // Sales Accounting event - reverses the original Sale Invoice
      // journal (if one was ever posted) so revenue recognized on a now
      // -void order is fully undone. A no-op if the order was cancelled
      // before it was ever confirmed.
      await accountingEvents.recordSaleCancellation({ orderId, reason, performedBy: userId }, session);

      await orderAudit.record(
        {
          orderId,
          event: ORDER_TIMELINE_EVENTS.CANCELLED,
          action: 'order.cancelled',
          oldValue: { orderStatus: oldStatus },
          newValue: { orderStatus: 'cancelled' },
          reason,
          ipAddress,
          userAgent,
          performedBy: userId,
          entityName: order.orderNumber,
        },
        session
      );

      await session.commitTransaction();

      await Promise.all(touchedInventoryIds.map((id) => inventoryLedgerService.evaluateAlertsAfterCommit(id)));

      const fullOrder = await orderRepository.findById(orderId);
      await orderNotifications.notify('cancelled', fullOrder, fullOrder.customer);
      return { order: fullOrder, needsRefund: [PAYMENT_STATUSES.PAID, PAYMENT_STATUSES.PARTIALLY_PAID].includes(order.paymentStatus) };
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },

  // confirmed -> packed. Marks the given items (defaults to all) packed.
  async packOrder(orderId, { userId, itemIds } = {}) {
    const order = await orderRepository.findRawById(orderId);
    if (!order) throw new ApiError(404, 'Order not found');
    if (!canTransition(order.orderStatus, ORDER_STATUSES.PACKED)) {
      throw new ApiError(400, `Cannot pack an order in status "${order.orderStatus}"`);
    }

    const items = await orderItemRepository.findByOrder(orderId);
    const targetIds = itemIds?.length ? itemIds : items.map((i) => i._id.toString());
    await orderItemRepository.updateManyStatus(targetIds, ORDER_ITEM_STATUSES.PACKED);

    order.orderStatus = ORDER_STATUSES.PACKED;
    order.updatedBy = userId;
    await order.save();

    await orderAudit.record({
      orderId,
      event: ORDER_TIMELINE_EVENTS.PACKED,
      action: 'order.packed',
      oldValue: { orderStatus: 'confirmed' },
      newValue: { orderStatus: 'packed' },
      performedBy: userId,
      entityName: order.orderNumber,
    });

    const fullOrder = await orderRepository.findById(orderId);
    await orderNotifications.notify('packed', fullOrder, fullOrder.customer);
    return fullOrder;
  },

  // packed -> ready_to_ship (a manual staging step before a Shipment record
  // is actually created - see orderShipment.service.js for the shipped/
  // partially_shipped transition, which it drives itself).
  async markReadyToShip(orderId, userId) {
    return this.transitionStatus(orderId, ORDER_STATUSES.READY_TO_SHIP, { userId });
  },

  // Generic guard-and-persist for transitions with no side effects of their
  // own (confirm/cancel/deliver have dedicated methods above because they
  // touch Inventory or items) - still always writes the audit trail.
  async transitionStatus(orderId, toStatus, { userId, event, reason } = {}) {
    const order = await orderRepository.findRawById(orderId);
    if (!order) throw new ApiError(404, 'Order not found');
    if (!canTransition(order.orderStatus, toStatus)) {
      throw new ApiError(400, `Cannot move an order from "${order.orderStatus}" to "${toStatus}"`);
    }

    const oldStatus = order.orderStatus;
    order.orderStatus = toStatus;
    order.updatedBy = userId;
    await order.save();

    await orderAudit.record({
      orderId,
      event: event ?? null,
      action: `order.status_changed`,
      oldValue: { orderStatus: oldStatus },
      newValue: { orderStatus: toStatus },
      reason,
      performedBy: userId,
      entityName: order.orderNumber,
    });

    return orderRepository.findById(orderId);
  },

  // Converts each delivered item's reservation into a permanent sale - the
  // exact inventoryService call the Reservation Engine (Phase 6) was built
  // for and left unused until now. Accepts a subset of items for partial
  // delivery; the order-level status becomes 'delivered' only once every
  // item has been marked delivered, else 'partially_delivered'.
  async markDelivered(orderId, { userId, itemIds } = {}) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const order = await orderRepository.findRawById(orderId, session);
      if (!order) throw new ApiError(404, 'Order not found');

      const items = await orderItemRepository.findByOrder(orderId, session);
      const targetItems = itemIds?.length ? items.filter((i) => itemIds.includes(i._id.toString())) : items;

      const touchedInventoryIds = [];
      let totalCogs = 0;
      for (const item of targetItems) {
        if (item.status === ORDER_ITEM_STATUSES.DELIVERED) continue; // eslint-disable-line no-continue
        // eslint-disable-next-line no-await-in-loop
        const inventory = await inventoryRepository.findOneByScope(item.product, item.variant, order.warehouse, session);
        if (inventory) {
          // eslint-disable-next-line no-await-in-loop
          await inventoryService.convertReservationToSale(inventory._id, item.quantity, {
            referenceType: 'order',
            referenceId: order._id,
            performedBy: userId,
            session,
          });
          touchedInventoryIds.push(inventory._id);
        }

        // Inventory Valuation event - the reserved unit has now actually
        // left the building, so its cost is recognized as COGS in the same
        // moment (see accountingEvents.service.js#recordCogs). Reads the
        // product's cost price at delivery time, not the sale price.
        // eslint-disable-next-line no-await-in-loop
        const product = await productRepository.findRawById(item.product, session);
        if (product?.pricing?.costPrice) {
          totalCogs = round2(totalCogs + product.pricing.costPrice * item.quantity);
        }

        // eslint-disable-next-line no-await-in-loop
        await orderItemRepository.updateStatus(item._id, ORDER_ITEM_STATUSES.DELIVERED, session);
      }

      if (totalCogs > 0) {
        await accountingEvents.recordCogs({ orderId, orderNumber: order.orderNumber, amount: totalCogs, performedBy: userId }, session);
      }

      const allItems = await orderItemRepository.findByOrder(orderId, session);
      const allDelivered = allItems.every((i) => i.status === ORDER_ITEM_STATUSES.DELIVERED || i.status === ORDER_ITEM_STATUSES.CANCELLED);
      const newStatus = allDelivered ? ORDER_STATUSES.DELIVERED : ORDER_STATUSES.PARTIALLY_DELIVERED;

      if (!canTransition(order.orderStatus, newStatus) && order.orderStatus !== newStatus) {
        throw new ApiError(400, `Cannot mark an order in status "${order.orderStatus}" as delivered`);
      }

      const oldStatus = order.orderStatus;
      order.orderStatus = newStatus;
      order.fulfillmentStatus = allDelivered ? FULFILLMENT_STATUSES.FULFILLED : FULFILLMENT_STATUSES.PARTIALLY_FULFILLED;
      order.updatedBy = userId;
      await order.save({ session });

      await orderAudit.record(
        {
          orderId,
          event: ORDER_TIMELINE_EVENTS.DELIVERED,
          action: 'order.delivered',
          oldValue: { orderStatus: oldStatus },
          newValue: { orderStatus: newStatus },
          performedBy: userId,
          entityName: order.orderNumber,
        },
        session
      );

      await session.commitTransaction();

      await Promise.all(touchedInventoryIds.map((id) => inventoryLedgerService.evaluateAlertsAfterCommit(id)));

      const fullOrder = await orderRepository.findById(orderId);
      await orderNotifications.notify('delivered', fullOrder, fullOrder.customer);
      return fullOrder;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },

  // delivered -> completed (final closure, e.g. once the return window has
  // passed) - also not a named timeline event, activity-only.
  async completeOrder(orderId, userId) {
    return this.transitionStatus(orderId, ORDER_STATUSES.COMPLETED, { userId });
  },

  async getTimeline(orderId) {
    return orderTimelineRepository.findByOrder(orderId);
  },

  async getActivity(orderId) {
    return orderActivityRepository.findByOrder(orderId);
  },

  async getDashboardTotals() {
    return orderRepository.getDashboardTotals();
  },

  async getSalesTrend(days = 14) {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - (days - 1));
    sinceDate.setHours(0, 0, 0, 0);

    const rows = await orderRepository.getSalesTrend(sinceDate);
    const byDate = Object.fromEntries(rows.map((r) => [r._id, { orders: r.orders, revenue: r.revenue }]));

    const series = [];
    for (let i = 0; i < days; i += 1) {
      const d = new Date(sinceDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      series.push({ date: key, orders: byDate[key]?.orders ?? 0, revenue: byDate[key]?.revenue ?? 0 });
    }
    return series;
  },

  async getStatusDistribution() {
    const rows = await orderRepository.getStatusDistribution();
    return rows.map((r) => ({ status: r._id, count: r.count }));
  },

  async getPaymentBreakdown() {
    const rows = await orderRepository.getPaymentBreakdown();
    return rows.map((r) => ({ method: r._id, count: r.count, amount: r.amount }));
  },

  async exportOrdersCsv(filter) {
    const orders = await orderRepository.findAllForExport(filter);
    return buildOrdersCsv(serializeOrderList(orders));
  },

  async exportOrdersExcel(filter) {
    const orders = await orderRepository.findAllForExport(filter);
    return buildOrdersExcel(serializeOrderList(orders));
  },
};
