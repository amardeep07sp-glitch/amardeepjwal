import { GoodsReceiptNote } from './goodsReceiptNote.model.js';

export const goodsReceiptNoteRepository = {
  findByPurchaseOrder(purchaseOrderId) {
    return GoodsReceiptNote.find({ purchaseOrder: purchaseOrderId })
      .sort({ createdAt: -1 })
      .populate({ path: 'receivedBy', select: 'name' });
  },

  findById(id, session) {
    return GoodsReceiptNote.findById(id)
      .session(session ?? null)
      .populate({ path: 'receivedBy', select: 'name' })
      .populate({ path: 'items.purchaseItem', select: 'sku product unitCost' });
  },

  async create(data, session) {
    const [created] = await GoodsReceiptNote.create([data], { session: session ?? undefined });
    return created;
  },
};
