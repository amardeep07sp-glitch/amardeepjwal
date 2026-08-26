import mongoose from 'mongoose';
import { Order } from './order.model.js';
import { OrderItem } from './orderItem.model.js';
import { ORDER_STATUSES } from './order.constants.js';

// A "real" order for eligibility purposes (promotion engine's new/first-
// order/existing-customer checks) - draft never left the cart, cancelled
// never became a sale. Everything else (pending onward) reflects genuine
// purchase intent, even if it later fails to ship.
const REAL_ORDER_STATUSES = Object.values(ORDER_STATUSES).filter(
  (status) => ![ORDER_STATUSES.DRAFT, ORDER_STATUSES.CANCELLED].includes(status)
);

const POPULATE_FIELDS = [
  { path: 'customer', select: 'displayName firstName lastName email phone customerCode' },
  { path: 'warehouse', select: 'name code' },
  { path: 'billingAddress' },
  { path: 'shippingAddress' },
  { path: 'createdBy', select: 'name' },
  { path: 'updatedBy', select: 'name' },
];

export const orderRepository = {
  async findPaginated({ page, limit, orderStatus, paymentStatus, source, warehouse, customer, dateFrom, dateTo, search, sortBy, sortOrder }) {
    const filter = {};
    if (orderStatus) filter.orderStatus = orderStatus;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (source) filter.source = source;
    if (warehouse) filter.warehouse = warehouse;
    if (customer) filter.customer = customer;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }
    if (search) {
      // A scanned barcode always resolves to a product/sku before it's ever
      // added as a line item (see order.controller.js#lookupByBarcode), so
      // searching OrderItem.sku doubles as "search by barcode" without a
      // second join back through the Barcode collection.
      const matchingOrderIds = await OrderItem.find({ sku: { $regex: search, $options: 'i' } }).distinct('order');
      filter.$or = [{ orderNumber: { $regex: search, $options: 'i' } }, { _id: { $in: matchingOrderIds } }];
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Order.find(filter).populate(POPULATE_FIELDS).sort(sort).skip(skip).limit(limit),
      Order.countDocuments(filter),
    ]);

    return { items, total };
  },

  findById(id) {
    return Order.findById(id).populate(POPULATE_FIELDS);
  },

  // Unpopulated - used internally by services that only need raw fields
  // (status transitions, totals) inside a transaction.
  findRawById(id, session) {
    return Order.findById(id).session(session ?? null);
  },

  findByOrderNumber(orderNumber) {
    return Order.findOne({ orderNumber });
  },

  async create(data, session) {
    const [created] = await Order.create([data], { session: session ?? undefined });
    return created;
  },

  async updateById(id, data, session) {
    const existing = await Order.findById(id).session(session ?? null);
    if (!existing) return null;
    Object.assign(existing, data);
    return existing.save({ session: session ?? undefined });
  },

  deleteById(id) {
    return Order.findByIdAndDelete(id);
  },

  // Backs the CRM's "Order Integration" section (Lifetime Value, order
  // count) - customer/customer.pdf.js's statement export and the Customer
  // detail page's Orders tab both read this rather than re-aggregating.
  // Backs the CRM Dashboard's "Returning Customers" stat card - a customer
  // counts as returning once they have 2+ orders (paid or unpaid, since
  // "returning" is about repeat engagement, not necessarily repeat revenue).
  async countReturningCustomers() {
    const rows = await Order.aggregate([
      { $group: { _id: '$customer', orderCount: { $sum: 1 } } },
      { $match: { orderCount: { $gte: 2 } } },
      { $count: 'total' },
    ]);
    return rows[0]?.total ?? 0;
  },

  async getCustomerOrderSummary(customerId) {
    const [row] = await Order.aggregate([
      { $match: { customer: new mongoose.Types.ObjectId(customerId), paymentStatus: { $in: ['paid', 'partially_paid'] } } },
      { $group: { _id: null, orderCount: { $sum: 1 }, lifetimeValue: { $sum: '$grandTotal' } } },
    ]);
    return { orderCount: row?.orderCount ?? 0, lifetimeValue: row?.lifetimeValue ?? 0 };
  },

  async getDashboardTotals() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [statusCounts, revenueAgg, todayCount] = await Promise.all([
      Order.aggregate([{ $group: { _id: '$orderStatus', count: { $sum: 1 } } }]),
      Order.aggregate([
        { $match: { paymentStatus: { $in: ['paid', 'partially_paid'] } } },
        { $group: { _id: null, totalRevenue: { $sum: '$grandTotal' }, orderCount: { $sum: 1 } } },
      ]),
      Order.countDocuments({ createdAt: { $gte: startOfToday } }),
    ]);

    const countsByStatus = Object.fromEntries(statusCounts.map((row) => [row._id, row.count]));
    const revenue = revenueAgg[0] ?? { totalRevenue: 0, orderCount: 0 };

    return {
      todayOrders: todayCount,
      countsByStatus,
      totalRevenue: revenue.totalRevenue,
      averageOrderValue: revenue.orderCount > 0 ? revenue.totalRevenue / revenue.orderCount : 0,
    };
  },

  // One point per day for the last N days - zero-filled by the service
  // layer for days with no orders, so the chart never has to guess.
  getSalesTrend(sinceDate) {
    return Order.aggregate([
      { $match: { createdAt: { $gte: sinceDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orders: { $sum: 1 },
          revenue: { $sum: '$grandTotal' },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  },

  getStatusDistribution() {
    return Order.aggregate([{ $group: { _id: '$orderStatus', count: { $sum: 1 } } }]);
  },

  getPaymentBreakdown() {
    return Order.aggregate([
      { $match: { paymentMethod: { $ne: null } } },
      { $group: { _id: '$paymentMethod', count: { $sum: 1 }, amount: { $sum: '$grandTotal' } } },
    ]);
  },

  findAllForExport(filter = {}) {
    return Order.find(filter).populate(POPULATE_FIELDS).sort({ createdAt: -1 });
  },

  // The promotion engine's own real "has this customer ordered before"
  // check (coupon/eligibility.service.js) - never trusts a frontend flag.
  countRealOrdersByCustomer(customerId) {
    return Order.countDocuments({ customer: customerId, orderStatus: { $in: REAL_ORDER_STATUSES } });
  },
};
