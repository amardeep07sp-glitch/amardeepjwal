import { PurchaseItem } from '../purchase/purchaseItem.model.js';
import { PurchaseReturn } from '../purchase/purchaseReturn.model.js';
import { purchaseOrderService } from '../purchase/purchaseOrder.service.js';
import { payablesService } from '../accounting/payables.service.js';
import { buildDateRangeMatch, buildPaginationMeta, paginateStages } from './reportFilters.util.js';

export const supplierReportsService = {
  // Thin proxy - Phase 9's Purchase Dashboard already computes this exact
  // ranking (order count + total value per supplier).
  getSupplierPerformance() {
    return purchaseOrderService.getSupplierPerformance();
  },

  // Thin proxy - Accounting's Payables IS the outstanding-payables view.
  getOutstandingPayables() {
    return payablesService.getOutstanding();
  },

  async getPurchaseVolume({ dateFrom, dateTo, page, limit }) {
    const dateMatch = buildDateRangeMatch('po.createdAt', dateFrom, dateTo);
    const pipeline = [
      { $lookup: { from: 'purchaseorders', localField: 'purchaseOrder', foreignField: '_id', as: 'po' } },
      { $unwind: '$po' },
      ...(dateMatch ? [{ $match: dateMatch }] : []),
      { $group: { _id: '$po.supplier', totalQuantity: { $sum: '$quantity' }, totalValue: { $sum: '$total' } } },
      { $lookup: { from: 'suppliers', localField: '_id', foreignField: '_id', as: 'supplier' } },
      { $unwind: '$supplier' },
      { $sort: { totalValue: -1 } },
    ];
    const [rows, totalAgg] = await Promise.all([
      PurchaseItem.aggregate([...pipeline, ...paginateStages(page, limit)]),
      PurchaseItem.aggregate([...pipeline, { $count: 'total' }]),
    ]);
    return {
      items: rows.map((r) => ({ supplierId: r._id, name: r.supplier.name, supplierCode: r.supplier.supplierCode, totalQuantity: r.totalQuantity, totalValue: r.totalValue })),
      meta: buildPaginationMeta(page, limit, totalAgg[0]?.total ?? 0),
    };
  },

  // Thin proxy - Accounting's Payables aging IS the supplier aging report.
  getSupplierAging(asOfDate) {
    return payablesService.getAgingReport(asOfDate);
  },

  async getPurchaseReturnsBySupplier({ page, limit }) {
    const pipeline = [
      { $group: { _id: '$supplier', returnCount: { $sum: 1 }, totalAmount: { $sum: '$amount' } } },
      { $lookup: { from: 'suppliers', localField: '_id', foreignField: '_id', as: 'supplier' } },
      { $unwind: '$supplier' },
      { $sort: { totalAmount: -1 } },
    ];
    const [rows, totalAgg] = await Promise.all([
      PurchaseReturn.aggregate([...pipeline, ...paginateStages(page, limit)]),
      PurchaseReturn.aggregate([...pipeline, { $count: 'total' }]),
    ]);
    return {
      items: rows.map((r) => ({ supplierId: r._id, name: r.supplier.name, supplierCode: r.supplier.supplierCode, returnCount: r.returnCount, totalAmount: r.totalAmount })),
      meta: buildPaginationMeta(page, limit, totalAgg[0]?.total ?? 0),
    };
  },
};
