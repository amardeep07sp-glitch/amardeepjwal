import mongoose from 'mongoose';
import { SupplierPayment } from './supplierPayment.model.js';

export const supplierPaymentRepository = {
  findBySupplier(supplierId) {
    return SupplierPayment.find({ supplier: supplierId }).sort({ createdAt: -1 });
  },

  findByPurchaseOrder(purchaseOrderId) {
    return SupplierPayment.find({ purchaseOrder: purchaseOrderId }).sort({ createdAt: -1 });
  },

  findById(id, session) {
    return SupplierPayment.findById(id).session(session ?? null);
  },

  async create(data, session) {
    const [created] = await SupplierPayment.create([data], { session: session ?? undefined });
    return created;
  },

  updateById(id, data, session) {
    return SupplierPayment.findByIdAndUpdate(id, data, { new: true, session: session ?? undefined });
  },

  // Aggregate's $match does NOT get Mongoose's automatic string->ObjectId
  // casting the way find()/findOne() do - purchaseOrderId must be cast
  // explicitly here, or this silently matches zero documents (the exact
  // Phase 7 bug class in orderPayment.repository.js#sumPaidByOrder).
  async sumPaidByPurchaseOrder(purchaseOrderId, session) {
    const [row] = await SupplierPayment.aggregate([
      { $match: { purchaseOrder: new mongoose.Types.ObjectId(purchaseOrderId), status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).session(session ?? null);
    return row?.total ?? 0;
  },
};
