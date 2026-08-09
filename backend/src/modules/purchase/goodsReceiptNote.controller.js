import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { goodsReceiptNoteService } from './goodsReceiptNote.service.js';
import { serializeGoodsReceiptNote, serializeGoodsReceiptNoteList } from './goodsReceiptNote.serializer.js';

export const listGrnsForPurchaseOrder = asyncHandler(async (req, res) => {
  const grns = await goodsReceiptNoteService.listForPurchaseOrder(req.params.purchaseOrderId);
  res.status(200).json(new ApiResponse(200, serializeGoodsReceiptNoteList(grns), 'Goods receipt notes fetched successfully'));
});

export const receiveGoods = asyncHandler(async (req, res) => {
  const grn = await goodsReceiptNoteService.receiveGoods(req.params.purchaseOrderId, req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, serializeGoodsReceiptNote(grn), 'Goods received successfully'));
});
