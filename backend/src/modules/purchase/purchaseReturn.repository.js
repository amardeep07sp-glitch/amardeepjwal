import { PurchaseReturn } from './purchaseReturn.model.js';

const POPULATE_FIELDS = [
  { path: 'purchaseOrder', select: 'poNumber warehouse' },
  { path: 'supplier', select: 'name supplierCode' },
];

export const purchaseReturnRepository = {
  async findPaginated({ page, limit, status, supplier, dateFrom, dateTo }) {
    const filter = {};
    if (status) filter.status = status;
    if (supplier) filter.supplier = supplier;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      PurchaseReturn.find(filter).populate(POPULATE_FIELDS).sort({ createdAt: -1 }).skip(skip).limit(limit),
      PurchaseReturn.countDocuments(filter),
    ]);

    return { items, total };
  },

  findByPurchaseOrder(purchaseOrderId) {
    return PurchaseReturn.find({ purchaseOrder: purchaseOrderId }).sort({ createdAt: -1 });
  },

  findById(id, session) {
    return PurchaseReturn.findById(id).session(session ?? null);
  },

  async create(data, session) {
    const [created] = await PurchaseReturn.create([data], { session: session ?? undefined });
    return created;
  },

  updateById(id, data, session) {
    return PurchaseReturn.findByIdAndUpdate(id, data, { new: true, session: session ?? undefined });
  },
};
