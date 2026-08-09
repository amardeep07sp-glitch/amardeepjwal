import { Order } from '../order/order.model.js';
import { CustomerWallet } from '../customer/customerWallet.model.js';
import { CustomerLoyalty } from '../customer/customerLoyalty.model.js';
import { CustomerReferral } from '../customer/customerReferral.model.js';
import { customerRepository } from '../customer/customer.repository.js';
import { customerService } from '../customer/customer.service.js';
import { orderRepository } from '../order/order.repository.js';
import { buildPaginationMeta, paginateStages } from './reportFilters.util.js';

const SETTLED_STATUSES = ['confirmed', 'packed', 'ready_to_ship', 'shipped', 'partially_shipped', 'delivered', 'partially_delivered', 'completed'];

export const customerReportsService = {
  // Thin proxy - customerService already computes a zero-filled growth
  // series (Phase 8's Customer Dashboard) exactly like this report needs.
  getCustomerGrowth(days) {
    return customerService.getGrowthTrend(days);
  },

  async getCustomerLifetimeValue({ page, limit }) {
    const pipeline = [
      { $match: { orderStatus: { $in: SETTLED_STATUSES } } },
      { $group: { _id: '$customer', orderCount: { $sum: 1 }, lifetimeValue: { $sum: '$grandTotal' } } },
      { $lookup: { from: 'customers', localField: '_id', foreignField: '_id', as: 'customer' } },
      { $unwind: '$customer' },
      { $sort: { lifetimeValue: -1 } },
    ];
    const [rows, totalAgg] = await Promise.all([
      Order.aggregate([...pipeline, ...paginateStages(page, limit)]),
      Order.aggregate([...pipeline, { $count: 'total' }]),
    ]);
    return {
      items: rows.map((r) => ({ customerId: r._id, name: r.customer.displayName, customerCode: r.customer.customerCode, orderCount: r.orderCount, lifetimeValue: r.lifetimeValue })),
      meta: buildPaginationMeta(page, limit, totalAgg[0]?.total ?? 0),
    };
  },

  async getRepeatCustomers({ page, limit }) {
    const pipeline = [
      { $match: { orderStatus: { $in: SETTLED_STATUSES } } },
      { $group: { _id: '$customer', orderCount: { $sum: 1 } } },
      { $match: { orderCount: { $gte: 2 } } },
      { $lookup: { from: 'customers', localField: '_id', foreignField: '_id', as: 'customer' } },
      { $unwind: '$customer' },
      { $sort: { orderCount: -1 } },
    ];
    const [rows, totalAgg] = await Promise.all([
      Order.aggregate([...pipeline, ...paginateStages(page, limit)]),
      Order.aggregate([...pipeline, { $count: 'total' }]),
    ]);
    return {
      items: rows.map((r) => ({ customerId: r._id, name: r.customer.displayName, customerCode: r.customer.customerCode, orderCount: r.orderCount })),
      meta: buildPaginationMeta(page, limit, totalAgg[0]?.total ?? 0),
    };
  },

  async getNewCustomers({ dateFrom, dateTo, page, limit }) {
    const { items, total } = await customerRepository.findPaginated({ page, limit, dateFrom, dateTo, sortBy: 'createdAt', sortOrder: 'desc' });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  },

  async getWalletSummary() {
    const [row] = await CustomerWallet.aggregate([
      { $group: { _id: null, totalBalance: { $sum: '$balance' }, walletCount: { $sum: 1 }, averageBalance: { $avg: '$balance' } } },
    ]);
    return {
      totalBalance: row?.totalBalance ?? 0,
      walletCount: row?.walletCount ?? 0,
      averageBalance: row ? Math.round((row.averageBalance + Number.EPSILON) * 100) / 100 : 0,
    };
  },

  async getLoyaltySummary() {
    const rows = await CustomerLoyalty.aggregate([
      { $group: { _id: '$tier', count: { $sum: 1 }, totalPoints: { $sum: '$currentPoints' } } },
      { $sort: { totalPoints: -1 } },
    ]);
    return rows.map((r) => ({ tier: r._id, count: r.count, totalPoints: r.totalPoints }));
  },

  async getReferralSummary() {
    const rows = await CustomerReferral.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, totalRewardPoints: { $sum: '$rewardPoints' } } },
    ]);
    return rows.map((r) => ({ status: r._id, count: r.count, totalRewardPoints: r.totalRewardPoints }));
  },

  getVipCustomers(query) {
    return customerRepository.findPaginated({ ...query, status: 'vip' });
  },

  // Backs the Customer Reports summary card - "returning" customer count
  // reused from Order's own aggregate rather than recomputed here.
  countReturningCustomers() {
    return orderRepository.countReturningCustomers();
  },
};
