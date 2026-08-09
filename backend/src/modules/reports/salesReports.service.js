import { Order } from '../order/order.model.js';
import { OrderItem } from '../order/orderItem.model.js';
import { orderRepository } from '../order/order.repository.js';
import { orderRefundRepository } from '../order/orderRefund.repository.js';
import { buildDateRangeMatch, buildPaginationMeta, paginateStages } from './reportFilters.util.js';

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

// Every "sales" report only ever counts an order once it's a real,
// committed sale (confirmed or later) - draft/pending orders never
// happened yet, and cancelled/refunded ones are their own dedicated
// reports below, not silently folded into revenue.
const SETTLED_STATUSES = ['confirmed', 'packed', 'ready_to_ship', 'shipped', 'partially_shipped', 'delivered', 'partially_delivered', 'completed'];

function dateMatch(dateFrom, dateTo) {
  return buildDateRangeMatch('createdAt', dateFrom, dateTo) ?? {};
}

export const salesReportsService = {
  async getSalesSummary({ dateFrom, dateTo } = {}) {
    const match = { orderStatus: { $in: SETTLED_STATUSES }, ...dateMatch(dateFrom, dateTo) };
    const [row] = await Order.aggregate([
      { $match: match },
      { $group: { _id: null, orderCount: { $sum: 1 }, totalRevenue: { $sum: '$grandTotal' }, totalDiscount: { $sum: '$couponDiscount' }, totalTax: { $sum: '$tax' } } },
    ]);

    const orderCount = row?.orderCount ?? 0;
    const totalRevenue = row?.totalRevenue ?? 0;
    return {
      orderCount,
      totalRevenue,
      totalDiscount: row?.totalDiscount ?? 0,
      totalTax: row?.totalTax ?? 0,
      averageOrderValue: orderCount > 0 ? round2(totalRevenue / orderCount) : 0,
    };
  },

  async getSalesByProduct({ dateFrom, dateTo, page, limit }) {
    const orderMatch = { orderStatus: { $in: SETTLED_STATUSES }, ...dateMatch(dateFrom, dateTo) };
    const pipeline = [
      { $lookup: { from: 'orders', localField: 'order', foreignField: '_id', as: 'order' } },
      { $unwind: '$order' },
      { $match: Object.fromEntries(Object.entries(orderMatch).map(([k, v]) => [`order.${k}`, v])) },
      { $group: { _id: '$product', quantity: { $sum: '$quantity' }, revenue: { $sum: '$total' }, name: { $first: '$productSnapshot.name' } } },
      { $sort: { revenue: -1 } },
    ];
    const [rows, totalAgg] = await Promise.all([
      OrderItem.aggregate([...pipeline, ...paginateStages(page, limit)]),
      OrderItem.aggregate([...pipeline, { $count: 'total' }]),
    ]);
    return { items: rows.map((r) => ({ productId: r._id, name: r.name, quantity: r.quantity, revenue: r.revenue })), meta: buildPaginationMeta(page, limit, totalAgg[0]?.total ?? 0) };
  },

  async getSalesByCategory({ dateFrom, dateTo, page, limit }) {
    const orderMatch = { orderStatus: { $in: SETTLED_STATUSES }, ...dateMatch(dateFrom, dateTo) };
    const pipeline = [
      { $lookup: { from: 'orders', localField: 'order', foreignField: '_id', as: 'order' } },
      { $unwind: '$order' },
      { $match: Object.fromEntries(Object.entries(orderMatch).map(([k, v]) => [`order.${k}`, v])) },
      { $lookup: { from: 'products', localField: 'product', foreignField: '_id', as: 'productDoc' } },
      { $unwind: '$productDoc' },
      { $group: { _id: '$productDoc.category', quantity: { $sum: '$quantity' }, revenue: { $sum: '$total' } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      { $sort: { revenue: -1 } },
    ];
    const [rows, totalAgg] = await Promise.all([
      OrderItem.aggregate([...pipeline, ...paginateStages(page, limit)]),
      OrderItem.aggregate([...pipeline, { $count: 'total' }]),
    ]);
    return { items: rows.map((r) => ({ categoryId: r._id, name: r.category?.name ?? 'Uncategorized', quantity: r.quantity, revenue: r.revenue })), meta: buildPaginationMeta(page, limit, totalAgg[0]?.total ?? 0) };
  },

  async getSalesByBrand({ dateFrom, dateTo, page, limit }) {
    const orderMatch = { orderStatus: { $in: SETTLED_STATUSES }, ...dateMatch(dateFrom, dateTo) };
    const pipeline = [
      { $lookup: { from: 'orders', localField: 'order', foreignField: '_id', as: 'order' } },
      { $unwind: '$order' },
      { $match: Object.fromEntries(Object.entries(orderMatch).map(([k, v]) => [`order.${k}`, v])) },
      { $lookup: { from: 'products', localField: 'product', foreignField: '_id', as: 'productDoc' } },
      { $unwind: '$productDoc' },
      { $group: { _id: '$productDoc.brand', quantity: { $sum: '$quantity' }, revenue: { $sum: '$total' } } },
      { $lookup: { from: 'brands', localField: '_id', foreignField: '_id', as: 'brand' } },
      { $unwind: { path: '$brand', preserveNullAndEmptyArrays: true } },
      { $sort: { revenue: -1 } },
    ];
    const [rows, totalAgg] = await Promise.all([
      OrderItem.aggregate([...pipeline, ...paginateStages(page, limit)]),
      OrderItem.aggregate([...pipeline, { $count: 'total' }]),
    ]);
    return { items: rows.map((r) => ({ brandId: r._id, name: r.brand?.name ?? 'Unbranded', quantity: r.quantity, revenue: r.revenue })), meta: buildPaginationMeta(page, limit, totalAgg[0]?.total ?? 0) };
  },

  async getSalesByCustomer({ dateFrom, dateTo, page, limit }) {
    const match = { orderStatus: { $in: SETTLED_STATUSES }, ...dateMatch(dateFrom, dateTo) };
    const pipeline = [
      { $match: match },
      { $group: { _id: '$customer', orderCount: { $sum: 1 }, revenue: { $sum: '$grandTotal' } } },
      { $lookup: { from: 'customers', localField: '_id', foreignField: '_id', as: 'customer' } },
      { $unwind: '$customer' },
      { $sort: { revenue: -1 } },
    ];
    const [rows, totalAgg] = await Promise.all([
      Order.aggregate([...pipeline, ...paginateStages(page, limit)]),
      Order.aggregate([...pipeline, { $count: 'total' }]),
    ]);
    return {
      items: rows.map((r) => ({ customerId: r._id, name: r.customer.displayName, customerCode: r.customer.customerCode, orderCount: r.orderCount, revenue: r.revenue })),
      meta: buildPaginationMeta(page, limit, totalAgg[0]?.total ?? 0),
    };
  },

  // Groups by the staff member who created the order - the closest real
  // proxy to a "salesperson" until Order gains a dedicated field
  // (future-ready per the spec, honest about what data actually exists
  // today rather than fabricating a salesperson concept).
  async getSalesBySalesperson({ dateFrom, dateTo }) {
    const match = { orderStatus: { $in: SETTLED_STATUSES }, ...dateMatch(dateFrom, dateTo) };
    const rows = await Order.aggregate([
      { $match: match },
      { $group: { _id: '$createdBy', orderCount: { $sum: 1 }, revenue: { $sum: '$grandTotal' } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $sort: { revenue: -1 } },
    ]);
    return rows.map((r) => ({ userId: r._id, name: r.user?.name ?? 'Unknown', orderCount: r.orderCount, revenue: r.revenue }));
  },

  async getSalesByDate({ dateFrom, dateTo }) {
    const match = { orderStatus: { $in: SETTLED_STATUSES }, ...dateMatch(dateFrom, dateTo) };
    return Order.aggregate([
      { $match: match },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, orderCount: { $sum: 1 }, revenue: { $sum: '$grandTotal' } } },
      { $sort: { _id: 1 } },
    ]);
  },

  // Thin proxies over already-existing, already-filterable list endpoints -
  // "No duplicate code": Cancelled Orders and Refunds are just Orders/
  // OrderRefunds filtered a certain way, not a new aggregation.
  getCancelledOrders(query) {
    return orderRepository.findPaginated({ ...query, orderStatus: 'cancelled' });
  },

  getRefunds(query) {
    return orderRefundRepository.findPaginated(query);
  },
};
