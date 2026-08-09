import mongoose from 'mongoose';
import { ApiError } from '../../utils/ApiError.js';
import { supplierRepository } from '../supplier/supplier.repository.js';
import { supplierLedgerRepository } from './supplierLedger.repository.js';

const buildPaginationMeta = (page, limit, totalItems) => ({
  page,
  limit,
  totalItems,
  totalPages: Math.max(1, Math.ceil(totalItems / limit)),
});

// ===========================================================================
// THE single choke-point for every change to what we owe a supplier - mirrors
// walletService.recordTransaction() / inventoryLedgerService.recordMovement()
// exactly in shape: validate -> apply delta -> write immutable ledger row ->
// commit. No other file may call supplierRepository.applyLedgerDelta().
//
// Deliberately has NO "never go negative" guard, unlike Wallet/Inventory -
// outstandingBalance going negative means the supplier is in credit (we
// overpaid, or a return exceeded what was still owed), which is valid,
// real-world accounting, not an error condition.
// ===========================================================================
export const supplierLedgerService = {
  async recordEntry(params, externalSession) {
    const { supplierId, type, amount, reason = '', referenceType = '', referenceId = null, performedBy = null } = params;

    const session = externalSession ?? (await mongoose.startSession());
    const ownsSession = !externalSession;
    if (ownsSession) session.startTransaction();

    try {
      const supplier = await supplierRepository.findRawById(supplierId, session);
      if (!supplier) throw new ApiError(404, 'Supplier not found');

      const balanceAfter = supplier.outstandingBalance + amount;
      await supplierRepository.applyLedgerDelta(supplierId, amount, session);

      const entry = await supplierLedgerRepository.create(
        { supplier: supplierId, type, amount, balanceAfter, reason, referenceType, referenceId, performedBy },
        session
      );

      if (ownsSession) await session.commitTransaction();
      return entry;
    } catch (err) {
      if (ownsSession) await session.abortTransaction();
      throw err;
    } finally {
      if (ownsSession) session.endSession();
    }
  },

  async getLedger(supplierId, { page, limit }) {
    const { items, total } = await supplierLedgerRepository.findPaginatedBySupplier(supplierId, { page, limit });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  },
};
