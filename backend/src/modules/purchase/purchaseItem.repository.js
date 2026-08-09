import { PurchaseItem } from './purchaseItem.model.js';

export const purchaseItemRepository = {
  findByPurchaseOrder(purchaseOrderId, session) {
    return PurchaseItem.find({ purchaseOrder: purchaseOrderId })
      .session(session ?? null)
      .populate({ path: 'product', select: 'name slug sku' })
      .populate({ path: 'variant', select: 'sku slug' });
  },

  findById(id, session) {
    return PurchaseItem.findById(id).session(session ?? null);
  },

  async insertMany(items, session) {
    return PurchaseItem.insertMany(items, { session: session ?? undefined });
  },

  // THE only method permitted to change receivedQuantity/pendingQuantity -
  // called exclusively by goodsReceiptNote.service.js#receiveGoods inside
  // its transaction.
  applyReceipt(id, receivedDelta, session) {
    return PurchaseItem.findByIdAndUpdate(
      id,
      { $inc: { receivedQuantity: receivedDelta, pendingQuantity: -receivedDelta } },
      { new: true, session: session ?? undefined }
    );
  },

  // THE only method permitted to change returnedQuantity - called
  // exclusively by purchaseReturn.service.js#completeReturn.
  applyReturn(id, returnedDelta, session) {
    return PurchaseItem.findByIdAndUpdate(
      id,
      { $inc: { returnedQuantity: returnedDelta } },
      { new: true, session: session ?? undefined }
    );
  },
};
