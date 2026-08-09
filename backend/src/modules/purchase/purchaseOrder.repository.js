import { PurchaseOrder } from './purchaseOrder.model.js';
import { PO_STATUSES, PO_RECEIVABLE_STATUSES } from './purchase.constants.js';

const POPULATE_FIELDS = [
  { path: 'supplier', select: 'name supplierCode email phone gstNumber' },
  { path: 'warehouse', select: 'name code' },
  { path: 'createdBy', select: 'name' },
  { path: 'updatedBy', select: 'name' },
];

export const purchaseOrderRepository = {
  async findPaginated({ page, limit, status, paymentStatus, supplier, warehouse, dateFrom, dateTo, search, sortBy, sortOrder }) {
    const filter = {};
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (supplier) filter.supplier = supplier;
    if (warehouse) filter.warehouse = warehouse;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }
    if (search) filter.poNumber = { $regex: search, $options: 'i' };

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      PurchaseOrder.find(filter).populate(POPULATE_FIELDS).sort(sort).skip(skip).limit(limit),
      PurchaseOrder.countDocuments(filter),
    ]);

    return { items, total };
  },

  findById(id) {
    return PurchaseOrder.findById(id).populate(POPULATE_FIELDS);
  },

  findRawById(id, session) {
    return PurchaseOrder.findById(id).session(session ?? null);
  },

  findByPoNumber(poNumber) {
    return PurchaseOrder.findOne({ poNumber });
  },

  async create(data, session) {
    const [created] = await PurchaseOrder.create([data], { session: session ?? undefined });
    return created;
  },

  async updateById(id, data, session) {
    const existing = await PurchaseOrder.findById(id).session(session ?? null);
    if (!existing) return null;
    Object.assign(existing, data);
    return existing.save({ session: session ?? undefined });
  },

  async getDashboardTotals() {
    const [pendingPO, pendingGRN, valueAgg] = await Promise.all([
      PurchaseOrder.countDocuments({
        status: { $in: [PO_STATUSES.DRAFT, PO_STATUSES.PENDING, PO_STATUSES.APPROVED, PO_STATUSES.ORDERED] },
      }),
      PurchaseOrder.countDocuments({ status: { $in: PO_RECEIVABLE_STATUSES } }),
      PurchaseOrder.aggregate([
        { $match: { status: { $ne: PO_STATUSES.CANCELLED, $ne: PO_STATUSES.DRAFT } } },
        { $group: { _id: null, totalValue: { $sum: '$grandTotal' }, orderCount: { $sum: 1 } } },
      ]),
    ]);

    return {
      pendingPO,
      pendingGRN,
      purchaseValue: valueAgg[0]?.totalValue ?? 0,
      purchaseOrderCount: valueAgg[0]?.orderCount ?? 0,
    };
  },

  // One point per day for the last N days - zero-filled by the service
  // layer, same pattern as orderRepository.getSalesTrend.
  getPurchaseTrend(sinceDate) {
    return PurchaseOrder.aggregate([
      { $match: { createdAt: { $gte: sinceDate }, status: { $ne: PO_STATUSES.DRAFT } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orders: { $sum: 1 },
          value: { $sum: '$grandTotal' },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  },

  // Top suppliers by total committed purchase value - backs the "Supplier
  // Performance" dashboard chart.
  getSupplierPerformance(limit = 10) {
    return PurchaseOrder.aggregate([
      { $match: { status: { $ne: PO_STATUSES.DRAFT, $ne: PO_STATUSES.CANCELLED } } },
      { $group: { _id: '$supplier', orderCount: { $sum: 1 }, totalValue: { $sum: '$grandTotal' } } },
      { $sort: { totalValue: -1 } },
      { $limit: limit },
      { $lookup: { from: 'suppliers', localField: '_id', foreignField: '_id', as: 'supplier' } },
      { $unwind: '$supplier' },
      { $project: { _id: 0, supplierId: '$_id', name: '$supplier.name', orderCount: 1, totalValue: 1 } },
    ]);
  },
};
