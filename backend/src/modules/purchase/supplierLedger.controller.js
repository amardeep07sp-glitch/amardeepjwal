import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { supplierLedgerService } from './supplierLedger.service.js';
import { serializeSupplierLedgerList } from './supplierLedger.serializer.js';

export const getSupplierLedger = asyncHandler(async (req, res) => {
  const result = await supplierLedgerService.getLedger(req.params.supplierId, req.query);
  res.status(200).json(
    new ApiResponse(200, { items: serializeSupplierLedgerList(result.items), meta: result.meta }, 'Supplier ledger fetched successfully')
  );
});
