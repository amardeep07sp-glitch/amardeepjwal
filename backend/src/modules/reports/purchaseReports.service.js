import { PurchaseOrder } from '../purchase/purchaseOrder.model.js';
import { GoodsReceiptNote } from '../purchase/goodsReceiptNote.model.js';
import { purchaseOrderService } from '../purchase/purchaseOrder.service.js';
import { purchaseReturnRepository } from '../purchase/purchaseReturn.repository.js';
import { payablesService } from '../accounting/payables.service.js';
import { buildDateRangeMatch, buildPaginationMeta, paginateStages } from './reportFilters.util.js';

const NON_DRAFT_STATUSES = ['pending', 'approved', 'ordered', 'partially_received', 'received'];

function dateMatch(dateFrom, dateTo) {
  return buildDateRangeMatch('createdAt', dateFrom, dateTo) ?? {};
}

export const purchaseReportsService = {
  async getPurchaseSummary({ dateFrom, dateTo } = {}) {
    const match = { status: { $in: NON_DRAFT_STATUSES }, ...dateMatch(dateFrom, dateTo) };
    const [row] = await PurchaseOrder.aggregate([
      { $match: match },
      { $group: { _id: null, orderCount: { $sum: 1 }, totalValue: { $sum: '$grandTotal' }, totalTax: { $sum: '$tax' } } },
    ]);
    const orderCount = row?.orderCount ?? 0;
    const totalValue = row?.totalValue ?? 0;
    return {
      orderCount,
      totalValue,
      totalTax: row?.totalTax ?? 0,
      averagePurchaseValue: orderCount > 0 ? Math.round((totalValue / orderCount + Number.EPSILON) * 100) / 100 : 0,
    };
  },

  async getSupplierWisePurchase({ dateFrom, dateTo, page, limit }) {
    const match = { status: { $in: NON_DRAFT_STATUSES }, ...dateMatch(dateFrom, dateTo) };
    const pipeline = [
      { $match: match },
      { $group: { _id: '$supplier', orderCount: { $sum: 1 }, totalValue: { $sum: '$grandTotal' } } },
      { $lookup: { from: 'suppliers', localField: '_id', foreignField: '_id', as: 'supplier' } },
      { $unwind: '$supplier' },
      { $sort: { totalValue: -1 } },
    ];
    const [rows, totalAgg] = await Promise.all([
      PurchaseOrder.aggregate([...pipeline, ...paginateStages(page, limit)]),
      PurchaseOrder.aggregate([...pipeline, { $count: 'total' }]),
    ]);
    return {
      items: rows.map((r) => ({ supplierId: r._id, name: r.supplier.name, supplierCode: r.supplier.supplierCode, orderCount: r.orderCount, totalValue: r.totalValue })),
      meta: buildPaginationMeta(page, limit, totalAgg[0]?.total ?? 0),
    };
  },

  // Thin proxy - purchaseOrderService already computes this exact series
  // (Phase 9's Purchase Dashboard) - reused unchanged, not reimplemented.
  getPurchaseTrend(days) {
    return purchaseOrderService.getPurchaseTrend(days);
  },

  // Thin proxy - Accounting's Payables IS the outstanding-purchase view.
  getOutstandingPurchase() {
    return payablesService.getOutstanding();
  },

  async getGrnReport({ dateFrom, dateTo, page, limit }) {
    const match = dateMatch(dateFrom, dateTo);
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      GoodsReceiptNote.find(match)
        .populate({ path: 'purchaseOrder', select: 'poNumber supplier', populate: { path: 'supplier', select: 'name supplierCode' } })
        .populate({ path: 'receivedBy', select: 'name' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      GoodsReceiptNote.countDocuments(match),
    ]);
    return { items, meta: buildPaginationMeta(page, limit, total) };
  },

  // Thin proxy - Purchase Returns already have a fully filterable list.
  async getPurchaseReturnReport(query) {
    const { items, total } = await purchaseReturnRepository.findPaginated(query);
    return { items, meta: buildPaginationMeta(query.page, query.limit, total) };
  },
};
